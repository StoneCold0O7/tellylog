/* v2.6.0: voice insights, the deterministic path. Per the audit ruling
   on the record since v2.4.0: questions about the user's OWN stats
   have exact answers sitting in the store, so they are answered
   locally with zero LLM calls, zero cost and zero latency. The LLM is
   never consulted here; an unmatched question gets a help line, not a
   guess. Pure functions over the store so the whole matcher is
   testable in node. */
import * as Store from './store.js';

function fmtH(min) {
  if (!min) return '0 hours';
  var h = Math.round(min / 60);
  if (h < 1) return Math.round(min) + ' minutes';
  return h + (h === 1 ? ' hour' : ' hours');
}

function monthName(key) {
  var parts = key.split('-');
  var d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
  return d.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
}

/* Returns a plain-English answer string, or null when no intent
   matches (the caller renders the help line). */
export function answerInsight(raw) {
  var q = String(raw || '').toLowerCase();
  if (!q.trim()) return null;
  var st = Store.stats();

  /* top genre */
  if (/genre/.test(q)) {
    var g = Store.genreMinutes(false).rows;
    if (!g.length) return 'No genre data yet. Open your stats once so genre info can backfill from TMDB.';
    var line = 'Your top genre is ' + g[0].genre + ' at about ' + fmtH(g[0].minutes) + '.';
    if (g[1]) line += ' ' + g[1].genre + ' is second at ' + fmtH(g[1].minutes) + '.';
    return line;
  }

  /* most watched show */
  if (/(most watched|top|favourite|favorite|biggest).*(show|series)/.test(q) || /(show|series).*(most|longest)/.test(q)) {
    var shows = Object.keys(Store.get().shows).map(function (id) { return Store.get().shows[id]; })
      .filter(function (sh) { return Store.watchedCount(sh) > 0; })
      .map(function (sh) { return { sh: sh, min: Store.watchedCount(sh) * (sh.avgRuntime || 40) * Store.rewatchOf(sh) }; })
      .sort(function (a, b) { return b.min - a.min; });
    if (!shows.length) return 'No episodes logged yet, so there is no most watched show to name.';
    var top = shows[0];
    var extra = Store.rewatchOf(top.sh) > 1 ? ', watched ' + Store.rewatchOf(top.sh) + ' times through' : '';
    return 'Your most watched show is ' + top.sh.name + ' at about ' + fmtH(top.min) + extra + '.';
  }

  /* most watched film */
  if (/(most watched|top|favourite|favorite).*(film|movie)/.test(q)) {
    var films = Object.keys(Store.get().movies).map(function (id) { return Store.get().movies[id]; })
      .filter(function (mv) { return !!mv.watchedAt; })
      .sort(function (a, b) {
        return (Store.rewatchOf(b) - Store.rewatchOf(a)) || ((b.rating || 0) - (a.rating || 0)) || ((b.watchedAt || 0) - (a.watchedAt || 0));
      });
    if (!films.length) return 'No films marked watched yet.';
    var f = films[0];
    var bits = [];
    if (Store.rewatchOf(f) > 1) bits.push('watched ' + Store.rewatchOf(f) + ' times');
    if (f.rating) bits.push('rated ' + f.rating + '/5');
    return 'Top film: ' + f.title + (bits.length ? ' (' + bits.join(', ') + ')' : '') + '.';
  }

  /* rewatches */
  if (/rewatch/.test(q)) {
    var re = [];
    var stt = Store.get();
    Object.keys(stt.shows).forEach(function (id) { if (Store.rewatchOf(stt.shows[id]) > 1) re.push(stt.shows[id].name + ' ×' + Store.rewatchOf(stt.shows[id])); });
    Object.keys(stt.movies).forEach(function (id) { if (Store.rewatchOf(stt.movies[id]) > 1) re.push(stt.movies[id].title + ' ×' + Store.rewatchOf(stt.movies[id])); });
    if (!re.length) return 'Nothing is marked as rewatched yet. Set a watch count from any show or film page.';
    return 'Rewatched: ' + re.slice(0, 6).join(', ') + (re.length > 6 ? ' and ' + (re.length - 6) + ' more.' : '.');
  }

  /* best rated */
  if (/(best|top|highest).*(rated|rating)|five star|5 star/.test(q)) {
    var rated = [];
    var s2 = Store.get();
    Object.keys(s2.shows).forEach(function (id) { if (s2.shows[id].rating) rated.push({ t: s2.shows[id].name, r: s2.shows[id].rating }); });
    Object.keys(s2.movies).forEach(function (id) { if (s2.movies[id].rating) rated.push({ t: s2.movies[id].title, r: s2.movies[id].rating }); });
    rated.sort(function (a, b) { return b.r - a.r; });
    if (!rated.length) return 'Nothing is rated yet. Rate any watched show or film from its page.';
    return 'Your highest rated: ' + rated.slice(0, 5).map(function (x) { return x.t + ' (' + x.r + '/5)'; }).join(', ') + '.';
  }

  /* counts */
  if (/how many episodes|episodes have i|episodes did i|episode count/.test(q)) {
    return 'You have watched ' + st.episodes + ' distinct episodes across ' + st.shows + (st.shows === 1 ? ' show.' : ' shows.');
  }
  if (/how many (films|movies)|(films|movies) have i/.test(q)) {
    return 'You have watched ' + st.moviesWatched + (st.moviesWatched === 1 ? ' film.' : ' films.');
  }
  if (/how many (shows|series)/.test(q)) {
    return 'You are tracking ' + st.shows + (st.shows === 1 ? ' show.' : ' shows.');
  }

  /* total time */
  if (/(total|how much|how long).*(time|watched|watching)|watch time|time watched/.test(q)) {
    return 'About ' + fmtH(st.tvMinutes) + ' of TV and ' + fmtH(st.movieMinutes) + ' of films, ' + fmtH(st.tvMinutes + st.movieMinutes) + ' altogether. Rewatch counts are included.';
  }

  /* busiest month */
  if (/(busiest|most active|biggest|peak).*(month)/.test(q) || /month.*(most|busiest)/.test(q)) {
    var months = Store.monthlyMinutes();
    if (!months.length) return 'No monthly activity logged yet.';
    var best = months.reduce(function (a, b) { return b.minutes > a.minutes ? b : a; });
    if (!best.minutes) return 'No monthly activity logged yet.';
    return 'Your busiest month was ' + monthName(best.key) + ' with about ' + fmtH(best.minutes) + ' logged. Rewatches carry no dates so they are not counted here.';
  }

  /* watchlist */
  if (/watchlist|watch list|saved for later/.test(q)) {
    var wlShows = Store.watchlistShows().length;
    var wlFilms = Object.keys(Store.get().movies).filter(function (id) {
      var mv = Store.get().movies[id];
      return mv.watchlist && !mv.watchedAt;
    }).length;
    return 'Your watchlist holds ' + wlShows + (wlShows === 1 ? ' show' : ' shows') + ' and ' + wlFilms + (wlFilms === 1 ? ' film.' : ' films.');
  }

  return null;
}

export const HELP_LINE = 'Try: top genre, most watched show, top film, total watch time, busiest month, how many episodes, what have I rewatched, best rated, or what is on my watchlist.';
