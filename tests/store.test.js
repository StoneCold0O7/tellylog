/* Node tests for store.js core logic (watch next, stats, import merge).
   Stubs window + localStorage. Run: node tests/store.test.js */
'use strict';
import assert from 'node:assert';
import * as U from '../src/lib/util.js';

// ---- stubs ----
const mem = {};
global.localStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = v; },
  removeItem: (k) => { delete mem[k]; }
};


const Store = await import('../src/lib/store.js');

let passed = 0;
function t(name, fn) { fn(); passed++; console.log('  ✓ ' + name); }

function fakeDetails(id, name, seasonCounts, runtime) {
  return {
    id, name,
    poster_path: '/p.jpg',
    episode_run_time: [runtime],
    seasons: Object.keys(seasonCounts).map(n => ({ season_number: Number(n), episode_count: seasonCounts[n] })),
    status: 'Ended',
    networks: [{ name: 'TestNet' }]
  };
}

Store.load();
Store.clearAll();

t('addShow builds season map, excludes specials (season 0)', () => {
  Store.addShow(fakeDetails(1, 'Alpha', { 0: 5, 1: 10, 2: 8 }, 40));
  const sh = Store.get().shows[1];
  assert.deepStrictEqual(Object.keys(sh.seasons).map(Number).sort(), [1, 2]);
  assert.strictEqual(Store.totalEpisodes(sh), 18);
});

t('markEpisode updates watched map, log and lastWatchedAt', () => {
  Store.markEpisode(1, 1, 1, true, 1000);
  Store.markEpisode(1, 1, 2, true, 2000);
  const sh = Store.get().shows[1];
  assert.strictEqual(Store.watchedCount(sh), 2);
  assert.strictEqual(sh.lastWatchedAt, 2000);
  assert.strictEqual(Store.get().log.length, 2);
});

t('markEpisode is idempotent (no duplicate log entries)', () => {
  Store.markEpisode(1, 1, 1, true, 3000);
  assert.strictEqual(Store.get().log.length, 2);
});

t('unmarking removes from watched and log', () => {
  Store.markEpisode(1, 1, 2, false);
  const sh = Store.get().shows[1];
  assert.strictEqual(Store.watchedCount(sh), 1);
  assert.strictEqual(Store.get().log.length, 1);
});

t('nextEpisodeFor finds first gap across seasons', () => {
  const sh = Store.get().shows[1];
  assert.deepStrictEqual(Store.nextEpisodeFor(sh), { s: 1, e: 2 });
  Store.markSeason(1, 1, 10, true);
  assert.deepStrictEqual(Store.nextEpisodeFor(Store.get().shows[1]), { s: 2, e: 1 });
});

t('nextEpisodeFor returns null when everything is watched', () => {
  Store.markSeason(1, 2, 8, true);
  assert.strictEqual(Store.nextEpisodeFor(Store.get().shows[1]), null);
});

t('watchNextList excludes fully-watched and archived shows', () => {
  Store.addShow(fakeDetails(2, 'Beta', { 1: 6 }, 30));
  Store.markEpisode(2, 1, 1, true, Date.now());
  let lists = Store.watchNextList();
  assert.strictEqual(lists.next.length, 1);
  assert.strictEqual(lists.next[0].show.id, 2);
  assert.strictEqual(lists.next[0].remaining, 5);
  Store.setArchived(2, true);
  lists = Store.watchNextList();
  assert.strictEqual(lists.next.length + lists.stale.length, 0);
  Store.setArchived(2, false);
});

t('shows untouched for 30+ days land in the stale bucket', () => {
  Store.addShow(fakeDetails(3, 'Gamma', { 1: 4 }, 25));
  Store.markEpisode(3, 1, 1, true, Date.now() - 45 * 24 * 60 * 60 * 1000);
  const lists = Store.watchNextList();
  const staleIds = lists.stale.map(x => x.show.id);
  assert.ok(staleIds.indexOf(3) !== -1);
});

