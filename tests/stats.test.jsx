/* jsdom tests for the v2.5.0 interactivity: the stats modal drill-downs
   and the Shows tab WATCHLIST section. fetch is stubbed offline so the
   genre backfill path is exercised as a no-op (all records already
   carry genreList). */
import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import * as Store from '../src/lib/store.js';
import { AppContext } from '../src/context.js';
import StatsModal from '../src/components/StatsModal.jsx';
import ShowsTab from '../src/components/ShowsTab.jsx';
import WatchlistModal from '../src/components/WatchlistModal.jsx';

globalThis.fetch = () => Promise.reject(new Error('offline'));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const ctx = {
  go: () => {}, toast: () => {}, openShow: () => {}, openPreview: () => {},
  openModal: () => {}, closeModal: () => {}, moviesSub: 'watchlist',
  setMoviesSub: () => {}, offerGrid: () => {}
};

async function mount(node) {
  const el = document.createElement('div');
  document.body.appendChild(el);
  const root = createRoot(el);
  await act(async () => { root.render(<AppContext.Provider value={ctx}>{node}</AppContext.Provider>); });
  await act(async () => {});
  return el;
}

function seed(shows, log) {
  const state = {
    version: 1,
    settings: { apiKey: 'test-key', profileName: 'You' },
    shows: shows || {}, movies: {}, log: log || []
  };
  localStorage.setItem('tellylog:v1', JSON.stringify(state));
  Store.load();
}

function show(id, name, genres, watchedEps, ts, extra) {
  const watched = {};
  const log = [];
  if (watchedEps) {
    watched[1] = [];
    for (let e = 1; e <= watchedEps; e++) { watched[1].push(e); log.push({ showId: id, s: 1, e, ts: ts || Date.now() }); }
  }
  return [Object.assign({
    id, name, poster: '', backdrop: '', status: 'Ended', network: 'N',
    avgRuntime: 40, seasons: { 1: 10 }, nextEp: null, lastEp: null,
    watched, lastWatchedAt: watchedEps ? (ts || Date.now()) : null,
    added: Date.now(), archived: false, detailsFetchedAt: Date.now(),
    genreList: genres, watchlist: false
  }, extra || {}), log];
}

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('StatsModal drill-downs (v2.5.0)', () => {
  it('clicking a genre bar reveals the contributing titles', async () => {
    const jan = new Date(2025, 0, 10).getTime();
    const [a, logA] = show(1, 'CrimeShow', ['Crime'], 5, jan);
    const [b, logB] = show(2, 'DramaShow', ['Drama'], 3, jan);
    seed({ 1: a, 2: b }, logA.concat(logB));
    const el = await mount(<StatsModal />);
    expect(el.textContent).toContain('Hours by genre');
    const bar = el.querySelector('.chart-hit');
    expect(bar).toBeTruthy();
    await act(async () => { bar.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(el.textContent).toContain('Titles counted under Crime');
    expect(el.textContent).toContain('CrimeShow');
    expect(el.textContent).not.toContain('DramaShow › ');
  });

  it('clicking a month point reveals what was logged that month', async () => {
    const jan = new Date(2025, 0, 10).getTime();
    const feb = new Date(2025, 1, 10).getTime();
    const [a, logA] = show(3, 'Timed', ['Drama'], 2, jan);
    seed({ 3: a }, logA.concat([{ showId: 3, s: 1, e: 3, ts: feb }]));
    Store.load();
    Store.get().shows[3].watched[1].push(3);
    const el = await mount(<StatsModal />);
    expect(el.textContent).toContain('Watch activity by month');
    const dots = el.querySelectorAll('circle.chart-hit');
    expect(dots.length).toBeGreaterThan(1);
    await act(async () => { dots[0].dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(el.textContent).toContain('Logged in 2025-01');
    expect(el.textContent).toContain('Timed');
  });
});

describe('Shows tab watchlist (v2.7.1+ modal)', () => {
  it('the Shows tab surfaces the Watchlist button, and the modal lists the saved show with Start moving it to the queue', async () => {
    const [a] = show(4, 'SavedShow', ['Drama'], 0, null, { watchlist: true });
    const [b, logB] = show(5, 'ActiveShow', ['Drama'], 1, Date.now());
    seed({ 4: a, 5: b }, logB);

    /* v2.7.1 moved the inline WATCHLIST section into a modal opened from
       a top-of-tab button; the saved count lives on that button now, and
       the old all-caps "WATCHLIST (n)" heading no longer renders inline. */
    const tab = await mount(<ShowsTab />);
    expect(tab.textContent).toContain('🔖 Watchlist (1)');
    expect(tab.textContent).not.toContain('WATCHLIST (1)');
    expect(tab.textContent).not.toContain('Saved to watch later');

    /* The saved rows themselves live in WatchlistModal (opened via
       openModal, stubbed here), so mount it directly to exercise their
       copy and the Start action. */
    const modal = await mount(<WatchlistModal />);
    expect(modal.textContent).toContain('SavedShow');
    expect(modal.textContent).toContain('Saved to watch later');
    const start = Array.from(modal.querySelectorAll('button')).find((x) => x.textContent === 'Start');
    expect(start).toBeTruthy();
    await act(async () => { start.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(Store.get().shows[4].watchlist).toBe(false);
  });
});
