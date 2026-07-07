# TellyLog: master context (CONTEXT.md)

Purpose of this file: cold-start ANY new Claude session (any model) with the full essence of this project. It is the stable half of a two-file pattern. This file changes rarely; the volatile session state lives in HANDOVER-NEXT.md, regenerated at every session close. A new session needs three things: this file, the latest HANDOVER-NEXT.md and the current codebase zip.

Last regenerated: 7 July 2026, at the start of the Phase 2b build (v2.4.0).

---

## 1. What this is and why it exists

TellyLog is a personal TV and film tracker, live at tellylog-3d2u.vercel.app, repo public at github.com/StoneCold0O7/tellylog. It began life as a single-file vanilla JS app modelled on TV Time and was rebuilt across roughly ten sessions into a deployed React app with serverless AI features.

The point is NOT the app. The point is the portfolio narrative for the owner's job search (Business Architect / AI strategy roles, UK market): a public artefact demonstrating genuine AI problem-solving judgment rather than AI decoration. The primary deliverable is therefore the decision record: what was built, what was deliberately NOT built and why, including reversals. Scope-outs are framed as cost-versus-value judgments, never as limitations.

## 2. The owner and the working contract

The owner (Anmol) is non-technical in software terms. He never runs code locally. The contract every session follows:

- Claude runs ALL tests and builds inside the session. The owner verifies through the browser on the deployed site using a checklist file delivered with the build.
- Delivery is a zipped codebase with real folder paths. The owner updates GitHub by dragging the extracted contents onto the repo upload page. Vercel auto-deploys on push.
- Any file that must be DELETED is listed explicitly, because drag-and-drop cannot delete; the owner removes those in the GitHub UI by hand.
- Audit-first: Claude stress-tests every owner proposal before building it, leads with the weakest part and stops for structural or permissions blockers before writing code. Pushback goes on the record; it is never silently overridden. When the owner overrules a recommendation, both the recommendation and the overrule are documented.
- Sessions target roughly 15 messages, then close with a regenerated HANDOVER-NEXT.md containing a paste-ready opener for the next session.
- Owner often speaks via voice transcription; interpret intent, do not nitpick transcription artifacts.

Style rules for ALL output: no em dashes, no ", and" (no Oxford comma), no filler praise, confidence tags [Certain] / [Likely] / [Guessing] on factual claims, prose preferred over bullet spam in explanations.

## 3. Stack and architecture

