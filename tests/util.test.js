/* Node smoke tests for util.js pure functions.
   Run: node tests/util.test.js */
'use strict';
import assert from 'node:assert';
import * as U from '../src/lib/util.js';

let passed = 0;
function t(name, fn) {
  fn();
  passed++;
  console.log('  ✓ ' + name);
}

/* CSV */
t('parseCSV basic', () => {
  const r = U.parseCSV('a,b,c\n1,2,3\n4,5,6\n');
  assert.deepStrictEqual(r.headers, ['a', 'b', 'c']);
  assert.strictEqual(r.rows.length, 2);
  assert.deepStrictEqual(r.rows[1], ['4', '5', '6']);
});
t('parseCSV quoted fields with commas and escaped quotes', () => {
  const r = U.parseCSV('name,note\n"Fargo, S1","He said ""oh"""\n');
  assert.deepStrictEqual(r.rows[0], ['Fargo, S1', 'He said "oh"']);
});
t('parseCSV CRLF and trailing blank lines', () => {
  const r = U.parseCSV('a,b\r\n1,2\r\n\r\n');
  assert.strictEqual(r.rows.length, 1);
});

/* Column guessing */
t('guessColumns on TV Time style headers', () => {
  const g = U.guessColumns(['tv_show_name', 'episode_season_number', 'episode_number', 'updated_at']);
  assert.strictEqual(g.show, 0);
  assert.strictEqual(g.season, 1);
  assert.strictEqual(g.episode, 2);
  assert.strictEqual(g.date, 3);
});
t('guessColumns on generic headers', () => {
  const g = U.guessColumns(['Series Name', 'Season', 'Episode', 'Date Watched']);
  assert.strictEqual(g.show, 0);
  assert.strictEqual(g.season, 1);
  assert.strictEqual(g.episode, 2);
  assert.strictEqual(g.date, 3);
});

/* Name matching */
t('normName strips articles, punctuation, diacritics', () => {
  assert.strictEqual(U.normName('The Office (US)'), 'office us');
  assert.strictEqual(U.normName("Marvel's Dárk  Show!"), 'marvels dark show');
});
t('similarity: exact after normalisation = 1', () => {
  assert.strictEqual(U.similarity('The Office', 'office'), 1);
});
t('similarity: unrelated names score low', () => {
  assert.ok(U.similarity('Fargo', 'Breaking Bad') < 0.3);
});
t('similarity: close variants score high', () => {
  assert.ok(U.similarity('Fighting Spirit', 'Fighting  Spirit!') > 0.9);
});

/* Dates */
t('parseDateFlexible handles space-separated datetimes', () => {
  const ts = U.parseDateFlexible('2023-05-01 12:00:00');
  assert.ok(ts !== null && new Date(ts).getFullYear() === 2023);
});
t('parseDateFlexible handles UK dd/mm/yyyy', () => {
  const ts = U.parseDateFlexible('25/12/2024');
  const d = new Date(ts);
  assert.strictEqual(d.getMonth(), 11);
  assert.strictEqual(d.getDate(), 25);
});
t('parseDateFlexible returns null on junk', () => {
  assert.strictEqual(U.parseDateFlexible('not a date'), null);
  assert.strictEqual(U.parseDateFlexible(''), null);
});

/* TV time formatting — mirrors the TV Time profile counter */
t('fmtTvTime: 9 months 15 days 20 hours round-trips', () => {
  const mins = ((9 * 30 + 15) * 24 + 20) * 60;
  assert.deepStrictEqual(U.fmtTvTime(mins), { months: 9, days: 15, hours: 20 });
});
t('fmtTvTime: zero is all zeros', () => {
  assert.deepStrictEqual(U.fmtTvTime(0), { months: 0, days: 0, hours: 0 });
});

/* Day grouping for Upcoming */
t('dayGroup: today / yesterday / weekday / later', () => {
  const now = new Date('2026-07-04T15:00:00').getTime(); // a Saturday
  const iso = (offsetDays) => new Date(now + offsetDays * U.DAY_MS).toISOString().slice(0, 10);
  assert.strictEqual(U.dayGroup(iso(0), now).label, 'TODAY');
  assert.strictEqual(U.dayGroup(iso(-1), now).label, 'YESTERDAY');
  assert.strictEqual(U.dayGroup(iso(2), now).label, 'MONDAY');
  const later = U.dayGroup(iso(9), now);
  assert.strictEqual(later.label, 'LATER');
  assert.strictEqual(later.daysAway, 9);
});

/* Misc */
t('seLabel pads to two digits', () => {
  assert.strictEqual(U.seLabel(1, 30), 'S01 | E30');
});
t('fmtRuntime', () => {
  assert.strictEqual(U.fmtRuntime(106), '1h 46m');
  assert.strictEqual(U.fmtRuntime(45), '45m');
});
t('fmtNumber adds thousands separators', () => {
  assert.strictEqual(U.fmtNumber(11413), '11,413');
});
t('esc escapes HTML', () => {
  assert.strictEqual(U.esc('<b>&"\'</b>'), '&lt;b&gt;&amp;&quot;&#39;&lt;/b&gt;');
});


/* ---------- Multi-source import helpers ---------- */

t('detectSource: letterboxd by Letterboxd URI header', () => {
  assert.strictEqual(U.detectSource(['Date', 'Name', 'Year', 'Letterboxd URI']), 'letterboxd');
});

