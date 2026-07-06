# Session log: Phase 1.6 polish, brand revert, ask-box debugging

Date: 6 July 2026, follow-on from the Phase 1.5 + scaffold session. Feeds the Phase 3 decision log.

## The brief

Eleven items of feedback from the owner's browser verification of Phase 1.5, plus a live bug: the ask box appeared after the ANTHROPIC_API_KEY env var was added (proving the health gating works) but every ask returned "The ask service had a problem. Try again."

## Diagnosis of the ask failure

The generic message came from the client (ai.js) throwing a fixed string on any non-ok response, and from /api/ask discarding the Anthropic error body and returning only "upstream <status>". The actual upstream cause was therefore invisible. The most probable cause given the setup steps described (key created, env var added, redeployed, but no mention of buying credit): the Anthropic console requires prepaid credit before keys work, and a creditless account returns a 400 the old code hid. [Likely] The fix in this build is diagnostic: /api/ask now reads the upstream error body and returns an owner-actionable message (no credit, bad key, bad model, rate limit, overloaded) and the client displays it verbatim. The next failed ask will name its own cause. [Certain about the surfacing, Likely about credit being the culprit]

## Decisions this session

1. **Brand reverted to TellyLog** on the owner's instruction, to match the tellylog-3d2u.vercel.app domain. Noted for the record: the premise "the URL cannot be changed" is wrong; Vercel projects can be renamed (Settings → General), documented last session with the per-domain localStorage warning. Reverting was still the lower-risk call: zero data implications, no broken links and it restores the original UK-distinctive name choice. Storage key was never renamed, so nothing migrates. Logline-era backups restore unchanged. [Certain]
2. **Preview-before-add.** Card titles, film rows and the more-like-this rail now open a TitleModal that shows full TMDB detail (hero, genres, synopsis, read-only season list, cast, GB providers, trailers, recommendations) without tracking anything. Tracking is an explicit button. This also reverses last session's compromise where tapping a more-like-this poster silently tracked the show; the honest-labelling fineprint now reads "Nothing is added until you say so", which is the better product behaviour and a better README line.
3. **Films finally have a detail view.** The same TitleModal serves movies via four new TMDB client endpoints (movie credits, providers, videos, recommendations). Tracked films get their watched toggle and remove action inside it.
4. **Clickable-title affordance** per the owner's spec: underline (accent-tinted), a › chevron and a soft accent glow, applied through one .title-link class.
5. **Season quick-tick.** Every aired season header carries a small check button that marks or unmarks the whole season without expanding it. Markup restructured so the tick is a sibling of the expand button, not a nested button (invalid HTML). [Certain]
6. **Zero-episode seasons fixed** (The Pit season 3). A season with episode_count 0 now renders "Not aired yet", no tick, no 0 / 0 count and no Mark/Unmark button; expanding shows an explanatory notice. Store logic needed no change: markSeason over 0 episodes was already a no-op and nextEpisodeFor already skipped empty seasons, both now pinned by tests. The bug was purely display: 0 === 0 made the season read as "complete". [Certain]
7. **Archive visibility.** New Store.archivedShows() selector (tested). Home gains a collapsed ARCHIVED (n) section at the bottom with unarchive and tap-through. Profile SHOWS gains a Posters/List toggle; list rows show progress and an ARCHIVED chip. The "Films watched" stat tile taps through to Films → Watched.
8. **Import button relabelled** "Import watch history" with a fineprint naming TV Time, Netflix, Letterboxd and IMDb. Note: Prime Video was mentioned in the brief but is not a supported source; no Prime importer exists. [Certain]
9. **Basic rate limit added to /api/ask**: 10 asks per IP per 10 minutes, in-memory. Best-effort only (resets per cold start, per instance); a durable KV-backed limit stays on the Phase 2 list. Added now because the owner's key is live on a public URL, which converted last session's "known gap" into an active exposure. [Certain]

## Rejected or deferred, with reasons

- **"Login" via TMDB key: rejected as a framing.** The key is not a login and the data is not tied to it. Data lives in browser localStorage under tellylog:v1, per browser per domain; the key only authorises metadata calls. Real accounts mean auth plus a hosted database, which is the Supabase scope-out this project deliberately documents. The Phase 2 proxy flip removes key entry for visitors entirely, which is the actual UX fix. Decision: no auth, keep the scope-out. [Certain on the mechanics]
- **Stats charts + AI taste summary: deferred to a dedicated session (Phase 2b), accepted in principle.** Blocker is data, not UI: show genres are not persisted (only films store two genre names). Charting genres across the library needs either N TMDB fetches per stats view or one small additive schema field (show.genres, backfilled lazily on modal opens and adds, same additive pattern as keptAt). Recommendation on record: the additive field. Charts in hand-rolled SVG, no chart library (bundle cost). The AI summary reuses librarySummary plus the existing serverless pattern, making it the natural second AI surface for the portfolio story.
- **Voice input: deferred.** Use the free browser-native Web Speech API (Chrome, Edge and Safari; not Firefox), not a paid transcription API. Zero marginal cost, one mic button. Slotted with Phase 2b. [Certain on API support shape]
- **TMDB proxy flip: blocked on owner action.** TMDB_API_KEY env var is not set yet, so flipping tmdb.js now would 503 every metadata call. Unchanged this session per the stop-for-permissions rule.
- **iOS app: feasibility answered in chat, no build.** Recommendation: PWA in Phase 3 polish, native wrapper only if ever justified.

## Tests and build

- Suites 72 → 74: store 25 → 27 (archivedShows ordering; zero-episode season no-op and skip). Util 40 and smoke 7 unchanged, all green.
- Production build clean: 213.7 kB JS (66.4 kB gzip), 23.8 kB CSS. Increase over 204 kB is the TitleModal. [Certain]
- ImportWizard logic untouched again; three display strings changed for the brand revert.
- tellylog:v1 schema untouched, zero new persisted fields.

## Deleted files

None.

## Open after this session

1. Owner: check Anthropic console → Billing → credit balance, then retry the ask box; the error text will now name the real cause if it still fails
2. Owner: add TMDB_API_KEY in Vercel and redeploy, which unblocks the Phase 2 proxy flip next session
3. Real TV Time export verification, still the stated success criterion, still outstanding
4. Phase 2b scope (stats charts, AI taste summary, voice input) awaiting a go decision and the genre-persistence choice