t('stats: episodes x avg runtime, TV Time style breakdown', () => {
  const st = Store.stats();
  // Alpha: 18 eps x 40m, Beta: 1 x 30m, Gamma: 1 x 25m = 775m
  assert.strictEqual(st.episodes, 20);
  assert.strictEqual(st.tvMinutes, 18 * 40 + 30 + 25);
  assert.deepStrictEqual(st.tvTime, U.fmtTvTime(st.tvMinutes));
});

t('importShowBatch merges without duplicating existing history', () => {
  Store.importShowBatch(fakeDetails(2, 'Beta', { 1: 6 }, 30), [
    { s: 1, e: 1, ts: 500 }, // already watched
    { s: 1, e: 2, ts: 600 },
    { s: 1, e: 3, ts: 700 }
  ]);
  const sh = Store.get().shows[2];
  assert.strictEqual(Store.watchedCount(sh), 3);
  const betaLogs = Store.get().log.filter(l => l.showId === 2);
  assert.strictEqual(betaLogs.length, 3);
});

t('movies: watchlist -> watched flow and stats', () => {
  Store.addMovie({ id: 900, title: 'Deep Water', runtime: 106, genres: [{ name: 'Horror' }, { name: 'Thriller' }] });
  let st = Store.stats();
  assert.strictEqual(st.moviesWatched, 0);
  Store.setMovieWatched(900, true, 12345);
  st = Store.stats();
  assert.strictEqual(st.moviesWatched, 1);
  assert.strictEqual(st.movieMinutes, 106);
});

t('export -> clear -> restore round-trips', () => {
  const before = Store.stats();
  const dump = Store.exportJSON();
  Store.clearAll();
  assert.strictEqual(Store.stats().episodes, 0);
  Store.restoreJSON(dump);
  const after = Store.stats();
  assert.strictEqual(after.episodes, before.episodes);
  assert.strictEqual(after.moviesWatched, before.moviesWatched);
  assert.ok(after.episodes > 0);
});

t('restoreJSON rejects junk', () => {
  assert.throws(() => Store.restoreJSON('{"hello": 1}'));
});

/* ---------- Phase 1: keep/drop, nudge, theme, grid flag ---------- */

t('keptAt rescues a stale show back into the fresh queue', () => {
  Store.clearAll();
  const DAY = 24 * 60 * 60 * 1000;
  Store.addShow(fakeDetails(50, 'Oldie', { 1: 6 }, 40));
  Store.markEpisode(50, 1, 1, true, Date.now() - 45 * DAY);
  let lists = Store.watchNextList();
  assert.strictEqual(lists.stale.length, 1);
  assert.strictEqual(lists.next.length, 0);
  Store.keepShow(50);
  lists = Store.watchNextList();
  assert.strictEqual(lists.stale.length, 0);
  assert.strictEqual(lists.next.length, 1);
  assert.ok(Store.get().shows[50].keptAt > 0);
});

t('watchNextList keeps its {next, stale} shape with legacy records lacking keptAt', () => {
  Store.clearAll();
  Store.addShow(fakeDetails(51, 'Legacy', { 1: 4 }, 40));
  delete Store.get().shows[51].keptAt; // simulate pre-Phase-1 record
  const lists = Store.watchNextList();
  assert.ok(Array.isArray(lists.next));
  assert.ok(Array.isArray(lists.stale));
  assert.strictEqual(lists.next.length, 1);
});

t('drop maps to archive: leaves the queue, keeps stats', () => {
  Store.clearAll();
  Store.addShow(fakeDetails(52, 'Dropped', { 1: 5 }, 40));
  Store.markEpisode(52, 1, 1, true);
  Store.setArchived(52, true);
  const lists = Store.watchNextList();
  assert.strictEqual(lists.next.length + lists.stale.length, 0);
  assert.strictEqual(Store.stats().episodes, 1);
});

