/* TellyLog — store.js
   Single source of truth. Persists to localStorage.
   ESM port of the original: logic unchanged, plus a subscribe/emit
   layer so React can re-render on changes. */
import * as U from './util.js';

const KEY = 'tellylog:v1';
const DEFAULT_RUNTIME = 40; // minutes, fallback when TMDB has no runtime

let state = null;

/* ---------- Change notification (new in the React port) ---------- */
let rev = 0;
const listeners = new Set();
function emit() {
  rev++;
  listeners.forEach(function (fn) { fn(); });
}
export function subscribe(fn) {
  listeners.add(fn);
  return function () { listeners.delete(fn); };
}
export function getRev() { return rev; }

/* Storage-full errors surface through this handler (the original
   called window.App.toast directly). */
let onSaveError = null;
export function setSaveErrorHandler(fn) { onSaveError = fn; }

function blank() {
  return {
    version: 1,
    settings: { apiKey: '', profileName: 'You' },
    shows: {},   // id -> show record
    movies: {},  // id -> movie record
    log: []      // [{k:'showId-s-e', showId, s, e, ts}]
  };
}

export function load() {
  try {
    var raw = localStorage.getItem(KEY);
    state = raw ? JSON.parse(raw) : blank();
  } catch (e) {
    state = blank();
  }
  if (!state.version) state = blank();
  return state;
}

var saveTimer = null;
export function save() {
  emit();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(function () {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      if (onSaveError) onSaveError('Storage is full. Export a backup, then clear old data.');
    }
  }, 150);
}

/* ---------- Show record shape ----------
   { id, name, poster, backdrop, status, network, avgRuntime,
     seasons: {n: epCount}, nextEp: {s,e,name,airDate}|null,
     lastEp: {s,e,name,airDate}|null,
     watched: {s: [e,...]}, lastWatchedAt, added, archived,
     detailsFetchedAt }
---------------------------------------- */

function showFromDetails(d) {
  var seasons = {};
  (d.seasons || []).forEach(function (s) {
    if (s.season_number > 0) seasons[s.season_number] = s.episode_count || 0;
  });
  var rt = (d.episode_run_time && d.episode_run_time[0]) || d.last_episode_to_air && d.last_episode_to_air.runtime || DEFAULT_RUNTIME;
  return {
    id: d.id,
    name: d.name || '',
    poster: d.poster_path || '',
    backdrop: d.backdrop_path || '',
    status: d.status || '',
    network: (d.networks && d.networks[0] && d.networks[0].name) || '',
    avgRuntime: rt,
    seasons: seasons,
    nextEp: d.next_episode_to_air ? {
      s: d.next_episode_to_air.season_number,
      e: d.next_episode_to_air.episode_number,
      name: d.next_episode_to_air.name || 'TBA',
      airDate: d.next_episode_to_air.air_date || ''
    } : null,
    lastEp: d.last_episode_to_air ? {
      s: d.last_episode_to_air.season_number,
      e: d.last_episode_to_air.episode_number,
      name: d.last_episode_to_air.name || '',
      airDate: d.last_episode_to_air.air_date || ''
    } : null,
    watched: {},
    lastWatchedAt: null,
    added: Date.now(),
    archived: false,
    detailsFetchedAt: Date.now()
  };
}

export function addShow(details) {
  if (state.shows[details.id]) return state.shows[details.id];
  state.shows[details.id] = showFromDetails(details);
  save();
  return state.shows[details.id];
}

export function refreshShowCache(id, details) {
  var sh = state.shows[id];
  if (!sh) return;
  var fresh = showFromDetails(details);
  sh.name = fresh.name; sh.poster = fresh.poster; sh.backdrop = fresh.backdrop;
  sh.status = fresh.status; sh.network = fresh.network; sh.avgRuntime = fresh.avgRuntime;
  sh.seasons = fresh.seasons; sh.nextEp = fresh.nextEp; sh.lastEp = fresh.lastEp;
  sh.detailsFetchedAt = Date.now();
  save();
}

