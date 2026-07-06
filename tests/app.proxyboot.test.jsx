/* Phase 2 boot gate: with no browser key and the server proxy live, a
   visitor lands straight on the search-led first run. With no proxy,
   the key screen shows exactly as before. */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/* tmdb.js decides its mode once per module instance, so each test gets
   a fresh module registry via resetModules + dynamic import. */
async function freshApp() {
  vi.resetModules();
  const Store = await import('../src/lib/store.js');
  const mod = await import('../src/components/App.jsx');
  Store.load();
  return mod.default;
}

function healthResponse(flags) {
  return {
    ok: true,
    headers: { get: () => 'application/json' },
    json: () => Promise.resolve(Object.assign({ ok: true }, flags))
  };
}

async function mount(App) {
  const el = document.createElement('div');
  document.body.appendChild(el);
  const root = createRoot(el);
  await act(async () => { root.render(<App />); });
  await act(async () => {});
  return el;
}

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
  location.hash = '';
});

describe('App boot with the TMDB proxy', () => {
  it('no key + proxy live: visitor goes straight to first run, no key screen', async () => {
    globalThis.fetch = vi.fn((url) => {
      if (String(url) === '/api/health') return Promise.resolve(healthResponse({ llm: false, tmdbProxy: true }));
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ results: [] }) });
    });
    const App = await freshApp();
    const el = await mount(App);
    expect(el.innerHTML).toContain('What are you watching?');
    expect(el.innerHTML).not.toContain('Save and start');
  });

  it('no key + no proxy: the key screen shows as it always did', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('offline')));
    const App = await freshApp();
    const el = await mount(App);
    expect(el.innerHTML).toContain('Save and start');
    expect(el.innerHTML).toContain('themoviedb.org');
  });
});