t('nudgePick: started show with <=3 remaining wins, exclusion respected', () => {
  Store.clearAll();
  Store.addShow(fakeDetails(60, 'NearlyDone', { 1: 5 }, 40));
  [1, 2, 3].forEach((e) => Store.markEpisode(60, 1, e, true)); // 2 left
  Store.addShow(fakeDetails(61, 'Untouched', { 1: 3 }, 40));   // 3 left, never started
  Store.addShow(fakeDetails(62, 'LongWay', { 1: 20 }, 40));
  Store.markEpisode(62, 1, 1, true); // 19 left
  const pick = Store.nudgePick(null);
  assert.strictEqual(pick.show.id, 60);
  assert.strictEqual(pick.remaining, 2);
  assert.strictEqual(Store.nudgePick(60), null);
});

t('nudgePick ignores archived shows', () => {
  Store.setArchived(60, true);
  assert.strictEqual(Store.nudgePick(null), null);
  Store.setArchived(60, false);
});

t('theme defaults to dark, persists a light choice, rejects junk', () => {
  Store.clearAll();
  assert.strictEqual(Store.theme(), 'dark');
  Store.setTheme('light');
  assert.strictEqual(Store.theme(), 'light');
  Store.setTheme('neon');
  assert.strictEqual(Store.theme(), 'dark');
});

t('gridSeen flag starts false and sticks once set', () => {
  Store.clearAll();
  assert.strictEqual(Store.gridSeen(), false);
  Store.setGridSeen();
  assert.strictEqual(Store.gridSeen(), true);
});

t('restore of a legacy backup without Phase 1 fields still works', () => {
  const legacy = JSON.stringify({
    version: 1,
    settings: { apiKey: 'k', profileName: 'You' },
    shows: { 70: { id: 70, name: 'Old', poster: '', backdrop: '', status: '', network: '',
      avgRuntime: 40, seasons: { 1: 3 }, nextEp: null, lastEp: null,
      watched: { 1: [1] }, lastWatchedAt: Date.now(), added: Date.now(),
      archived: false, detailsFetchedAt: Date.now() } },
    movies: {},
    log: [{ showId: 70, s: 1, e: 1, ts: Date.now() }]
  });
  Store.restoreJSON(legacy);
  assert.strictEqual(Store.theme(), 'dark');
  assert.strictEqual(Store.gridSeen(), false);
  const lists = Store.watchNextList();
  assert.strictEqual(lists.next.length, 1);
});



/* ---------- Phase 1.5 helpers ---------- */

t('watchedMapFor: maps s-e keys to log timestamps for one show only', () => {
  Store.clearAll();
  Store.addShow({ id: 5, name: 'Five', seasons: [{ season_number: 1, episode_count: 3 }] });
  Store.addShow({ id: 6, name: 'Six', seasons: [{ season_number: 1, episode_count: 3 }] });
  Store.markEpisode(5, 1, 1, true, 111);
  Store.markEpisode(5, 1, 2, true, 222);
  Store.markEpisode(6, 1, 1, true, 999);
  const map = Store.watchedMapFor(5);
  assert.strictEqual(map['1-1'], 111);
  assert.strictEqual(map['1-2'], 222);
  assert.strictEqual(map['1-3'], undefined);
  assert.strictEqual(Object.keys(map).length, 2);
});

t('librarySummary: includes show progress and film lists', () => {
  Store.clearAll();
  Store.addShow({ id: 7, name: 'Seven', status: 'Ended', seasons: [{ season_number: 1, episode_count: 4 }] });
  Store.markEpisode(7, 1, 1, true);
  Store.addMovie({ id: 90, title: 'FilmA', runtime: 100 });
  Store.setMovieWatched(90, true);
  Store.addMovie({ id: 91, title: 'FilmB', runtime: 100 });
  const sum = Store.librarySummary();
  assert.ok(sum.indexOf('Seven, 1/4 eps, Ended') !== -1);
  assert.ok(sum.indexOf('Films watched: FilmA') !== -1);
  assert.ok(sum.indexOf('Film watchlist: FilmB') !== -1);
});

