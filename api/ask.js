/* TellyLog - /api/ask
   Phase 2 scaffold. POST { question, library } -> { answer, picks }.
   Calls the Anthropic Messages API server-side; the key lives only in
   the ANTHROPIC_API_KEY Vercel env var (see VERCEL-SETUP.md). Returns
   503 until that var exists, which keeps the client feature hidden. */

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';
const MAX_QUESTION = 400;
const MAX_LIBRARY = 6000;

const SYSTEM = [
  'You recommend TV shows and films. You receive the user\'s watch',
  'library and a question. Reply with ONLY a JSON object, no markdown',
  'fences, no preamble, shaped exactly like:',
  '{"answer":"one or two conversational sentences",',
  ' "picks":[{"title":"...","year":"2021","mediaType":"tv|movie","reason":"one short sentence"}]}',
  'Give 8 to 10 picks: 10 when the library is rich, never fewer than',
  '8 (the client filters some out, so headroom matters).',
  'If the library is thin, still give 5 but let the answer say the',
  'picks lean broad. Prefer titles NOT already in the library unless',
  'the user asks about their own list. Ground reasons in what the',
  'library shows they actually watch.'
].join(' ');

const SYSTEM_TASTE = [
  'You summarise a person\'s TV and film taste from their watch',
  'library. Reply with ONLY a JSON object, no markdown fences, no',
  'preamble, shaped exactly like: {"summary":"..."}. The summary is',
  '2 to 3 warm, specific sentences in second person ("you watch',
  'mostly..."), grounded ONLY in what the library actually contains.',
  'Name real patterns (genres, eras, formats, completion habits).',
  'Never invent titles. If the library is nearly empty, say the',
  'picture is still forming.'
].join(' ');

/* v2.7.0: Explore rails, genre-anchored (owner ruling: Netflix-style
   rows). ONE call returns every rail. Anchors are chosen client-side
   from real watch data and passed in; the model must never invent,
   drop or reorder them, so the "because you watch" premise is real by
   construction. The basis line under each rail is built client-side
   from the anchor's example titles, so the evidence cannot be
   hallucinated either. Thin-library honesty stays structural via
   "note". */
const SYSTEM_RAILS = [
  'You fill "Because you watch GENRE" recommendation rails for a TV',
  'and film tracker. You receive the user\'s watch library and a list',
  'of genre anchors chosen FROM that library, each with example titles',
  'that earned it. Reply with ONLY a JSON object, no markdown fences,',
  'no preamble, shaped exactly like:',
  '{"rails":[{"anchor":"the exact genre you were given",',
  '"picks":[{"title":"...","year":"2021","mediaType":"tv|movie",',
  '"reason":"one short sentence"}]}],"note":""}',
  'One rail per anchor, in the exact order given. Never invent,',
  'rename, drop or reorder anchors. Give 9 picks per rail, never',
  'fewer than 7 (the client filters some out, so headroom matters).',
  'Match each rail\'s medium to its kind: "tv" rails',
  'pick shows, "movie" rails pick films, "mixed" rails may pick both.',
  'Never pick a title already in the library. Ground every reason in',
  'what the library actually shows, especially the example titles.',
  'If the library is thin, do NOT fake confidence: put one honest',
  'sentence in "note" saying the picks lean broad until more is',
  'logged. Otherwise "note" must be an empty string.'
].join(' ');

/* Rate limiting: 10 asks per 10 minutes per IP.
   Durable path: an Upstash Redis REST store (Vercel Marketplace).
   Reads either env naming Vercel uses (UPSTASH_REDIS_REST_URL/TOKEN
   or the legacy KV_REST_API_URL/TOKEN). One pipelined INCR+EXPIRE per
   request; the count survives cold starts and is shared across
   instances. Fallback path: the old in-memory map, used whenever the
   env vars are absent or the store errors, so the feature can never
   go down because the limiter did. */
const RL_WINDOW_MS = 10 * 60 * 1000;
const RL_MAX = 10;

const KV_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';

const hits = new Map();
function rateLimitedMemory(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < RL_WINDOW_MS);
  if (arr.length >= RL_MAX) { hits.set(ip, arr); return true; }
  arr.push(now);
  hits.set(ip, arr);
  return false;
}

async function rateLimited(ip) {
  if (!KV_URL || !KV_TOKEN) return rateLimitedMemory(ip);
  try {
    const bucket = Math.floor(Date.now() / RL_WINDOW_MS);
    const key = 'rl:' + ip + ':' + bucket;
    const resp = await fetch(KV_URL.replace(/\/$/, '') + '/pipeline', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + KV_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, String(Math.ceil(RL_WINDOW_MS / 1000))]
      ])
    });
    if (!resp.ok) return rateLimitedMemory(ip);
    const out = await resp.json();
    const count = Array.isArray(out) && out[0] && typeof out[0].result === 'number' ? out[0].result : null;
    if (count === null) return rateLimitedMemory(ip);
    return count > RL_MAX;
  } catch (e) {
    return rateLimitedMemory(ip);
  }
}

/* Map an Anthropic error response to a message the owner can act on.
   Never echoes the key. */
