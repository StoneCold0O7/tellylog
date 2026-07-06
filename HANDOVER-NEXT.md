# Logline: Phase 2 handover (supersedes the Phase 1.5 handover)

Last updated: 6 July 2026, after the Phase 1.5 depth pass, the Phase 2 scaffold and the rename from TellyLog to Logline. Take this file plus the current codebase zip into the next session. SESSION-LOG.md in the repo carries the full reasoning record.

Style rules for all output: no em dashes, no ", and", confidence tags [Certain] / [Likely] / [Guessing] on factual claims.

## 1. Current state

- Deployed at tellylog-3d2u.vercel.app (domain rename optional, see VERCEL-SETUP.md). App renamed Logline throughout the UI; storage key remains tellylog:v1 on purpose. [Certain]
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