t('librarySummary: marks archived shows as dropped and respects the cap', () => {
  Store.clearAll();
  for (let i = 1; i <= 35; i++) {
    Store.addShow({ id: 100 + i, name: 'Show' + i, seasons: [{ season_number: 1, episode_count: 2 }] });
  }
  Store.setArchived(101, true);
  const sum = Store.librarySummary(30);
  const lines = sum.split('\n').filter((l) => l.indexOf('- ') === 0);
  assert.strictEqual(lines.length, 30);
  assert.ok(sum.indexOf('Show1, 0/2 eps, dropped') !== -1);
});

t('librarySummary: empty store gives empty string', () => {
  Store.clearAll();
  assert.strictEqual(Store.librarySummary(), '');
});

t('archivedShows returns only archived, most recent first', () => {
  Store.clearAll();
  Store.addShow(fakeDetails(31, 'ArchA', { 1: 4 }, 40));
  Store.addShow(fakeDetails(32, 'ArchB', { 1: 4 }, 40));
  Store.addShow(fakeDetails(33, 'Live', { 1: 4 }, 40));
  Store.setArchived(31, true);
  Store.setArchived(32, true);
  Store.markEpisode(31, 1, 1, true, 2000); // ArchA more recent
  Store.markEpisode(32, 1, 1, true, 1000);
  const list = Store.archivedShows();
  assert.strictEqual(list.length, 2);
  assert.strictEqual(list[0].name, 'ArchA');
  assert.strictEqual(list[1].name, 'ArchB');
});

t('zero-episode season: markSeason is a no-op and nextEpisodeFor skips it', () => {
  Store.clearAll();
  Store.addShow(fakeDetails(41, 'ThePit', { 1: 2, 3: 0 }, 40));
  const sh = Store.get().shows[41];
  Store.markSeason(41, 3, 0, true);
  assert.strictEqual(Store.watchedCount(sh), 0);
  Store.markEpisode(41, 1, 1, true);
  Store.markEpisode(41, 1, 2, true);
  assert.strictEqual(Store.nextEpisodeFor(sh), null); // season 3 has nothing to watch
});


/* ---------- Phase 2b: genres, backfill, chart selectors ---------- */

function fakeDetailsG(id, name, seasonCounts, runtime, genreNames) {
  const d = fakeDetails(id, name, seasonCounts, runtime);
  d.genres = (genreNames || []).map((n, i) => ({ id: i + 1, name: n }));
  return d;
}

t('genreList: persisted on addShow as full name array', () => {
  Store.clearAll();
  Store.addShow(fakeDetailsG(300, 'GShow', { 1: 10 }, 30, ['Drama', 'Crime', 'Thriller']));
  assert.deepStrictEqual(Store.get().shows[300].genreList, ['Drama', 'Crime', 'Thriller']);
});

t('genreList: movies keep the legacy top-2 string AND gain the full array', () => {
  Store.clearAll();
  Store.addMovie({ id: 400, title: 'GFilm', runtime: 120, genres: [{ id: 1, name: 'Action' }, { id: 2, name: 'Sci-Fi' }, { id: 3, name: 'Adventure' }] });
  const mv = Store.get().movies[400];
  assert.strictEqual(mv.genres, 'Action, Sci-Fi');
  assert.deepStrictEqual(mv.genreList, ['Action', 'Sci-Fi', 'Adventure']);
});

t('refreshShowCache: keeps genreList when a fresh payload lacks genres', () => {
  Store.clearAll();
  Store.addShow(fakeDetailsG(301, 'Keep', { 1: 5 }, 30, ['Comedy']));
  Store.refreshShowCache(301, fakeDetails(301, 'Keep', { 1: 5 }, 30));
  assert.deepStrictEqual(Store.get().shows[301].genreList, ['Comedy']);
});

