/* v2.6.0 client tests: the rails() contract in ai.js plus the
   RailsSection gates (no LLM key = nothing renders, empty library =
   nothing renders, no fake rails either way). fetch is mocked. */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as AI from '../src/lib/ai.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

async function mount(Comp) {
  const el = document.createElement('div');
  document.body.appendChild(el);
  const root = createRoot(el);
  await act(async () => { root.render(<Comp onAdded={() => {}} />); });
  await act(async () => {});
  return el;
}

function jsonResponse(obj, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/json' },
    json: () => Promise.resolve(obj)
  });
}

describe('ai.rails()', () => {
  beforeEach(() => { vi.unstubAllGlobals(); });

  it('posts rails mode with the anchors and returns sanitised rails', async () => {
    const fetchMock = vi.fn(() => jsonResponse({
      note: 'thin library',
      rails: [{
        anchor: 'Alpha', kind: 'tv', basis: 'crime pacing',
        picks: Array.from({ length: 9 }, (_, i) => ({ title: 'P' + i, year: '2020', mediaType: 'tv', reason: 'r' }))
      }]
    }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await AI.rails('lib text', [{ title: 'Alpha', kind: 'tv' }]);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.mode).toBe('rails');
    expect(body.anchors[0].title).toBe('Alpha');
    expect(res.note).toBe('thin library');
    expect(res.rails[0].picks.length).toBe(6); // capped client-side too
  });

  it('surfaces the server explanation on failure', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({ error: 'Too many asks from this address. Try again in a few minutes.' }, 429)));
    await expect(AI.rails('lib', [{ title: 'A', kind: 'tv' }])).rejects.toThrow(/Too many asks/);
  });
});

describe('RailsSection gates', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('renders nothing when /api/health reports no LLM', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({ ok: true, llm: false, tmdbProxy: false })));
    const { default: RailsSection } = await import('../src/components/RailsSection.jsx');
    const el = await mount(RailsSection);
    expect(el.innerHTML).toBe('');
  });

  it('renders nothing with an empty library even when the LLM is up: no fake rails', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({ ok: true, llm: true, tmdbProxy: true })));
    const Store = await import('../src/lib/store.js');
    Store.load();
    Store.clearAll();
    const { default: RailsSection } = await import('../src/components/RailsSection.jsx');
    const el = await mount(RailsSection);
    expect(el.innerHTML).toBe('');
  });
});
