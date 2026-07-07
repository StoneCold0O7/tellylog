/* Client tests for ai.js Phase 2b changes: the pick cap moved from 4
   to 7 and the new taste mode. fetch is mocked; no network. */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as AI from '../src/lib/ai.js';

function jsonResponse(obj, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/json' },
    json: () => Promise.resolve(obj)
  });
}

describe('ai.js Phase 2b', () => {
  beforeEach(() => { vi.unstubAllGlobals(); });

  it('ask() passes through up to 7 picks and drops the rest', async () => {
    const picks = Array.from({ length: 9 }, (_, i) => ({ title: 'T' + i, year: '2020', mediaType: 'tv', reason: 'r' }));
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({ answer: 'ok', picks })));
    const res = await AI.ask('q', 'lib');
    expect(res.picks.length).toBe(7);
    expect(res.picks[0].title).toBe('T0');
    expect(res.picks[6].mediaType).toBe('tv');
  });

  it('tasteSummary() posts taste mode and returns the summary', async () => {
    const fetchMock = vi.fn(() => jsonResponse({ summary: 'You watch mostly crime dramas.' }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await AI.tasteSummary('TV shows tracked:\n- X');
    expect(res.summary).toBe('You watch mostly crime dramas.');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.mode).toBe('taste');
    expect(body.library).toContain('TV shows tracked');
  });

  it('tasteSummary() surfaces the server error message', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({ error: 'Too many asks from this address. Try again in a few minutes.' }, 429)));
    await expect(AI.tasteSummary('lib')).rejects.toThrow(/Too many asks/);
  });
});