t('genreBackfillList + setGenres: finds pre-2.4 records and fills them', () => {
  Store.clearAll();
  Store.addShow(fakeDetailsG(302, 'HasG', { 1: 5 }, 30, ['Drama']));
  Store.addShow(fakeDetails(303, 'NoG', { 1: 5 }, 30));
  delete Store.get().shows[303].genreList; // simulate a pre-2.4 record
  Store.addMovie({ id: 401, title: 'OldFilm', runtime: 100 });
  delete Store.get().movies[401].genreList;
  const list = Store.genreBackfillList();
  assert.deepStrictEqual(list, [{ kind: 'tv', id: 303 }, { kind: 'movie', id: 401 }]);
  Store.setGenres('tv', 303, ['Western']);
  Store.setGenres('movie', 401, ['Horror']);
  assert.strictEqual(Store.genreBackfillList().length, 0);
});

t('restore of an old backup without genreList still works and flags backfill', () => {
  Store.clearAll();
  Store.addShow(fakeDetails(304, 'OldBackupShow', { 1: 3 }, 30));
  const backup = JSON.parse(Store.exportJSON());
  delete backup.shows[304].genreList; // a backup written before v2.4.0
  Store.restoreJSON(JSON.stringify(backup));
  assert.strictEqual(Store.get().shows[304].name, 'OldBackupShow');
  assert.deepStrictEqual(Store.genreBackfillList(), [{ kind: 'tv', id: 304 }]);
});

t('genreMinutes: weights by watched minutes, not title count', () => {
  Store.clearAll();
  // 200-episode sitcom at 20 min, all watched: 4000 Comedy minutes
  Store.addShow(fakeDetailsG(310, 'BigSitcom', { 1: 200 }, 20, ['Comedy']));
  Store.markSeason(310, 1, 200, true);
  // 6-episode miniseries at 60 min, all watched: 360 Drama minutes
  Store.addShow(fakeDetailsG(311, 'Mini', { 1: 6 }, 60, ['Drama']));
  Store.markSeason(311, 1, 6, true);
  const g = Store.genreMinutes(false);
  assert.strictEqual(g.rows[0].genre, 'Comedy');
  assert.strictEqual(g.rows[0].minutes, 4000);
  assert.strictEqual(g.rows[1].minutes, 360);
});

t('genreMinutes: multi-genre titles credit every genre; primaryOnly credits the first', () => {
  Store.clearAll();
  Store.addShow(fakeDetailsG(312, 'Both', { 1: 10 }, 30, ['Crime', 'Drama']));
  Store.markSeason(312, 1, 10, true); // 300 minutes
  const all = Store.genreMinutes(false);
  assert.strictEqual(all.rows.length, 2);
  assert.strictEqual(all.rows[0].minutes, 300);
  assert.strictEqual(all.rows[1].minutes, 300);
  const prim = Store.genreMinutes(true);
  assert.strictEqual(prim.rows.length, 1);
  assert.strictEqual(prim.rows[0].genre, 'Crime');
});

t('genreMinutes: unwatched films excluded, missing genreList counted as unattributed', () => {
  Store.clearAll();
  Store.addMovie({ id: 402, title: 'Seen', runtime: 90, genres: [{ id: 1, name: 'Horror' }] });
  Store.setMovieWatched(402, true);
  Store.addMovie({ id: 403, title: 'Unseen', runtime: 90, genres: [{ id: 1, name: 'Horror' }] });
  Store.addShow(fakeDetails(313, 'NoGenres', { 1: 2 }, 50));
  delete Store.get().shows[313].genreList;
  Store.markSeason(313, 1, 2, true); // 100 unattributed minutes
  const g = Store.genreMinutes(false);
  assert.strictEqual(g.rows.length, 1);
  assert.strictEqual(g.rows[0].minutes, 90);
  assert.strictEqual(g.unattributed, 100);
  assert.strictEqual(g.total, 190);
});

