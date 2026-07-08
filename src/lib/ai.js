/* TellyLog - ai.js
   Phase 2 scaffold client. Talks to the Vercel serverless functions in
   /api. Every call fails silently to null: if the functions are not
   deployed or the ANTHROPIC_API_KEY env var is missing, the ask box
   simply never appears. No key ever lives in this repo. */

let healthPromise = null;

/* Probe /api/health once per page load. Resolves to
   { llm: bool, tmdbProxy: bool } or null when the API is absent. */
export function checkHealth() {
  if (healthPromise) return healthPromise;
  healthPromise = fetch('/api/health')
    .then(function (res) {
      if (!res.ok) return null;
      var ct = res.headers.get('content-type') || '';
      if (ct.indexOf('application/json') === -1) return null; // SPA fallback page
      return res.json();
    })
    .then(function (data) {
      if (!data || data.ok !== true) return null;
      return { llm: !!data.llm, tmdbProxy: !!data.tmdbProxy };
    })
    .catch(function () { return null; });
  return healthPromise;
}

/* Ask the LLM for picks. `library` is the plain-text summary from
   Store.librarySummary(). Resolves to { answer, picks:[{title, year,
   mediaType, reason}] } or rejects with a message safe to show. */
export function ask(question, library) {
  return fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: question, library: library })
  }).then(function (res) {
    if (res.ok) return res.json();
    /* Pull the server's explanation through so failures are debuggable
       from the UI (bad key, no credit, rate limit and so on). */
    return res.json().catch(function () { return {}; }).then(function (data) {
      if (res.status === 503) throw new Error('The ask service is not configured yet.');
      throw new Error(data.error || 'The ask service had a problem (HTTP ' + res.status + '). Try again.');
    });
  }).then(function (data) {
    return {
      answer: String(data.answer || ''),
      picks: Array.isArray(data.picks) ? data.picks.slice(0, 7).map(function (p) {
        return {
          title: String(p.title || ''),
          year: p.year ? String(p.year) : '',
          mediaType: p.mediaType === 'movie' ? 'movie' : 'tv',
          reason: String(p.reason || '')
        };
      }) : []
    };
  });
}

/* One-shot taste summary for the Profile page. Same endpoint, taste
   mode, so it shares the key gate and the rate limiter. Resolves to
   { summary } or rejects with a message safe to show. */
export function tasteSummary(library) {
  return fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'taste', library: library })
  }).then(function (res) {
    if (res.ok) return res.json();
    return res.json().catch(function () { return {}; }).then(function (data) {
      if (res.status === 503) throw new Error('The summary service is not configured yet.');
      throw new Error(data.error || 'The summary service had a problem (HTTP ' + res.status + '). Try again.');
    });
  }).then(function (data) {
    return { summary: String(data.summary || '') };
  });
}

/* v2.7.0: one-shot Explore rails, now genre-anchored. Same endpoint,
   rails mode, so it shares the key gate and the rate limiter. anchors
   come from Store.genreRailAnchors(), never from the model; the basis
   line is built client-side so it is not part of this contract.
   Resolves to { rails:[{anchor, picks:[{title, year, mediaType,
   reason}]}], note } or rejects with a message safe to show. */
export function rails(library, anchors) {
  return fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'rails', library: library, anchors: anchors })
  }).then(function (res) {
    if (res.ok) return res.json();
    return res.json().catch(function () { return {}; }).then(function (data) {
      if (res.status === 503) throw new Error('The recommendation service is not configured yet.');
      throw new Error(data.error || 'The recommendation service had a problem (HTTP ' + res.status + '). Try again.');
    });
  }).then(function (data) {
    return {
      note: String(data.note || ''),
      rails: Array.isArray(data.rails) ? data.rails.slice(0, 4).map(function (r) {
        return {
          anchor: String(r.anchor || ''),
          picks: Array.isArray(r.picks) ? r.picks.slice(0, 5).map(function (p) {
            return {
              title: String(p.title || ''),
              year: p.year ? String(p.year) : '',
              mediaType: p.mediaType === 'movie' ? 'movie' : 'tv',
              reason: String(p.reason || '')
            };
          }) : []
        };
      }) : []
    };
  });
}
