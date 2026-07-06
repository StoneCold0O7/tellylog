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

console.log('\nAll ' + passed + ' tests passed.');
