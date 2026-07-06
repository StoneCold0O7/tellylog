/* TellyLog - /api/tmdb/*
   Phase 2 scaffold: server-side TMDB proxy. Forwards any GET under
   /api/tmdb/... to api.themoviedb.org/3/... with the key from the
   TMDB_API_KEY env var appended server-side. The client still uses its
   own local key today; flipping src/lib/tmdb.js to this proxy is the
   Phase 2 switch that removes the key-entry onboarding step entirely.
   Returns 503 until the env var exists. */
const ALLOWED = /^(search|tv|movie|trending|configuration)(\/|$)/;

export default async function handler(req, res) {
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    res.status(503).json({ error: 'not configured' });
    return;
  }
  const parts = req.query.path;
  const path = Array.isArray(parts) ? parts.join('/') : String(parts || '');
  if (!ALLOWED.test(path)) {
    res.status(400).json({ error: 'path not allowed' });
    return;
  }
  const params = new URLSearchParams();
  Object.keys(req.query).forEach((k) => {
    if (k !== 'path' && k !== 'api_key') params.set(k, String(req.query[k]));
  });
  params.set('api_key', key);
  try {
    const upstream = await fetch('https://api.themoviedb.org/3/' + path + '?' + params.toString());
    const data = await upstream.json();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(upstream.status).json(data);
  } catch (e) {
    res.status(502).json({ error: 'upstream unreachable' });
  }
}
