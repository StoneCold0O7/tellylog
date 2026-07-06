/* TellyLog - tmdb.js
   Thin TMDB v3 client. In-memory cache + small concurrency limiter.
   Phase 2: on first use the client asks /api/health (once) whether the
   deployment has a server-side TMDB proxy. If yes, every request goes
   through /api/tmdb/... and no browser key is needed or sent. If no
   (env var absent, static hosting, local dev), behaviour is byte-for-
   byte what it was before: direct calls with the browser-stored key. */
import { apiKey } from './store.js';
import { checkHealth } from './ai.js';

const BASE = 'https://api.themoviedb.org/3';
const PROXY = '/api/tmdb/';
const IMG = 'https://image.tmdb.org/t/p/';
const MODE_TIMEOUT_MS = 4000; // never hold first paint hostage to a slow probe

let cache = {};        // url -> promise
let inFlight = 0;
const MAX_CONCURRENT = 4;
const queue = [];

/* 'proxy' | 'direct', decided once per page load. */
let modePromise = null;
export function ready() {
  if (modePromise) return modePromise;
  var probe = Promise.resolve()
    .then(function () { return checkHealth(); })
    .then(function (h) { return h && h.tmdbProxy ? 'proxy' : 'direct'; })
    .catch(function () { return 'direct'; });
  var clock = new Promise(function (resolve) {
    setTimeout(function () { resolve('direct'); }, MODE_TIMEOUT_MS);
  });
  modePromise = Promise.race([probe, clock]);
  return modePromise;
}

function pump() {
  while (inFlight < MAX_CONCURRENT && queue.length > 0) {
    var job = queue.shift();
    inFlight++;
    job();
  }
}

function fetchQueued(url, viaProxy) {
  if (cache[url]) return cache[url];
  cache[url] = new Promise(function (resolve, reject) {
    queue.push(function () {
      fetch(url).then(function (res) {
        inFlight--; pump();
        if (res.status === 401 && !viaProxy) { reject(new Error('BAD_KEY')); return; }
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

function request(path, params) {
  params = params || {};
  return ready().then(function (mode) {
    var p = Object.assign({}, params);
    var url;
    if (mode === 'proxy') {
      /* Server appends the key; never send one from the browser. */
      var qs = Object.keys(p).map(function (k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(p[k]);
      }).join('&');
      url = PROXY + path.replace(/^\//, '') + (qs ? '?' + qs : '');
      return fetchQueued(url, true);
    }
    var key = apiKey();
    if (!key) return Promise.reject(new Error('NO_KEY'));
    p.api_key = key;
    var qs2 = Object.keys(p).map(function (k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(p[k]);
    }).join('&');
    url = BASE + path + '?' + qs2;
    return fetchQueued(url, false);
  });
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
export function tvCredits(id) {
  return request('/tv/' + id + '/credits', {});
}
export function tvProviders(id) {
  return request('/tv/' + id + '/watch/providers', {});
}
export function tvVideos(id) {
  return request('/tv/' + id + '/videos', {});
}
export function tvRecommendations(id) {
  return request('/tv/' + id + '/recommendations', {});
}
export function movieDetails(id) {
  return request('/movie/' + id, {});
}
export function movieCredits(id) {
  return request('/movie/' + id + '/credits', {});
}
export function movieProviders(id) {
  return request('/movie/' + id + '/watch/providers', {});
}
export function movieVideos(id) {
  return request('/movie/' + id + '/videos', {});
}
export function movieRecommendations(id) {
  return request('/movie/' + id + '/recommendations', {});
}
export function trendingTV() {
  return request('/trending/tv/week', {});
}
export function trendingMovies() {
  return request('/trending/movie/week', {});
}
export function popularTV() {
  return request('/tv/popular', {});
}
export function popularMovies() {
  return request('/movie/popular', {});
}
export function clearCache() { cache = {}; }
