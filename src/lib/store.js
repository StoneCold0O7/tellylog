/* TellyLog - store.js
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
    settings: { apiKey: '', profileName: 'You', theme: 'dark', gridSeen: false },
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
    /* v2.5.0 additive field: true means the show is saved to watch
       later and has not been started. Cleared automatically on the
       first watched episode. Old records lack it and read as falsy,
       which is the correct meaning for anything already tracked. */
    watchlist: false,
    detailsFetchedAt: Date.now(),
    /* Phase 2b additive field: full TMDB genre names, used by the
       profile charts. Old records lack it; genreBackfillList() finds
       them and the profile fills them in once. */
    genreList: (d.genres || []).map(function (g) { return g.name; })
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
  if (fresh.genreList && fresh.genreList.length) sh.genreList = fresh.genreList;
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

/* v2.5.0: TV watchlist. Mirrors the film watchlist semantics: saved,
   not started. Starting the show (first watched episode) clears the
   flag automatically inside markEpisode. */
export function addShowToWatchlist(details) {
  var sh = addShow(details);
  if (sh && watchedCount(sh) === 0) { sh.watchlist = true; save(); }
  return sh;
}

export function setShowWatchlist(id, on) {
  var sh = state.shows[id];
  if (sh) { sh.watchlist = !!on; save(); }
}

/* Watchlisted, unstarted shows, newest saved first. */
export function watchlistShows() {
  var out = [];
  Object.keys(state.shows).forEach(function (id) {
    var sh = state.shows[id];
    if (sh.watchlist && watchedCount(sh) === 0) out.push(sh);
  });
  out.sort(function (a, b) { return (b.added || 0) - (a.added || 0); });
  return out;
}

/* "Keep" on a stale show: resets its staleness clock without faking a
   watch event. keptAt is additive; old data without it behaves as before. */
