# Session log: v2.7.0 (Session A / Phase 3, the final build session)

Date: 8 July 2026. Brief: owner-expanded from the standing HANDOVER-NEXT. Two feature changes were added to the planned docs-and-PWA session: an AI cost gate and a redesign of the Explore rails from title anchors to Netflix-style genre rows. Both were built this session per the owner's instruction.

## Audit of the brief, on the record

**Scope addition accepted with one design correction.** The owner asked for genre rows ("you watched drama, one row of similar dramas") with 4-5 picks each. The audit's concern: v2.6.0's title-anchored rails were the proof of the grounding thesis and a naive genre implementation (model picks the genres) would weaken it. Resolution built: anchors remain LOCAL and deterministic (top 4 genres by rewatch-weighted watched minutes, a genre needs at least two contributing titles so one fluke title cannot mint a rail) and the basis line under each rail is now assembled CLIENT-SIDE from the real titles that earned the genre. Net effect: the grounding got stronger, not weaker, because the model now supplies neither the premise nor the evidence, only the picks. The v2.6.0 title-anchor function and its test were removed rather than left as dead code.

**Threshold ruling (delegated to Claude, documented as required).** The owner specified "a combination of days and units" with 5 days as the example and required the exact numbers on the record. Set: refresh only when BOTH at least 5 days since last generation AND at least 6 signal units of change since it. Unit definition: each show started, each film watched, each rating set, each extra watch-through counts one; every ten ticked episodes count one. Rationale for 6: reachable in one honest week of use (six films, or a show plus a binge plus some ratings) but not by idle ticking. First generation is immediate per the owner's spec. Both AI surfaces share one module (refreshGate.js) so the policy cannot fork. Consequence accepted and documented: a huge one-day import right after a generation still waits out the 5 days; the AND logic is the owner's stated intent and the cost ceiling is the point.

**Pushback recorded: the "assume everything works" README instruction.** The owner instructed that the README be written as if this session's features are verified. The audit position: the README is a portfolio artefact making public claims about features that have never been browser-verified, which is exactly the kind of gap this project's honesty story exists to avoid. Owner intent stands and is followed; mitigation on the record is that CHECKLIST-V2_7_0.md gates the deploy and any failed step means editing the README before the LinkedIn post, not after.

**Environment blocker, on the record.** This session's container had no npm registry access, so `npm install` failed and the vitest component suite plus the Vite production build could not run in-session. This breaks the standing contract clause that Claude runs ALL tests and builds inside the session. What DID run green: all three node suites, 105 tests (util 40, store 58, refreshGate 7). The vitest suite (the remaining component tests, including the updated rails contract test) is delivered updated but UNRUN. Compensating controls: Vercel runs the production build on push and fails the deploy on a build error; the browser checklist covers the changed components. The owner should treat a failed Vercel build as a stop signal and paste the build log into the next session.

## Built

1. **refreshGate.js** (new): the shared AI cost gate, pure and node-tested. Decision function returns generate, serve-fresh or serve-stale; pre-2.7.0 caches without a unit count pass the units gate once so old installs converge.
2. **Genre rails**: store.genreRailAnchors() (local, minute-weighted, overlap-credited exactly like the charts, 2-title minimum per genre, dominant-medium kind at 70% else mixed, top-3 example titles), new SYSTEM_RAILS prompt (genre anchors with examples, 5 picks per rail never fewer than 4, medium matched to rail kind, thin-library note preserved), client basis built locally, caches carry the unit count. Old rails caches regenerate once by design (the hash changed shape).
3. **Taste summary gate**: same module, same policy, fineprint now states the policy from a single shared string so copy cannot drift from code.
4. **Colophon**: dedicated page at #/colophon naming the Claude-directed method explicitly per the standing ruling, linked from the Profile fineprint, PLUS the README colophon section (owner ruling: both).
5. **PWA**: manifest, generated icon set (192, 512, 512 maskable, apple-touch 180), minimal offline-shell service worker (navigations network-first with shell fallback, same-origin static assets cache-first, /api/* and cross-origin never touched), registered in production only. Cache-everything worker remains rejected.
6. **README.md**: full strategist-first rewrite, decision record leading, thresholds documented verbatim, colophon section included.
7. Version 2.7.0. Schema untouched. ImportWizard untouched.

## Tests

105 node tests green in-session. Vitest suite updated for the new rails contract but not executed here (see blocker above). Test count claim for the record: "105 node tests green, component suite pending the Vercel build plus browser verification".

## Delivered

Zip for drag-and-drop. Deleted files: NONE. CHECKLIST-V2_7_0.md, this log, updated CONTEXT.md, regenerated HANDOVER-NEXT.md carrying the LinkedIn post brief.
