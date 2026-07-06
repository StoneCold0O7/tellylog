# TellyLog: Phase 2 handover (supersedes the Phase 1.5 handover)

Last updated: 6 July 2026 (evening), after the Phase 1.6 polish pass. The Logline rename was reverted the same day to match the tellylog domain; see SESSION-LOG-PHASE1_6.md. v2.2.0, 74 tests green. Take this file plus the current codebase zip into the next session. SESSION-LOG.md in the repo carries the full reasoning record.

Style rules for all output: no em dashes, no ", and", confidence tags [Certain] / [Likely] / [Guessing] on factual claims.

## 1. Current state

- Deployed at tellylog-3d2u.vercel.app. Brand is TellyLog again everywhere; storage key was always tellylog:v1. [Certain]
- Tests: 72 (40 util, 25 store, 7 jsdom smoke). Production build clean. [Certain]
- Phase 1.5 shipped: show modal enrichment (about, cast, GB providers with JustWatch credit, trailers, more-like-this rail), episode depth (stills, overviews, air and watched dates, next-up highlight, season mini progress), perceived performance (skeletons, image fade-in, no layout shift)
- Phase 2 scaffold shipped dormant: /api/health, /api/ask (Anthropic, JSON-constrained), /api/tmdb proxy (path allowlist), client ask box gated on /api/health. Nothing visible until env vars exist. [Certain]
- Author remains non-technical: tests run inside the build session, verification via browser checklist, GitHub upload by drag-and-drop, deleted files always listed.

## 2. Phase 2 proper (next build session)

Preconditions the author must complete first:
1. Real TV Time export imported and verified (~11,413 episodes). Still outstanding. [Certain]
2. ANTHROPIC_API_KEY added in Vercel per VERCEL-SETUP.md, box confirmed appearing.

Then the session covers:
- Flip src/lib/tmdb.js to the /api/tmdb proxy when /api/health reports tmdbProxy, with client-key fallback, removing the key-entry onboarding for strangers
- Rate limiting on /api/ask (the scaffold has none; the author's key is spendable by anyone if the link circulates) [Certain]
- Ask box quality pass with real history: prompt tuning, empty-library handling, maybe rated favourites (the deferred ratings decision lives here and only here)

## 3. After that

Phase 3: README and decision log as the primary portfolio deliverable. SESSION-LOG.md plus PHASE1-NOTES.md carry the raw material. The Kino rejection (name collision with a same-category AI-feature competitor at kino-tv.co, evidence in SESSION-LOG.md) and the Supabase scope-out defence both belong in it.

## 4. Open decisions for the author

1. Real export verification, run before Phase 2 proper. [Certain it remains outstanding]
2. Env vars: when to spend money. VERCEL-SETUP.md is the instruction sheet.
3. Vercel project rename: optional, breaks old links, localStorage is per-domain so a backup-and-restore is required if done. [Certain]


## Added by the Phase 1.6 session (6 July 2026, evening)

New in v2.2.0: preview-before-add TitleModal for shows AND films, clickable underlined titles with › everywhere, season header quick-tick, zero-episode season fix, home ARCHIVED section, profile Posters/List toggle with archived chips, tappable Films-watched tile, "Import watch history" relabel, ask-box error surfacing plus a per-IP rate limit.

### Phase 2b backlog (agreed direction, needs a go)
1. Stats charts: genre bar/pie plus a year-and-month line chart from the log timestamps. Blocker to resolve first: persist show.genres as a small additive field (recommended) or fetch per view. Hand-rolled SVG, no chart library.
2. AI taste summary on the profile ("you watch mostly X and Y..."), reusing librarySummary and the /api serverless pattern. Second AI surface for the portfolio story.
3. Voice input on the ask box via the free browser Web Speech API (no Firefox support). One mic button.
4. Durable rate limit for /api/ask (KV) replacing the in-memory one.

### Phase 2 proper, still gated on owner actions
- Owner adds TMDB_API_KEY in Vercel and redeploys, then the session flips src/lib/tmdb.js to /api/tmdb (removes visitor key entry).
- Owner confirms Anthropic credit balance so the ask box answers.

### Explicit scope-outs reaffirmed
- No accounts/auth/Supabase. The TMDB key is not a login and data is not tied to it; localStorage plus backup/restore is the model. Documented as a deliberate cost-vs-value call for the README.
- No native iOS build. PWA (manifest + service worker) is the Phase 3 polish path if an installable app is wanted.