export function keepShow(id) {
  var sh = state.shows[id];
  if (sh) { sh.keptAt = Date.now(); save(); }
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
      /* v2.5.0: watching anything means the show is started, so it
         leaves the watchlist without a second tap. */
      if (sh.watchlist) sh.watchlist = false;
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
    /* v2.5.0: watchlisted shows are saved-for-later, not queued. They
       live in the WATCHLIST section until started. */
    if (sh.watchlist && watchedCount(sh) === 0) return;
    var next = nextEpisodeFor(sh);
    if (!next) return;
    var entry = { show: sh, next: next, remaining: remainingCount(sh) };
    var activity = Math.max(sh.lastWatchedAt || 0, sh.keptAt || 0);
    var last = activity || sh.added;
    if (now - last > STALE_DAYS * U.DAY_MS && activity) stale.push(entry);
    else fresh.push(entry);
  });
  function byRecency(a, b) {
    function act(sh) { return Math.max(sh.lastWatchedAt || 0, sh.keptAt || 0) || sh.added; }
    return act(b.show) - act(a.show);
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
    /* Phase 2b: the display string above is lossy (top 2, joined), so
       charts use this full list. Additive; old records lack it. */
    genreList: (d.genres || []).map(function (g) { return g.name; }),
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

/* Home nudge: the started, unarchived show closest to being finished
   (3 or fewer episodes left). excludeId lets the UI skip the show the
   Tonight card already features. */
export function nudgePick(excludeId) {
  var best = null;
  Object.keys(state.shows).forEach(function (id) {
    var sh = state.shows[id];
    if (sh.archived) return;
    if (excludeId != null && sh.id === excludeId) return;
    if (watchedCount(sh) === 0) return;
    var rem = remainingCount(sh);
    if (rem < 1 || rem > 3) return;
    if (!best || rem < best.remaining) best = { show: sh, remaining: rem };
  });
  return best;
}

/* Archived shows, most recently active first. Used by the home
   ARCHIVED section and the profile list view. */
export function archivedShows() {
  var out = [];
  Object.keys(state.shows).forEach(function (id) {
    var sh = state.shows[id];
    if (sh.archived) out.push(sh);
  });
  out.sort(function (a, b) {
    return (b.lastWatchedAt || b.added) - (a.lastWatchedAt || a.added);
  });
  return out;
}

/* Watched timestamps for one show as a {'s-e': ts} map. Built once per
   modal render so episode rows avoid an O(log) scan each. */
export function watchedMapFor(showId) {
  var map = {};
  state.log.forEach(function (l) {
    if (l.showId === showId) map[l.s + '-' + l.e] = l.ts || 0;
  });
  return map;
}

/* Compact plain-text library summary for the Phase 2 ask box. Sent to
   the serverless endpoint as LLM context. Pure read, no persistence. */
export function librarySummary(maxShows, maxMovies) {
  maxShows = maxShows || 30;
  maxMovies = maxMovies || 20;
  var lines = [];
  var shows = Object.keys(state.shows).map(function (id) { return state.shows[id]; });
  shows.sort(function (a, b) { return (b.lastWatchedAt || b.added) - (a.lastWatchedAt || a.added); });
  shows.slice(0, maxShows).forEach(function (sh) {
    var seen = watchedCount(sh);
    var total = totalEpisodes(sh);
    var bits = [sh.name, seen + '/' + total + ' eps'];
    if (sh.status) bits.push(sh.status);
    if (sh.archived) bits.push('dropped');
    if (sh.watchlist && seen === 0) bits.push('on watchlist, not started');
    lines.push('- ' + bits.join(', '));
  });
  var watched = [];
  var wishlist = [];
  Object.keys(state.movies).forEach(function (id) {
    var mv = state.movies[id];
    if (mv.watchedAt) watched.push(mv.title);
    else if (mv.watchlist) wishlist.push(mv.title);
  });
  var out = '';
  if (lines.length) out += 'TV shows tracked:\n' + lines.join('\n');
  if (watched.length) out += '\nFilms watched: ' + watched.slice(0, maxMovies).join('; ');
  if (wishlist.length) out += '\nFilm watchlist: ' + wishlist.slice(0, maxMovies).join('; ');
  return out.trim();
}

export function get() { return state; }

/* ---------- Phase 2b: genre backfill + chart data ----------
   Charts weight by WATCHED MINUTES, not title count, so a 200-episode
   sitcom and a 6-episode miniseries are not treated as equals. Items
   still missing genreList contribute to `unattributed` so the charts
   never silently misrepresent coverage. */

export function genreBackfillList() {
  var out = [];
  Object.keys(state.shows).forEach(function (id) {
    if (!Array.isArray(state.shows[id].genreList)) out.push({ kind: 'tv', id: state.shows[id].id });
  });
  Object.keys(state.movies).forEach(function (id) {
    if (!Array.isArray(state.movies[id].genreList)) out.push({ kind: 'movie', id: state.movies[id].id });
  });
  return out;
}

export function setGenres(kind, id, names) {
  var rec = kind === 'movie' ? state.movies[id] : state.shows[id];
  if (!rec) return;
  rec.genreList = (names || []).map(String);
  save();
}

function showMinutes(sh) {
  return watchedCount(sh) * (sh.avgRuntime || DEFAULT_RUNTIME);
}

/* rows: [{genre, minutes}] desc. Multi-genre titles contribute their
   full minutes to EVERY genre they carry, so rows overlap by design
   and must never be summed to a total. primaryOnly=true credits only
   the first TMDB genre, which is the honest basis for a pie. */
export function genreMinutes(primaryOnly) {
  var map = {};
  var unattributed = 0;
  var total = 0;
  function credit(list, minutes) {
    if (!minutes) return;
    total += minutes;
    if (!Array.isArray(list) || list.length === 0) { unattributed += minutes; return; }
    var names = primaryOnly ? [list[0]] : list;
    names.forEach(function (g) { map[g] = (map[g] || 0) + minutes; });
  }
  Object.keys(state.shows).forEach(function (id) {
    credit(state.shows[id].genreList, showMinutes(state.shows[id]));
  });
  Object.keys(state.movies).forEach(function (id) {
    var mv = state.movies[id];
    if (mv.watchedAt) credit(mv.genreList, mv.runtime || 100);
  });
  var rows = Object.keys(map).map(function (g) { return { genre: g, minutes: map[g] }; });
  rows.sort(function (a, b) { return b.minutes - a.minutes; });
  return { rows: rows, unattributed: unattributed, total: total };
}

function monthKey(ts) {
  var d = new Date(ts);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

/* v2.5.0: chart drill-down. Titles contributing to one genre, with
   their watched minutes, desc. primaryOnly must match the chart that
   was clicked: bars credit every genre, the donut credits only the
   first, so the two lists legitimately differ for the same genre. */
export function genreTitles(genre, primaryOnly) {
  var out = [];
  function consider(list, minutes, title, kind) {
    if (!minutes || !Array.isArray(list) || list.length === 0) return;
    var names = primaryOnly ? [list[0]] : list;
    if (names.indexOf(genre) !== -1) out.push({ title: title, minutes: minutes, kind: kind });
  }
  Object.keys(state.shows).forEach(function (id) {
    var sh = state.shows[id];
    consider(sh.genreList, showMinutes(sh), sh.name, 'tv');
  });
  Object.keys(state.movies).forEach(function (id) {
    var mv = state.movies[id];
    if (mv.watchedAt) consider(mv.genreList, mv.runtime || 100, mv.title, 'movie');
  });
  out.sort(function (a, b) { return b.minutes - a.minutes; });
  return out;
}

/* v2.5.0: chart drill-down for the activity line. What was logged in
   one month key ('YYYY-MM'), aggregated per title, desc by minutes. */
export function monthTitles(key) {
  var map = {};
  state.log.forEach(function (l) {
    if (!l.ts || monthKey(l.ts) !== key) return;
    var sh = state.shows[l.showId];
    if (!sh) return;
    if (!map[sh.name]) map[sh.name] = { title: sh.name, minutes: 0, count: 0, kind: 'tv' };
    map[sh.name].minutes += sh.avgRuntime || DEFAULT_RUNTIME;
    map[sh.name].count++;
  });
  Object.keys(state.movies).forEach(function (id) {
    var mv = state.movies[id];
    if (mv.watchedAt && monthKey(mv.watchedAt) === key) {
      map[mv.title] = { title: mv.title, minutes: mv.runtime || 100, count: 1, kind: 'movie' };
    }
  });
  var out = Object.keys(map).map(function (k) { return map[k]; });
  out.sort(function (a, b) { return b.minutes - a.minutes; });
  return out;
}

/* Contiguous months from the earliest logged watch to the latest,
   zero-filled, minutes from episode log timestamps plus film
   watchedAt. Timestamps are LOGGING time (imports carry the export's
   real dates; a bulk season tick lands in the month it was ticked). */
export function monthlyMinutes() {
  var map = {};
  state.log.forEach(function (l) {
    if (!l.ts) return;
    var sh = state.shows[l.showId];
    if (!sh) return;
    var k = monthKey(l.ts);
    map[k] = (map[k] || 0) + (sh.avgRuntime || DEFAULT_RUNTIME);
  });
  Object.keys(state.movies).forEach(function (id) {
    var mv = state.movies[id];
    if (mv.watchedAt) {
      var k2 = monthKey(mv.watchedAt);
      map[k2] = (map[k2] || 0) + (mv.runtime || 100);
    }
  });
  var keys = Object.keys(map).sort();
  if (keys.length === 0) return [];
  var out = [];
  var first = keys[0].split('-').map(Number);
  var last = keys[keys.length - 1].split('-').map(Number);
  var y = first[0], m = first[1];
  while (y < last[0] || (y === last[0] && m <= last[1])) {
    var k3 = y + '-' + String(m).padStart(2, '0');
    out.push({ key: k3, minutes: map[k3] || 0 });
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return out;
}

export function setApiKey(k) { state.settings.apiKey = k.trim(); save(); }
export function apiKey() { return state.settings.apiKey; }

/* v2.5.0 additive settings fields: avatar and cover as small
   compressed data URLs. They ride inside backups like every other
   setting; the UI downscales before calling these so a phone photo
   cannot blow the localStorage quota. null clears. */
export function setAvatar(dataUrl) { state.settings.avatar = dataUrl || ''; save(); }
export function avatar() { return state.settings.avatar || ''; }
export function setCover(dataUrl) { state.settings.cover = dataUrl || ''; save(); }
export function cover() { return state.settings.cover || ''; }
export function theme() { return state.settings.theme === 'light' ? 'light' : 'dark'; }
export function setTheme(t) { state.settings.theme = t === 'light' ? 'light' : 'dark'; save(); }
export function gridSeen() { return !!state.settings.gridSeen; }
export function setGridSeen() { state.settings.gridSeen = true; save(); }
