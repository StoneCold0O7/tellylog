/* jsdom smoke tests: the app mounts, gates on the API key and renders
   the Phase 1 Shows tab (FirstRun, Tonight card, stale keep/drop,
   theme attribute) from seeded localStorage data. */
import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import * as Store from '../src/lib/store.js';
import App from '../src/components/App.jsx';

globalThis.fetch = () => Promise.reject(new Error('offline'));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function mount() {
  const el = document.createElement('div');
  document.body.appendChild(el);
  const root = createRoot(el);
  act(() => { root.render(<App />); });
  return el;
}

function seededShow(overrides) {
  return Object.assign({
    id: 1, name: 'Alpha', poster: '', backdrop: '', status: 'Ended',
    network: 'TestNet', avgRuntime: 40, seasons: { 1: 3 },
    nextEp: null, lastEp: null,
    watched: {}, lastWatchedAt: null, added: Date.now(),
    archived: false, detailsFetchedAt: Date.now()
  }, overrides || {});
}

function seed(shows, log, settings) {
  const state = {
    version: 1,
    settings: Object.assign({ apiKey: 'test-key', profileName: 'You' }, settings || {}),
    shows: shows || {},
    movies: {},
    log: log || []
  };
  localStorage.setItem('tellylog:v1', JSON.stringify(state));
  Store.load();
}

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('data-theme');
  location.hash = '';
});

describe('App smoke', () => {
  it('shows onboarding when no API key is stored', () => {
    Store.load();
    const el = mount();
    expect(el.innerHTML).toContain('Save and start');
    expect(el.innerHTML).toContain('themoviedb.org');
  });

  it('shows the search-led first run when the key exists but nothing is tracked', () => {
    seed({}, []);
    const el = mount();
    expect(el.innerHTML).toContain('What are you watching?');
    expect(el.innerHTML).toContain('Import your history instead');
  });

  it('renders the Tonight card for the most recent show with episodes left', () => {
    seed(
      { 1: seededShow({ watched: { 1: [1] }, lastWatchedAt: Date.now() }) },
      [{ showId: 1, s: 1, e: 1, ts: Date.now() }]
    );
    const el = mount();
    expect(el.innerHTML).toContain('TONIGHT');
    expect(el.innerHTML).toContain('Alpha');
    expect(el.innerHTML).toContain('Mark watched');
    expect(el.innerHTML).toContain('WATCHED HISTORY');
  });

  it('logs the next episode from the Tonight card in one tap', () => {
    seed({ 1: seededShow() }, []);
    const el = mount();
    const btn = el.querySelector('.tonight__btn');
    expect(btn).toBeTruthy();
    act(() => { btn.click(); });
    expect(Store.get().shows[1].watched[1]).toContain(1);
    expect(el.innerHTML).toContain('WATCHED HISTORY');
  });

  it('reframes stale shows as Still watching? with one-tap Drop mapping to archive', () => {
    const DAY = 24 * 60 * 60 * 1000;
    seed(
      { 1: seededShow({ watched: { 1: [1] }, lastWatchedAt: Date.now() - 45 * DAY }) },
      [{ showId: 1, s: 1, e: 1, ts: Date.now() - 45 * DAY }]
    );
    const el = mount();
    expect(el.innerHTML).toContain('STILL WATCHING?');
    const drop = Array.from(el.querySelectorAll('.stale-card__actions .btn'))
      .find((b) => b.textContent === 'Drop');
    expect(drop).toBeTruthy();
    act(() => { drop.click(); });
    expect(Store.get().shows[1].archived).toBe(true);
    expect(el.innerHTML).not.toContain('STILL WATCHING?');
  });

  it('Keep on a stale show moves it back to the Tonight card', () => {
    const DAY = 24 * 60 * 60 * 1000;
    seed(
      { 1: seededShow({ watched: { 1: [1] }, lastWatchedAt: Date.now() - 45 * DAY }) },
      [{ showId: 1, s: 1, e: 1, ts: Date.now() - 45 * DAY }]
    );
    const el = mount();
    const keep = Array.from(el.querySelectorAll('.stale-card__actions .btn'))
      .find((b) => b.textContent === 'Keep');
    act(() => { keep.click(); });
    expect(el.innerHTML).toContain('TONIGHT');
    expect(Store.get().shows[1].keptAt).toBeGreaterThan(0);
  });

  it('applies the stored theme to the document element', () => {
    seed({}, [], { theme: 'light' });
    mount();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