t('monthlyMinutes: buckets by month, fills gaps with zero, includes films', () => {
  Store.clearAll();
  Store.addShow(fakeDetailsG(314, 'Timed', { 1: 5 }, 40, ['Drama']));
  const jan = new Date(2025, 0, 15).getTime();
  const mar = new Date(2025, 2, 10).getTime();
  Store.markEpisode(314, 1, 1, true, jan);
  Store.markEpisode(314, 1, 2, true, jan);
  Store.markEpisode(314, 1, 3, true, mar);
  Store.addMovie({ id: 404, title: 'MarFilm', runtime: 120, genres: [] });
  Store.setMovieWatched(404, true, mar);
  const months = Store.monthlyMinutes();
  assert.strictEqual(months.length, 3);
  assert.deepStrictEqual(months.map((m) => m.key), ['2025-01', '2025-02', '2025-03']);
  assert.strictEqual(months[0].minutes, 80);
  assert.strictEqual(months[1].minutes, 0);
  assert.strictEqual(months[2].minutes, 160);
});

t('monthlyMinutes: empty store gives empty array', () => {
  Store.clearAll();
  assert.deepStrictEqual(Store.monthlyMinutes(), []);
});

/* ---------- v2.5.0: TV watchlist ---------- */

t('addShow defaults watchlist false; addShowToWatchlist sets it true', () => {
  Store.clearAll();
  Store.addShow(fakeDetails(501, 'Tracked', { 1: 8 }, 40));
  assert.strictEqual(Store.get().shows[501].watchlist, false);
  Store.addShowToWatchlist(fakeDetails(502, 'Saved', { 1: 8 }, 40));
  assert.strictEqual(Store.get().shows[502].watchlist, true);
});

t('addShowToWatchlist never flags an already-started show', () => {
  Store.markEpisode(501, 1, 1, true);
  Store.addShowToWatchlist(fakeDetails(501, 'Tracked', { 1: 8 }, 40));
  assert.strictEqual(Store.get().shows[501].watchlist, false);
});

t('watching the first episode clears the watchlist flag automatically', () => {
  Store.markEpisode(502, 1, 1, true);
  assert.strictEqual(Store.get().shows[502].watchlist, false);
});

t('watchNextList excludes watchlisted unstarted shows; watchlistShows finds them', () => {
  Store.clearAll();
  Store.addShow(fakeDetails(503, 'InQueue', { 1: 8 }, 40));
  Store.addShowToWatchlist(fakeDetails(504, 'SavedOnly', { 1: 8 }, 40));
  const lists = Store.watchNextList();
  const ids = lists.next.map((e) => e.show.id);
  assert.ok(ids.indexOf(503) !== -1);
  assert.ok(ids.indexOf(504) === -1);
  const wl = Store.watchlistShows();
  assert.strictEqual(wl.length, 1);
  assert.strictEqual(wl[0].id, 504);
});

t('librarySummary tags watchlisted shows', () => {
  const lib = Store.librarySummary();
  assert.ok(lib.indexOf('SavedOnly') !== -1);
  assert.ok(lib.indexOf('on watchlist, not started') !== -1);
});

t('restoring a pre-2.5 backup (no watchlist field) keeps shows in the queue', () => {
  Store.clearAll();
  Store.addShow(fakeDetails(505, 'Old', { 1: 4 }, 40));
  delete Store.get().shows[505].watchlist;
  const backup = Store.exportJSON();
  Store.clearAll();
  Store.restoreJSON(backup);
  const lists = Store.watchNextList();
  assert.strictEqual(lists.next.length, 1);
  assert.strictEqual(Store.watchlistShows().length, 0);
});

/* ---------- v2.5.0: chart drill-downs ---------- */

t('genreTitles: full crediting lists every carrier, primaryOnly lists first-genre titles only', () => {
  Store.clearAll();
  Store.addShow(fakeDetailsG(506, 'CrimeDrama', { 1: 10 }, 30, ['Crime', 'Drama']));
  Store.markSeason(506, 1, 10, true); // 300 min
  Store.addShow(fakeDetailsG(507, 'PureDrama', { 1: 5 }, 60, ['Drama']));
  Store.markSeason(507, 1, 5, true); // 300 min
  const full = Store.genreTitles('Drama', false);
  assert.strictEqual(full.length, 2);
  const prim = Store.genreTitles('Drama', true);
  assert.strictEqual(prim.length, 1);
  assert.strictEqual(prim[0].title, 'PureDrama');
});

