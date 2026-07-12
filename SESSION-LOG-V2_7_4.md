# SESSION LOG v2.7.4, the thin-rails round (12 July 2026)

Same continuing session as v2.7.2 and v2.7.3. Four owner items: one build, one diagnosis, one research question, one tooling switch. The owner referenced an uploaded stats screenshot that never arrived in the container; the chart diagnosis below is from code audit and stands to be checked against the image.

## 1. Rails and ask picks thinned out (bug, fixed)

Consequence of v2.7.3 at the owner's library scale (300 series): the server asked the model for 5 picks per rail and hard-capped at 5, then the deterministic owned-filter plus unresolvable-pick drops left rails of 1-2 cards. Fix: over-generate and filter down. The rails prompt now asks for 9 picks per rail (cap 9 server-side); the ask prompt asks for 8-10 (cap 10). The client filters owned titles as before, then displays at most 5 per rail and 7 ask cards. The cache keeps the full filtered set, up to 9 per rail, so titles the owner adds later are stripped on serve and the display backfills from spares instead of thinning. Honest limit on the record: a MINIMUM cannot be hard-guaranteed (the model could return 9 owned picks in one rail); over-generation makes 4-5 survivors the overwhelmingly likely case and the failure mode degrades gracefully. Cost note: more output tokens per rails call, unchanged call FREQUENCY; the budget guardrail is the refresh gate and it is untouched.

## 2. Drama vs Comedy chart discrepancy (diagnosed: not a bug)

Owner report: donut shows Drama and Comedy at 25% each while Drama's hours bar is far longer. Code audit: the bars use genreMinutes(false), full crediting, a comedy-drama's minutes count toward BOTH genres; the donut uses genreMinutes(true), primary genre only, each title counted once under its first TMDB genre so slices sum honestly to 100%. TMDB attaches Drama as a secondary genre to a large share of titles, so Drama's bar inflates relative to its primary-only share. Both computations are node-tested and internally consistent; the distinction is already disclosed in each chart's fineprint. No code change. If the owner's screenshot contradicts the fineprint definitions, that reopens as a bug.

## 3. Streaming-service import research (research only, no build)

Owner idea: add Prime Video, Apple TV, HBO Max style imports now that TV Time dies on 15 July. Findings recorded in the session; short version: Netflix remains the only major streamer with a first-class self-serve viewing-history CSV (already supported). Prime Video has no export button; history arrives via Amazon's Request My Data flow (privacy DSAR, takes days) or community browser scripts. Apple TV app has no user-facing history export; a privacy.apple.com data request is the only route and history coverage is partial. HBO Max and Disney+ expose history on screen only; no export, DSAR only. Decision: no wizard work now. The generic CSV path plus guessColumns may already accept some DSAR files; the right next step is to obtain one real file per service and test against the existing wizard BEFORE writing any code, in Claude Code. Deferred to the backlog with that gate.

## 4. Working-mode switch to Claude Code

The owner moves development to Claude Code on desktop from here. CLAUDE.md added at the repo root: standing rules (audit-first, ImportWizard do-not-touch, session-close regeneration), commands and a one-breath architecture summary; Claude Code reads it automatically, replacing the web app's attach-two-files ritual. CONTEXT.md and HANDOVER-NEXT.md remain the source of truth and the regeneration contract is unchanged. Bonus of the move: vitest and vite build can finally run locally per session instead of riding on Vercel.

## Test state

112 node tests green. vitest and the build ride on the Vercel deploy plus CHECKLIST-V2_7_4.md, for the last time if the Claude Code switch lands.
