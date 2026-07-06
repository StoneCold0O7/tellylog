/* Logline - /api/health
   One-shot capability probe. The client hides every Phase 2 surface
   unless this returns ok:true with the matching flag. No secrets are
   ever echoed, only booleans for their presence. */
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    ok: true,
    llm: !!process.env.ANTHROPIC_API_KEY,
    tmdbProxy: !!process.env.TMDB_API_KEY
  });
}