export function removeShow(id) {
  delete state.shows[id];
  state.log = state.log.filter(function (l) { return l.showId !== id; });
  save();
}

export function setArchived(id, archived) {
  var sh = state.shows[id];
  if (sh) { sh.archived = !!archived; save(); }
}

export function isWatched(sh, s, e) {
  return !!(sh.watched[s] && sh.watched[s].indexOf(e) !== -1);
}

export function markEpisode(id, s, e, watched, ts) {
  var sh = state.shows[id];
  if (!sh) return;
  s = Number(s); e = Number(e);
  if (watched) {
    if (!sh.watched[s]) sh.watched[s] = [];
    if (sh.watched[s].indexOf(e) === -1) {
      sh.watched[s].push(e);
      sh.watched[s].sort(function (a, b) { return a - b; });
      state.log.push({ showId: id, s: s, e: e, ts: ts || Date.now() });
      sh.lastWatchedAt = Math.max(sh.lastWatchedAt || 0, ts || Date.now());
    }
  } else {
    if (sh.watched[s]) {
      sh.watched[s] = sh.watched[s].filter(function (x) { return x !== e; });
      if (sh.watched[s].length === 0) delete sh.watched[s];
    }
    state.log = state.log.filter(function (l) { return !(l.showId === id && l.s === s && l.e === e); });
  }
  save();
}

export function markSeason(id, s, epCount, watched) {
  for (var e = 1; e <= epCount; e++) markEpisode(id, s, e, watched);
}

export function watchedCount(sh) {
  var c = 0;
  for (var s in sh.watched) c += sh.watched[s].length;
  return c;
}

export function totalEpisodes(sh) {
  var c = 0;
  for (var s in sh.seasons) c += sh.seasons[s];
  return c;
}

// Next unwatched episode among known (aired-or-listed) seasons.
export function nextEpisodeFor(sh) {
  var seasonNums = Object.keys(sh.seasons).map(Number).sort(function (a, b) { return a - b; });
  for (var i = 0; i < seasonNums.length; i++) {
    var s = seasonNums[i];
    var count = sh.seasons[s];
    for (var e = 1; e <= count; e++) {
      if (!isWatched(sh, s, e)) return { s: s, e: e };
    }
  }
  return null;
}

export function remainingCount(sh) {
  return Math.max(0, totalEpisodes(sh) - watchedCount(sh));
}

/* ---------- Selectors ---------- */

var STALE_DAYS = 30;

export function watchNextList() {
  var now = Date.now();
  var fresh = [];
  var stale = [];
  Object.keys(state.shows).forEach(function (id) {
    var sh = state.shows[id];
    if (sh.archived) return;
    var next = nextEpisodeFor(sh);
    if (!next) return;
    var entry = { show: sh, next: next, remaining: remainingCount(sh) };
    var last = sh.lastWatchedAt || sh.added;
    if (now - last > STALE_DAYS * U.DAY_MS && sh.lastWatchedAt) stale.push(entry);
    else fresh.push(entry);
  });
  function byRecency(a, b) {
    return (b.show.lastWatchedAt || b.show.added) - (a.show.lastWatchedAt || a.show.added);
  }
  fresh.sort(byRecency);
  stale.sort(byRecency);
  return { next: fresh, stale: stale };
}

export function history(limit) {
  var entries = state.log.slice().sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
  if (limit) entries = entries.slice(0, limit);
  return entries.map(function (l) {
    return { show: state.shows[l.showId], s: l.s, e: l.e, ts: l.ts };
  }).filter(function (x) { return !!x.show; });
}

