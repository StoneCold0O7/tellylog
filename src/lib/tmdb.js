/* TellyLog — tmdb.js
   Thin TMDB v3 client. In-memory cache + small concurrency limiter.
   ESM port: identical behaviour, key read from the store module. */
import { apiKey } from './store.js';

const BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/';

let cache = {};        // url -> promise
let inFlight = 0;
const MAX_CONCURRENT = 4;
const queue = [];

function pump() {
  while (inFlight < MAX_CONCURRENT && queue.length > 0) {
    var job = queue.shift();
    inFlight++;
    job();
  }
}

function request(path, params) {
  var key = apiKey();
  if (!key) return Promise.reject(new Error('NO_KEY'));
  params = params || {};
  params.api_key = key;
  var qs = Object.keys(params).map(function (k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
  }).join('&');
  var url = BASE + path + '?' + qs;
  if (cache[url]) return cache[url];
  cache[url] = new Promise(function (resolve, reject) {
    queue.push(function () {
      fetch(url).then(function (res) {
        inFlight--; pump();
        if (res.status === 401) { reject(new Error('BAD_KEY')); return; }
        if (!res.ok) { reject(new Error('HTTP_' + res.status)); return; }
        res.json().then(resolve, reject);
      }, function (err) {
        inFlight--; pump();
        delete cache[url]; // allow retry on network failure
        reject(err);
      });
    });
    pump();
  });
  return cache[url];
}

export function img(path, size) {
  if (!path) return '';
  return IMG + (size || 'w185') + path;
}
export function validateKey(key) {
  var url = BASE + '/configuration?api_key=' + encodeURIComponent(key);
  return fetch(url).then(function (res) { return res.ok; });
}
export function searchTV(q) {
  return request('/search/tv', { query: q, include_adult: 'false' });
}
export function searchMovie(q, year) {
  var p = { query: q, include_adult: 'false' };
  if (year) p.year = String(year);
  return request('/search/movie', p);
}
export function searchMulti(q) {
  return request('/search/multi', { query: q, include_adult: 'false' });
}
export function tvDetails(id) {
  return request('/tv/' + id, {});
}
export function tvSeason(id, n) {
  return request('/tv/' + id + '/season/' + n, {});
}
export function movieDetails(id) {
  return request('/movie/' + id, {});
}
export function trendingTV() {
  return request('/trending/tv/week', {});
}
export function trendingMovies() {
  return request('/trending/movie/week', {});
}
export function clearCache() { cache = {}; }