t('genreTitles: watched films included, watchlist films excluded, sorted by minutes desc', () => {
  Store.addMovie({ id: 508, title: 'BigFilm', runtime: 400, genres: [{ id: 1, name: 'Drama' }] });
  Store.setMovieWatched(508, true);
  Store.addMovie({ id: 509, title: 'UnseenFilm', runtime: 400, genres: [{ id: 1, name: 'Drama' }] });
  const full = Store.genreTitles('Drama', false);
  assert.strictEqual(full[0].title, 'BigFilm');
  assert.ok(full.every((x) => x.title !== 'UnseenFilm'));
});

t('monthTitles: aggregates per title with episode counts plus films in that month', () => {
  Store.clearAll();
  Store.addShow(fakeDetailsG(510, 'Timed', { 1: 5 }, 40, ['Drama']));
  const feb = new Date(2025, 1, 10).getTime();
  Store.markEpisode(510, 1, 1, true, feb);
  Store.markEpisode(510, 1, 2, true, feb);
  Store.addMovie({ id: 511, title: 'FebFilm', runtime: 120, genres: [] });
  Store.setMovieWatched(511, true, feb);
  const rows = Store.monthTitles('2025-02');
  assert.strictEqual(rows.length, 2);
  assert.strictEqual(rows[0].title, 'FebFilm');
  assert.strictEqual(rows[0].minutes, 120);
  assert.strictEqual(rows[1].title, 'Timed');
  assert.strictEqual(rows[1].count, 2);
  assert.strictEqual(rows[1].minutes, 80);
  assert.deepStrictEqual(Store.monthTitles('2025-03'), []);
});

/* ---------- v2.5.0: avatar and cover settings ---------- */

t('setAvatar and setCover persist and clear; old backups without them restore clean', () => {
  Store.clearAll();
  Store.setAvatar('data:image/jpeg;base64,AAA');
  Store.setCover('data:image/jpeg;base64,BBB');
  assert.strictEqual(Store.avatar(), 'data:image/jpeg;base64,AAA');
  assert.strictEqual(Store.cover(), 'data:image/jpeg;base64,BBB');
  Store.setAvatar(null);
  assert.strictEqual(Store.avatar(), '');
  const old = JSON.parse(Store.exportJSON());
  delete old.settings.avatar;
  delete old.settings.cover;
  Store.restoreJSON(JSON.stringify(old));
  assert.strictEqual(Store.avatar(), '');
  assert.strictEqual(Store.cover(), '');
});


/* ---------- v2.6.0: rewatch counter, ratings, rail anchors ---------- */

t('rewatch multiplies TIME in stats but never the distinct counts', () => {
  Store.clearAll();
  Store.addShow(fakeDetails(60, 'Loop', { 1: 10 }, 30));
  Store.markSeason(60, 1, 10, true);
  Store.setRewatchCount('tv', 60, 3);
  const st = Store.stats();
  assert.strictEqual(st.episodes, 10);            // distinct episodes untouched
  assert.strictEqual(st.tvMinutes, 10 * 30 * 3);  // time triples
});

t('rewatch multiplies genre chart minutes for shows and films', () => {
  Store.clearAll();
  Store.addShow(fakeDetails(61, 'GenShow', { 1: 5 }, 40));
  Store.setGenres('tv', 61, ['Drama']);
  Store.markSeason(61, 1, 5, true);
  Store.setRewatchCount('tv', 61, 2);
  Store.addMovie({ id: 62, title: 'GenFilm', runtime: 100, genres: [{ name: 'Drama' }], release_date: '2020-01-01' });
  Store.setMovieWatched(62, true);
  Store.setRewatchCount('movie', 62, 4);
  const g = Store.genreMinutes(false);
  const drama = g.rows.find((r) => r.genre === 'Drama');
  assert.strictEqual(drama.minutes, 5 * 40 * 2 + 100 * 4);
  const titles = Store.genreTitles('Drama', false);
  assert.strictEqual(titles.find((x) => x.kind === 'movie').rewatch, 4);
});