export function upcoming() {
  var out = [];
  Object.keys(state.shows).forEach(function (id) {
    var sh = state.shows[id];
    if (sh.archived) return;
    if (sh.lastEp && sh.lastEp.airDate) {
      var g = U.dayGroup(sh.lastEp.airDate, Date.now());
      if (g.label === 'YESTERDAY' || g.label === 'TODAY') {
        out.push({ show: sh, ep: sh.lastEp, group: g, aired: true });
      }
    }
    if (sh.nextEp && sh.nextEp.airDate) {
      var g2 = U.dayGroup(sh.nextEp.airDate, Date.now());
      if (g2.label !== 'EARLIER') out.push({ show: sh, ep: sh.nextEp, group: g2, aired: false });
    }
  });
  out.sort(function (a, b) { return a.group.order - b.group.order; });
  return out;
}

export function stats() {
  var episodes = 0;
  var tvMinutes = 0;
  var showCount = 0;
  Object.keys(state.shows).forEach(function (id) {
    var sh = state.shows[id];
    showCount++;
    var c = watchedCount(sh);
    episodes += c;
    tvMinutes += c * (sh.avgRuntime || DEFAULT_RUNTIME);
  });
  var moviesWatched = 0;
  var movieMinutes = 0;
  Object.keys(state.movies).forEach(function (id) {
    var mv = state.movies[id];
    if (mv.watchedAt) {
      moviesWatched++;
      movieMinutes += mv.runtime || 100;
    }
  });
  return {
    episodes: episodes,
    tvMinutes: tvMinutes,
    tvTime: U.fmtTvTime(tvMinutes),
    shows: showCount,
    moviesWatched: moviesWatched,
    movieMinutes: movieMinutes,
    movieTime: U.fmtTvTime(movieMinutes)
  };
}

/* ---------- Movies ---------- */
function movieFromDetails(d) {
  return {
    id: d.id,
    title: d.title || '',
    poster: d.poster_path || '',
    runtime: d.runtime || 0,
    genres: (d.genres || []).map(function (g) { return g.name; }).slice(0, 2).join(', '),
    releaseDate: d.release_date || '',
    watchlist: true,
    watchedAt: null,
    added: Date.now()
  };
}

export function addMovie(details) {
  if (!state.movies[details.id]) {
    state.movies[details.id] = movieFromDetails(details);
    save();
  }
  return state.movies[details.id];
}

export function removeMovie(id) { delete state.movies[id]; save(); }

export function setMovieWatched(id, watched, ts) {
  var mv = state.movies[id];
  if (!mv) return;
  mv.watchedAt = watched ? (ts || Date.now()) : null;
  save();
}

/* ---------- Import / export ---------- */

export function exportJSON() {
  return JSON.stringify(state, null, 2);
}

export function restoreJSON(text) {
  var obj = JSON.parse(text);
  if (!obj || obj.version !== 1 || !obj.shows) throw new Error('Not a TellyLog backup file.');
  state = obj;
  save();
}

export function clearAll() {
  state = blank();
  save();
}

// batch: [{details, episodes:[{s,e,ts}]}] for shows,
//        [{movieDetails, ts}] for movies
export function importShowBatch(details, episodes) {
  var sh = state.shows[details.id] || addShow(details);
  refreshShowCache(details.id, details);
  sh = state.shows[details.id];
  episodes.forEach(function (ep) {
    markEpisode(details.id, ep.s, ep.e, true, ep.ts || null);
  });
  save();
  return sh;
}

export function importMovie(details, ts) {
  var mv = addMovie(details);
  mv.watchlist = false;
  mv.watchedAt = ts || Date.now();
  save();
}

// Adds a film to the watchlist without marking it watched
// (used by Letterboxd watchlist.csv imports).
export function importMovieToWatchlist(details) {
  var mv = addMovie(details);
  if (!mv.watchedAt) mv.watchlist = true;
  save();
}

export function get() { return state; }
export function setApiKey(k) { state.settings.apiKey = k.trim(); save(); }
export function apiKey() { return state.settings.apiKey; }