function friendlyUpstream(status, bodyText) {
  let msg = '';
  try { msg = (JSON.parse(bodyText).error || {}).message || ''; } catch (e) { /* keep empty */ }
  const low = msg.toLowerCase();
  if (status === 401) return 'Anthropic rejected the API key. Re-check the ANTHROPIC_API_KEY value in Vercel and redeploy.';
  if (status === 400 && low.indexOf('credit') !== -1) return 'Your Anthropic account has no credit. Add credit under Billing at console.anthropic.com, then try again.';
  if (status === 404) return 'The model "' + MODEL + '" was not found. Remove or fix the ANTHROPIC_MODEL env var.';
  if (status === 429) return 'Anthropic rate limit hit. Wait a minute and try again.';
  if (status === 529) return 'Anthropic is overloaded right now. Try again shortly.';
  return 'Anthropic error ' + status + (msg ? ': ' + msg.slice(0, 140) : '');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.status(503).json({ error: 'not configured' });
    return;
  }

  const body = req.body || {};
  const mode = body.mode === 'taste' ? 'taste' : body.mode === 'rails' ? 'rails' : 'ask';
  const question = String(body.question || '').slice(0, MAX_QUESTION).trim();
  const library = String(body.library || '').slice(0, MAX_LIBRARY);
  if (mode === 'ask' && !question) {
    res.status(400).json({ error: 'question required' });
    return;
  }
  if ((mode === 'taste' || mode === 'rails') && !library) {
    res.status(400).json({ error: 'library required' });
    return;
  }
  /* v2.7.0: genre anchors arrive from the client, capped at 4 and
     sanitised to plain strings so nothing structured sneaks into the
     prompt. Examples are the titles that earned the genre locally. */
  let anchors = [];
  if (mode === 'rails') {
    anchors = (Array.isArray(body.anchors) ? body.anchors : []).slice(0, 4)
      .map((a) => ({
        genre: String((a && a.genre) || '').slice(0, 60).trim(),
        kind: a && a.kind === 'movie' ? 'movie' : a && a.kind === 'mixed' ? 'mixed' : 'tv',
        examples: (Array.isArray(a && a.examples) ? a.examples : []).slice(0, 3)
          .map((t) => String(t || '').slice(0, 120).trim()).filter(Boolean)
      }))
      .filter((a) => a.genre);
    if (anchors.length === 0) {
      res.status(400).json({ error: 'anchors required' });
      return;
    }
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (await rateLimited(ip)) {
    res.status(429).json({ error: 'Too many asks from this address. Try again in a few minutes.' });
    return;
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: mode === 'taste' ? 300 : mode === 'rails' ? 2000 : 1400,
        system: mode === 'taste' ? SYSTEM_TASTE : mode === 'rails' ? SYSTEM_RAILS : SYSTEM,
        messages: [{
          role: 'user',
          content: mode === 'taste'
            ? 'My library:\n' + library + '\n\nSummarise my taste.'
            : mode === 'rails'
            ? 'My library:\n' + library + '\n\nGenre anchors, in this exact order:\n' + anchors.map((a) => '- ' + a.genre + ' (' + a.kind + ')' + (a.examples.length ? ', earned by: ' + a.examples.join('; ') : '')).join('\n') + '\n\nFill the rails.'
            : 'My library:\n' + (library || '(empty)') + '\n\nQuestion: ' + question
        }]
      })
    });

    if (!upstream.ok) {
      const bodyText = await upstream.text().catch(() => '');
      res.status(502).json({ error: friendlyUpstream(upstream.status, bodyText) });
      return;
    }

    const data = await upstream.json();
    const text = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .replace(/```json|```/g, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      /* Model ignored the JSON instruction: still return something usable. */
      if (mode === 'taste') res.status(200).json({ summary: text.slice(0, 600) });
      else if (mode === 'rails') res.status(200).json({ rails: [], note: 'The model returned an unusable answer. It will retry next time your library changes.' });
      else res.status(200).json({ answer: text.slice(0, 600), picks: [] });
      return;
    }

    if (mode === 'taste') {
      res.status(200).json({ summary: String(parsed.summary || '').slice(0, 800) });
      return;
    }
    if (mode === 'rails') {
      const rails = (Array.isArray(parsed.rails) ? parsed.rails : []).slice(0, 4).map((r) => ({
        anchor: String((r && r.anchor) || '').slice(0, 120),
        /* v2.7.4: 9 not 5. The client deterministically strips owned and
           unresolvable picks, then displays at most 5; without headroom a
           large library thins rails to one or two cards. */
        picks: (Array.isArray(r && r.picks) ? r.picks : []).slice(0, 9).map((p) => ({
          title: String((p && p.title) || '').slice(0, 160),
          year: p && p.year ? String(p.year).slice(0, 4) : '',
          mediaType: p && p.mediaType === 'movie' ? 'movie' : 'tv',
          reason: String((p && p.reason) || '').slice(0, 200)
        })).filter((p) => p.title)
      })).filter((r) => r.anchor && r.picks.length);
      res.status(200).json({ rails, note: String(parsed.note || '').slice(0, 300) });
      return;
    }
    res.status(200).json({
      answer: String(parsed.answer || ''),
      /* v2.7.4: 10 not 7, same headroom logic as rails */
      picks: Array.isArray(parsed.picks) ? parsed.picks.slice(0, 10) : []
    });
  } catch (e) {
    res.status(500).json({ error: 'The ask service crashed: ' + ((e && e.message) || 'unknown error') });
  }
}