t('rewatch never touches monthly minutes (no dates to land in)', () => {
  const before = Store.monthlyMinutes().reduce((a, b) => a + b.minutes, 0);
  Store.setRewatchCount('tv', 61, 5);
  const after = Store.monthlyMinutes().reduce((a, b) => a + b.minutes, 0);
  assert.strictEqual(before, after);
});

t('setRewatchCount clamps, and 1 deletes the field so old backups stay clean', () => {
  Store.setRewatchCount('tv', 61, 999);
  assert.strictEqual(Store.rewatchOf(Store.get().shows[61]), 50);
  Store.setRewatchCount('tv', 61, 1);
  assert.strictEqual('rewatchCount' in Store.get().shows[61], false);
});

t('setRating sets 1-5, 0 clears, out of range clears', () => {
  Store.setRating('tv', 61, 4);
  assert.strictEqual(Store.get().shows[61].rating, 4);
  Store.setRating('tv', 61, 0);
  assert.strictEqual('rating' in Store.get().shows[61], false);
  Store.setRating('movie', 62, 9);
  assert.strictEqual('rating' in Store.get().movies[62], false);
});

t('librarySummary carries rating and rewatch tags for AI grounding', () => {
  Store.setRating('tv', 61, 5);
  Store.setRewatchCount('tv', 61, 2);
  Store.setRating('movie', 62, 3);
  Store.setRewatchCount('movie', 62, 4);
  const lib = Store.librarySummary();
  assert.ok(lib.indexOf('rated 5/5') !== -1);
  assert.ok(lib.indexOf('watched 2 times through') !== -1);
  assert.ok(lib.indexOf('GenFilm (3/5, watched 4 times)') !== -1);
});

t('railAnchors: shows first by rewatch-weighted minutes, then one film, watched only', () => {
  Store.clearAll();
  Store.addShow(fakeDetails(70, 'Small', { 1: 2 }, 30));   // 60 min
  Store.markSeason(70, 1, 2, true);
  Store.addShow(fakeDetails(71, 'Big', { 1: 10 }, 30));    // 300 min
  Store.markSeason(71, 1, 10, true);
  Store.addShow(fakeDetails(72, 'Boosted', { 1: 3 }, 30)); // 90 min x5 = 450
  Store.markSeason(72, 1, 3, true);
  Store.setRewatchCount('tv', 72, 5);
  Store.addShow(fakeDetails(73, 'Unwatched', { 1: 8 }, 30)); // excluded
  Store.addMovie({ id: 74, title: 'FilmAnchor', runtime: 100, genres: [], release_date: '2020-01-01' });
  Store.setMovieWatched(74, true);
  const a = Store.railAnchors();
  assert.deepStrictEqual(a.map((x) => x.title), ['Boosted', 'Big', 'Small', 'FilmAnchor']);
  assert.strictEqual(a[3].kind, 'movie');
  assert.strictEqual(a.length, 4); // 3-4 rail ruling: capped at 4
});

/* ---------- v2.6.0: deterministic voice insights ---------- */

const QA = await import('../src/lib/insightsQA.js');

t('insightsQA answers most watched show, counts and rewatches locally', () => {
  const most = QA.answerInsight('what is my most watched show');
  assert.ok(most.indexOf('Boosted') !== -1);
  assert.ok(most.indexOf('5 times through') !== -1);
  const eps = QA.answerInsight('how many episodes have I watched');
  assert.ok(eps.indexOf('15') !== -1); // 2 + 10 + 3 distinct, never multiplied
  const re = QA.answerInsight('what have I rewatched');
  assert.ok(re.indexOf('Boosted \u00d75') !== -1 || re.indexOf('Boosted ×5') !== -1);
});

t('insightsQA returns null for unmatched questions instead of guessing', () => {
  assert.strictEqual(QA.answerInsight('what is the meaning of life'), null);
});

console.log('\nAll ' + passed + ' tests passed.');