- React 18 + Vite, plain JSX. No TypeScript, no router library, no state library. Hash routing via a custom hook. [Certain]
- Persistence: browser localStorage under key `tellylog:v1`, single-user, no accounts. Backup and restore via JSON export/import is the data safety model.
- Hosting: Vercel Hobby tier, auto-deploy from GitHub main. Cloudflare Pages was evaluated and rejected on ease-of-use grounds at identical cost.
- Metadata: TMDB API v3. Runs in one of two modes decided once per page load: `proxy` (through /api/tmdb, server key, no key in the browser) when /api/health reports tmdbProxy, else `direct` (visitor's own key, the pre-Phase-2 path). The fallback is a deliberate resilience guarantee: a fork, a local run or an env-var accident degrades gracefully instead of bricking.
- AI: Anthropic API, Claude Haiku hardcoded (`claude-haiku-4-5-20251001` default, env override possible). One serverless function /api/ask serves both the Explore ask box (JSON answer + picks) and, since v2.4.0, the Profile taste summary (mode:'taste'). Key lives only in the Vercel env var; /api/health exposes booleans only.
- Serverless functions: /api/health (capability probe), /api/tmdb (flat ?p= proxy with a path allowlist), /api/ask.
- Rate limiting on /api/ask: 10 per 10 minutes per IP. Durable via an Upstash Redis REST store when its env vars exist, in-memory fallback otherwise (v2.4.0).
- Tests: node scripts for util and store logic plus vitest/jsdom for components. Run: `npm test`. Production build must be clean before delivery.

## 4. Data schema (localStorage `tellylog:v1`)

Root: `{ version:1, settings, shows, movies, log }`.

- settings: `{ apiKey, profileName, theme ('dark'|'light'), gridSeen }`
- shows[id]: `{ id, name, poster, backdrop, status, network, avgRuntime, seasons {n: epCount}, nextEp|null, lastEp|null, watched {s:[e,...]}, lastWatchedAt, added, archived, keptAt?, detailsFetchedAt, genreList? }`
- movies[id]: `{ id, title, poster, runtime, genres (legacy top-2 display string), genreList? (full array, v2.4.0), releaseDate, watchlist, watchedAt|null, added }`
- log: `[{ showId, s, e, ts }]` one entry per watched episode, ts is logging time (imports carry the export's real dates)

Schema law: additive fields only, never rename or repurpose, restore of OLD backups must always work. Additive fields to date: show.keptAt, settings.theme, settings.gridSeen (Phase 1), show.genreList and movie.genreList (Phase 2b, backfilled once from TMDB on the Profile page when missing). The taste summary cache lives in a SEPARATE key `tellylog:taste:v1` because it is derived data and does not belong in backups.

## 5. Build history, decisions and reversals

**Strategy session (pre-build).** Direction locked: React port, public repo, live demo, README that reads like a strategist wrote it. ONE AI feature chosen: the natural-language ask box, activated only once real watch history exists (the owner's own principle: an LLM feature without real data is demo theatre). Embeddings-based "because you watched" rail scoped out on infrastructure cost. Supabase scoped out (no functional justification for a single-user localStorage app). Whisper voice scoped out on cost; later satisfied free via the browser Web Speech API. Recommendations restricted to the Explore tab by spec.

**Phase 0: React port with parity.** All original logic tests pass unmodified; the suite is the parity proof. Deviations accepted and documented in PORT-NOTES.md. Deployed and verified.

**Phase 1: journey polish.** Tonight-first home (hero card, one-tap mark watched), search-led first run, skippable popular-titles onboarding grid, stale bucket reframed from guilt pile to Keep/Drop, near-finish nudge banner, dark+light themes. Three additive schema fields. Post-verification CSS-only hotfix for the import dropzone.

**Phase 1.5: detail depth.** Show modal enrichment (about, cast, GB providers with JustWatch credit, trailers, more-like-this rail permitted on the modal after an owner ruling), episode stills and overviews, skeletons and image fade-in. Cut with reasons: comments, reactions, surveys, star ratings (deferred), specials tracking.

**Phase 1.6: verification-driven polish (v2.2.0).** Eleven owner notes triaged and built: TitleModal preview-before-add, clickable titles, season quick-tick, zero-episode season fix, home ARCHIVED section, profile Posters/List toggle, import relabel, ask-box error surfacing plus first (in-memory) rate limit. Auth explicitly rejected as out of scope.

**Brand reversal, same day: Logline reverted to TellyLog.** Rename decision reversed to match the tellylog domain. Earlier the Kino rename was rejected after discovering a live same-category competitor with an AI feature under that exact name (kino-tv.co). Both reversals are portfolio material, on the record in SESSION-LOG files.

**Phase 2: AI scaffold, then the flip (v2.3.0).** Scaffold shipped dormant behind /api/health gating. A mid-session incident: the owner pasted an env var containing the whole curl example rather than the bare key; the crash echoed the key into the UI. Fix: key-format validation plus key-shaped-string redaction in error paths, key rotated. Prompt caching evaluated and rejected (system prompt below cacheable minimums). v2.3.0 flipped tmdb.js to the proxy with the direct fallback, added the Web Speech mic (owner pulled it forward; auto-submit from voice rejected for cost control) and made provider icons open the title's JustWatch watch page (per-provider deep links rejected: TMDB carries exactly one link per title and region; hardcoding provider URL schemes would rot silently and dodge the attribution the data licence rides on).

**v2.3.1 hotfix.** v2.3.0's bracket-named catch-all function (api/tmdb/[...path].js) did not route on the deployment; replaced with a flat api/tmdb.js (?p=), the same routing mechanism as /api/health. The client now verifies the proxy with one real call per page load and falls back to the direct path, so a broken proxy can never blank the app for a keyed user. The old catch-all file was deleted from the repo by the owner. Diagnostic verified clean by the owner on 7 July 2026.

**Phase 2b (v2.4.0, current).** Profile insights: minute-weighted genre bars, primary-genre donut, monthly activity line, all hand-rolled SVG (no chart library, by spec). show.genreList and movie.genreList added (additive), one-time TMDB backfill on the Profile page replacing the earlier lazy-backfill recommendation after an owner ruling: lazy fill would leave charts incomplete until every modal had been opened. Weighting rulings: minutes not title counts (a 200-episode sitcom must outweigh a 6-episode miniseries), bars credit every genre a title carries (overlapping, never summed), the donut uses primary genre only so slices honestly sum to 100%, unattributed minutes are disclosed as a coverage percentage. AI taste summary on Profile through the same /api/ask function (mode:'taste'), cached outside the schema, refreshed only when the library changes or on demand. Ask picks raised from 2-4 to 5-7 on the owner's nonnegotiable instruction; the recorded tradeoff is filler risk on thin libraries. Durable KV rate limiter with graceful in-memory fallback; durability activates only once the owner provisions the Upstash store in Vercel. Attribution added (footer credit, console colophon, author meta tag) with the explicit understanding that these are storytelling, not proof: authorship evidence is the commit history, this decision record and the ability to change the live site on demand.

## 6. Rejected directions, one list (the README's raw material)

Supabase/auth/accounts, embeddings recommender rail, Whisper voice, native iOS build (PWA is the path), Kino rename, per-provider deep links, voice auto-submit, prompt caching, lazy genre backfill, watermark-as-proof. Each has documented reasoning in the SESSION-LOG files.

## 7. Current state and the gates

- Live: tellylog-3d2u.vercel.app, v2.4.0, proxy mode verified, ask box live, ~96 tests green at last build. Exact current state: see HANDOVER-NEXT.md, which supersedes this section whenever they disagree.
- GATE for the LinkedIn post and public launch: the real TV Time export (~11,413 episodes) imported and verified. Overdue across five-plus sessions. Both AI surfaces are demo theatre without it, by the owner's own success criterion.
- Owner-side pending: provision the Upstash/KV store for the durable rate limit; confirm Anthropic credit stays topped up.

## 8. What remains

Phase 3, the final build phase: README and decision log as the PRIMARY portfolio deliverable (SESSION-LOG*.md and PHASE1-NOTES.md are the raw material), a colophon page telling the build story, PWA manifest plus service worker for installability. After Phase 3: export verification if still outstanding, then the LinkedIn post.

## 9. How to run a session (for a fresh Claude)

Open with the paste-ready prompt from HANDOVER-NEXT.md. Audit the brief before building. Build, run every test, keep ImportWizard logic untouched unless the brief says otherwise, keep schema changes additive with a restore test. Deliver: zip for drag-and-drop, explicit deleted-files list, browser checklist, session log in the established style, regenerated HANDOVER-NEXT.md with the next paste-ready prompt. Remind the owner to close around message 15.
