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
    headers: { get: () => 'application/json' },
    json: () => Promise.resolve({ results: [] })
  };
}

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
});

describe('tmdb client mode', () => {
  it('verifies the proxy with one real call, then routes through /api/tmdb?p= with no key', async () => {
    const calls = [];
    globalThis.fetch = vi.fn((url) => {
      calls.push(String(url));
      if (String(url) === '/api/health') return Promise.resolve(healthResponse({ llm: false, tmdbProxy: true }));
      return Promise.resolve(tmdbResponse());
    });
    const TMDB = await import('../src/lib/tmdb.js');
    await TMDB.searchTV('severance');
    expect(calls).toContain('/api/tmdb?p=configuration'); // the trust-but-verify probe
    const tmdbCall = calls.find((u) => u.indexOf('/api/tmdb?p=search') === 0);
    expect(tmdbCall).toBeTruthy();
    expect(tmdbCall.indexOf('/api/tmdb?p=search%2Ftv&')).toBe(0);
    expect(tmdbCall).not.toContain('api_key');
    expect(calls.some((u) => u.indexOf('themoviedb.org') !== -1)).toBe(false);
  });

  it('health says proxy but the proxy itself fails: falls back to the direct key path (the v2.3.0 live incident)', async () => {
    const calls = [];
    globalThis.fetch = vi.fn((url) => {
      calls.push(String(url));
      if (String(url) === '/api/health') return Promise.resolve(healthResponse({ llm: true, tmdbProxy: true }));
      if (String(url).indexOf('/api/tmdb') === 0) return Promise.resolve({ ok: false, status: 404, headers: { get: () => 'text/html' }, json: () => Promise.reject(new Error('html')) });
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
    expect(calls.some((u) => u.indexOf('/api/tmdb?p=') === 0)).toBe(false);
  });

  it('rejects with NO_KEY when there is no proxy and no browser key', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('offline')));
    const Store = await import('../src/lib/store.js');
    Store.load();
    const TMDB = await import('../src/lib/tmdb.js');
    await expect(TMDB.searchTV('severance')).rejects.toThrow('NO_KEY');
  });
});