t('detectSource: imdb by Const + Title Type', () => {
  assert.strictEqual(U.detectSource(['Const', 'Your Rating', 'Date Rated', 'Title', 'Title Type', 'Year']), 'imdb');
});

t('detectSource: netflix by exact Title+Date pair', () => {
  assert.strictEqual(U.detectSource(['Title', 'Date']), 'netflix');
});

t('detectSource: tvtime by tv_show_name', () => {
  assert.strictEqual(U.detectSource(['tv_show_name', 'episode_season_number', 'episode_number', 'updated_at']), 'tvtime');
});

t('detectSource: unknown headers fall back to generic', () => {
  assert.strictEqual(U.detectSource(['a', 'b', 'c']), 'generic');
});

t('parseNetflixTitle: standard Season N pattern', () => {
  const p = U.parseNetflixTitle('Dark: Season 2: Ghosts');
  assert.deepStrictEqual(p, { show: 'Dark', season: 2, epName: 'Ghosts' });
});

t('parseNetflixTitle: Limited Series maps to season 1', () => {
  const p = U.parseNetflixTitle("The Queen's Gambit: Limited Series: Openings");
  assert.strictEqual(p.season, 1);
  assert.strictEqual(p.show, "The Queen's Gambit");
});

t('parseNetflixTitle: Part N and colons inside show name', () => {
  const p = U.parseNetflixTitle('Money Heist: Part 3: Episode 1');
  assert.deepStrictEqual(p, { show: 'Money Heist', season: 3, epName: 'Episode 1' });
});

t('parseNetflixTitle: colon inside episode name survives', () => {
  const p = U.parseNetflixTitle('Some Show: Season 1: The End: Part Two');
  assert.strictEqual(p.epName, 'The End: Part Two');
});

t('parseNetflixTitle: plain film title', () => {
  assert.deepStrictEqual(U.parseNetflixTitle('Oppenheimer'), { film: 'Oppenheimer' });
});

t('parseNetflixTitle: two-segment title treated as film', () => {
  assert.deepStrictEqual(U.parseNetflixTitle('Mission: Impossible'), { film: 'Mission: Impossible' });
});


t('parseDateFlexible: ambiguous slash date reads as UK dd/mm', () => {
  const t1 = U.parseDateFlexible('05/01/2024');
  const d = new Date(t1);
  assert.strictEqual(d.getUTCMonth(), 0); // January
  assert.strictEqual(d.getUTCDate(), 5);
});

t('parseDateFlexible: impossible day flips to mm/dd', () => {
  const t1 = U.parseDateFlexible('12/25/2024');
  const d = new Date(t1);
  assert.strictEqual(d.getUTCMonth(), 11); // December
  assert.strictEqual(d.getUTCDate(), 25);
});



/* ---------- Phase 1.5 helpers ---------- */

t('yearRange: ended show gives start-end', () => {
  assert.strictEqual(U.yearRange('2000-10-03', '2002-03-27', 'Ended'), '2000-2002');
});

t('yearRange: returning show leaves the end open', () => {
  assert.strictEqual(U.yearRange('2021-09-17', '2024-06-26', 'Returning Series'), '2021-');
});

t('yearRange: single-year show collapses to one year', () => {
  assert.strictEqual(U.yearRange('2019-05-06', '2019-05-30', 'Ended'), '2019');
});

t('yearRange: no first air date gives empty string', () => {
  assert.strictEqual(U.yearRange('', '2020-01-01', 'Ended'), '');
});

t('pickVideos: keeps YouTube only, trailers first, caps at 6', () => {
  const list = [
    { site: 'Vimeo', key: 'x', type: 'Trailer' },
    { site: 'YouTube', key: 'a', type: 'Clip' },
    { site: 'YouTube', key: 'b', type: 'Trailer' },
    { site: 'YouTube', key: 'c', type: 'Behind the Scenes' },
    { site: 'YouTube', key: 'd', type: 'Teaser' },
    { site: 'YouTube', key: 'e', type: 'Opening Credits' }
  ];
  const out = U.pickVideos(list, 6);
  assert.deepStrictEqual(out.map((v) => v.key), ['b', 'd', 'c', 'a']);
});

t('pickVideos: official trailers outrank unofficial ones', () => {
  const list = [
    { site: 'YouTube', key: 'fan', type: 'Trailer', official: false },
    { site: 'YouTube', key: 'off', type: 'Trailer', official: true }
  ];
  assert.strictEqual(U.pickVideos(list)[0].key, 'off');
});

t('flattenProviders: de-dupes across kinds, stream label wins', () => {
  const region = {
    flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/n.png' }],
    rent: [
      { provider_id: 8, provider_name: 'Netflix', logo_path: '/n.png' },
      { provider_id: 2, provider_name: 'Apple TV', logo_path: '/a.png' }
    ]
  };
  const out = U.flattenProviders(region);
  assert.strictEqual(out.length, 2);
  assert.strictEqual(out[0].name, 'Netflix');
  assert.strictEqual(out[0].kind, 'Stream');
  assert.strictEqual(out[1].kind, 'Rent');
});

t('flattenProviders: missing region gives empty list', () => {
  assert.deepStrictEqual(U.flattenProviders(undefined), []);
});

console.log('\nAll ' + passed + ' tests passed.');
