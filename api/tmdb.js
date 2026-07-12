/* TellyLog - /api/tmdb
   v2.3.1: plain single-file endpoint replacing the bracket-named
   catch-all api/tmdb/[...path].js, which never routed correctly in
   production while its sibling /api/health did. Same mechanism as
   health now: one flat file, zero routing magic. The TMDB subpath
   arrives as the ?p= query param. Forwards GETs to
   api.themoviedb.org/3/<p> with the key from the TMDB_API_KEY env var
   appended server-side. Returns 503 until the env var exists and an
   owner-actionable message if TMDB rejects the server key.
   discover/* is allowed for the deterministic Explore rails backfill. */
const ALLOWED = /^(search|tv|movie|trending|configuration|discover)(\/|$)/;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'GET only' });
    return;
  }
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    res.status(503).json({ error: 'not configured' });
    return;
  }
  const path = String(req.query.p || '');
  if (!ALLOWED.test(path)) {
    res.status(400).json({ error: 'path not allowed' });
    return;
  }
  const params = new URLSearchParams();
  Object.keys(req.query).forEach((k) => {
    if (k !== 'p' && k !== 'api_key') params.set(k, String(req.query[k]));
  });
  params.set('api_key', key);
  try {
    const upstream = await fetch('https://api.themoviedb.org/3/' + path + '?' + params.toString());
    const data = await upstream.json().catch(() => ({}));
    if (upstream.status === 401) {
      /* Never forward TMDB's own 401 wording; name the real fix. */
      res.status(502).json({ error: 'TMDB rejected the server key. The TMDB_API_KEY env var in Vercel must hold ONLY the 32-character v3 API key. Fix the value, then redeploy.' });
      return;
    }
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(upstream.status).json(data);
  } catch (e) {
    res.status(502).json({ error: 'upstream unreachable' });
  }
}
