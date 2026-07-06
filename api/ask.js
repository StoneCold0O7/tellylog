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
  'Give 2 to 4 picks. Prefer titles NOT already in the library unless',
  'the user asks about their own list. Ground reasons in what the',
  'library shows they actually watch.'
].join(' ');

/* Best-effort per-IP rate limit: 10 asks per 10 minutes. In-memory,
   so it resets on cold starts and is per-instance; it deters casual
   abuse of a live key, not a determined attacker. A durable limit
   (KV-backed) stays on the Phase 2 list. */
const RL_WINDOW_MS = 10 * 60 * 1000;
const RL_MAX = 10;
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < RL_WINDOW_MS);
  if (arr.length >= RL_MAX) { hits.set(ip, arr); return true; }
  arr.push(now);
  hits.set(ip, arr);
  return false;
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
  const question = String(body.question || '').slice(0, MAX_QUESTION).trim();
  const library = String(body.library || '').slice(0, MAX_LIBRARY);
  if (!question) {
    res.status(400).json({ error: 'question required' });
    return;
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) {
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
        max_tokens: 700,
        system: SYSTEM,
        messages: [{
          role: 'user',
          content: 'My library:\n' + (library || '(empty)') + '\n\nQuestion: ' + question
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
      res.status(200).json({ answer: text.slice(0, 600), picks: [] });
      return;
    }

    res.status(200).json({
      answer: String(parsed.answer || ''),
      picks: Array.isArray(parsed.picks) ? parsed.picks.slice(0, 4) : []
    });
  } catch (e) {
    res.status(500).json({ error: 'The ask service crashed: ' + ((e && e.message) || 'unknown error') });
  }
}
