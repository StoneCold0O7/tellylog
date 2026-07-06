/* jsdom smoke tests: the app mounts, gates on the API key and renders
   the Shows tab from seeded localStorage data. Catches wiring errors
   that the pure-logic suites cannot. */
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

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
  location.hash = '';
});

describe('App smoke', () => {
  it('shows onboarding when no API key is stored', () => {
    Store.load();
    const el = mount();
    expect(el.innerHTML).toContain('Save and start');
    expect(el.innerHTML).toContain('themoviedb.org');
  });

  it('renders the Shows tab with Watch Next from seeded data', () => {
    const state = {
      version: 1,
      settings: { apiKey: 'test-key', profileName: 'You' },
      shows: {
        1: {
          id: 1, name: 'Alpha', poster: '', backdrop: '', status: 'Ended',
          network: 'TestNet', avgRuntime: 40, seasons: { 1: 3 },
          nextEp: null, lastEp: null,
          watched: { 1: [1] }, lastWatchedAt: Date.now(), added: Date.now(),
          archived: false, detailsFetchedAt: Date.now()
        }
      },
      movies: {},
      log: [{ showId: 1, s: 1, e: 1, ts: Date.now() }]
    };
    localStorage.setItem('tellylog:v1', JSON.stringify(state));
    Store.load();
    const el = mount();
    expect(el.innerHTML).toContain('WATCH NEXT');
    expect(el.innerHTML).toContain('ALPHA');
    expect(el.innerHTML).toContain('WATCHED HISTORY');
  });

  it('marks the next episode watched when the check button is clicked', () => {
    const state = {
      version: 1,
      settings: { apiKey: 'test-key', profileName: 'You' },
      shows: {
        1: {
          id: 1, name: 'Alpha', poster: '', backdrop: '', status: 'Ended',
          network: 'TestNet', avgRuntime: 40, seasons: { 1: 3 },
          nextEp: null, lastEp: null,
          watched: {}, lastWatchedAt: null, added: Date.now(),
          archived: false, detailsFetchedAt: Date.now()
        }
      },
      movies: {},
      log: []
    };
    localStorage.setItem('tellylog:v1', JSON.stringify(state));
    Store.load();
    const el = mount();
    const check = el.querySelector('.check');
    expect(check).toBeTruthy();
    act(() => { check.click(); });
    expect(Store.get().shows[1].watched[1]).toContain(1);
    expect(el.innerHTML).toContain('WATCHED HISTORY');
  });
});
