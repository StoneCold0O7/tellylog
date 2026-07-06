/* Phase 2: the TMDB client picks its route once per page load from
   /api/health. Proxy present: every call goes to /api/tmdb with no
   key in the URL. Proxy absent or unreachable: the pre-Phase-2 direct
   path with the browser-stored key, byte for byte. */
import { describe, it, expect, beforeEach, vi } from 'vitest';

function healthResponse(flags) {
  return {
    ok: true,
    headers: { get: () => 'application/json' },
    json: () => Promise.resolve(Object.assign({ ok: true }, flags))
  };
}

function tmdbResponse() {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve({ results: [] })
  };
}

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
});

describe('tmdb client mode', () => {
  it('routes through /api/tmdb with no key when the proxy is live', async () => {
    const calls = [];
    globalThis.fetch = vi.fn((url) => {
      calls.push(String(url));
      if (String(url) === '/api/health') return Promise.resolve(healthResponse({ llm: false, tmdbProxy: true }));
      return Promise.resolve(tmdbResponse());
    });
    const TMDB = await import('../src/lib/tmdb.js');
    await TMDB.searchTV('severance');
    const tmdbCall = calls.find((u) => u.indexOf('/api/tmdb/') === 0);
    expect(tmdbCall).toBeTruthy();
    expect(tmdbCall.indexOf('/api/tmdb/search/tv?')).toBe(0);
    expect(tmdbCall).not.toContain('api_key');
    expect(calls.some((u) => u.indexOf('themoviedb.org') !== -1)).toBe(false);
  });

  it('falls back to the direct browser-key path when the proxy flag is false', async () => {
    const calls = [];
    globalThis.fetch = vi.fn((url) => {
      calls.push(String(url));
      if (String(url) === '/api/health') return Promise.resolve(healthResponse({ llm: false, tmdbProxy: false }));
      return Promise.resolve(tmdbResponse());
    });
    localStorage.setItem('tellylog:v1', JSON.stringify({
      version: 1, settings: { apiKey: 'test-key', profileName: 'You' }, shows: {}, movies: {}, log: []
    }));
    const Store = await import('../src/lib/store.js');
    Store.load();
    const TMDB = await import('../src/lib/tmdb.js');
    await TMDB.searchTV('severance');
    const direct = calls.find((u) => u.indexOf('https://api.themoviedb.org/3/search/tv') === 0);
    expect(direct).toBeTruthy();
    expect(direct).toContain('api_key=test-key');
    expect(calls.some((u) => u.indexOf('/api/tmdb/') === 0)).toBe(false);
  });

  it('rejects with NO_KEY when there is no proxy and no browser key', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('offline')));
    const Store = await import('../src/lib/store.js');
    Store.load();
    const TMDB = await import('../src/lib/tmdb.js');
    await expect(TMDB.searchTV('severance')).rejects.toThrow('NO_KEY');
  });
});
