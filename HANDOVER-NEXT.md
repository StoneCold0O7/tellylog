# TellyLog handover: after v2.8.1. Live app complete and maintained. One build item open (the stats redesign), one owner decision open (commercial).

Date: 26 July 2026. Supersedes every earlier handover. Pair with CONTEXT.md. Development runs in Claude Code; CLAUDE.md at the repo root carries the standing rules, and the repo deploys by `git push` to main with Vercel building automatically. A red Vercel build is a stop signal.

## 1. State of play

Live at tellylog-3d2u.vercel.app. Version **2.8.1**. Full suite green: **119 node, 33 vitest**. Schema UNCHANGED since v2.7.2. ImportWizard untouched. Vercel Web Analytics is enabled and collecting.

Three versions shipped on 26 July, each verified in a real browser before its push:

- **v2.7.9** fixed the unaired-episode bug (a series premiering in 20 days was sitting in UP NEXT and served as TONIGHT), routed already-tracked shows straight to the tracker from Explore, gave films an "Already watched" action, and made the monthly chart tappable by column instead of by a 12px dot.
- **v2.8.0** added swipe-to-tick on episode rows and the pull gesture, with `overscroll-behavior` holding off Android's pull-to-refresh.
- **v2.8.1** corrected v2.8.0's misreading (the history now physically lives at the TOP behind a handle and the pull reveals it in place, rather than scrolling to the bottom), gave the Tonight card the same swipe, and made the inert Explore green tick remove a title, with a confirmation guard for anything carrying watch history.

## 2. Open items

**Build, not started.** The stats redesign. The owner chose a **Spotify Wrapped energy** direction: bold colour, big numbers, punchy headline stats worth screenshotting. His words on the current screen were that it looks "childish", "very basic" and "badly made". The interaction half of that complaint (the fiddly month-chart tapping) was already fixed in v2.7.9; what remains is purely the visual and structural redesign of the stats modal, and it is the largest-scope item left. Files: `StatsModal.jsx`, `Charts.jsx`, the chart CSS in `styles.css`. Constraint that still holds: hand-rolled SVG, no chart library.

**Owner action, blocks the commercial track.** Phase 0 of COMMERCIAL-ROADMAP.md: get a written answer from TMDB about commercial licensing terms. Everything else in the commercial plan is downstream of it, and building authentication for a product that cannot legally be monetised would be the most expensive available mistake. Nothing should be built on the commercial track until this returns.

**Owner action, verification.** CHECKLIST-V2_8_1.md, walked on a phone. Most of it is touch behaviour a desktop cannot exercise. If the swipe or pull feel wrong, the two thresholds (72px commit, 60px pull) are one-line changes; report the feel rather than working around it.

**Optional, never blocking.** A `ClearButton` render test in the `mic.test.jsx` mould (offered several sessions ago, still not built). Tuning the AI refresh-gate thresholds if real usage argues for it. The DEFERRED streaming-import track, gated on obtaining one real DSAR/export file per service and testing it against the wizard before any code.

## 3. What the next session should do

If the checklist passed: build the stats redesign, and nothing else in the same round, because it is a visual change that will want iteration. If the checklist failed anywhere: fix that first, since a threshold change is cheaper before more is built on top.

Do not start commercial engineering until the TMDB answer is in hand.

## 4. Paste this prompt into the next chat

```
TellyLog: the stats redesign session. The clone is at C:\Users\LEGION\tellylog (NOT the Claude Code default working dir, which is empty). Read CLAUDE.md, CONTEXT.md and HANDOVER-NEXT.md from the repo root first; they are the source of truth.

State of play: v2.8.1 live at tellylog-3d2u.vercel.app, full suite green (119 node, 33 vitest), Vercel build [GREEN/FAILED], CHECKLIST-V2_8_1.md result: [ALL PASSED / list failures].

This session's job: redesign the stats screen. It currently looks basic and badly structured to me. I want SPOTIFY WRAPPED energy: bold colour, big numbers, punchy headline stats I would actually screenshot and share. Keep the hand-rolled SVG rule, no chart libraries. The monthly chart's tap target was already fixed, so this is about how it looks and how it is structured, not that.

Audit first: stress-test the direction before building, show me the plan, and tell me before you push because it goes live. One concern per change. Do not touch ImportWizard or the schema. I am non-technical and never run code locally, so run the tests and build yourself and verify on the deployed site.

Remind me to close around 15 messages.
```

## 5. Standing facts

Deploy: `git push` to main. Tests: `npm test`. Build: `npm run build`. Storage key `tellylog:v1`, schema additive-only, restore of old backups must always work.

**Gestures (v2.8.0/v2.8.1).** `SwipeRow` in `shared.jsx` wraps episode rows and the Tonight card: right completes, left undoes, wrong direction resists. `touch-action: pan-y` is load-bearing (browser keeps vertical panning, app gets horizontal, so no `preventDefault`; React registers touchmove passive at the root where preventDefault is a no-op). Both the swipe and the pull read travel from a **ref**, not state, because React batches rapid touchmoves and a state-only read can see 0 on a fast flick. Commit distances: swipe 72px, pull 60px. A committed swipe lifts and fades 150ms before the toggle fires.

**History placement.** Watched history lives at the TOP of the Shows tab behind `.histtop__handle`, collapsed by default so Tonight-first survives. Pull reveals it in place. The handle is a real button; the gesture is never the only route.

**Queue rules.** `nextEpisodeReady()` in `store.js` keeps unaired episodes out of UP NEXT and out of `nudgePick`: an episode qualifies once aired, or within `UPCOMING_DAYS` (7). Unparseable air dates fail OPEN. Cause of the original bug: TMDB per-season `episode_count` counts unaired episodes.

**Explore.** Tracked shows open the tracker directly; untracked keep the Phase 1.6 preview (peeking must never silently add). The green tick removes, with a confirmation when watch history would be lost.

Everything else (AI cost gate 5 days + 6 units, owned-title filtering via `Store.ownsTitle()`, rails cache `v:4`, librarySummary 120/50, PWA, colophon at `#/colophon`, editable profile) is unchanged and documented in CONTEXT.md.

**Commercial.** COMMERCIAL.md reads the project as it is (zero revenue, capital efficiency, honest unit economics). COMMERCIAL-ROADMAP.md covers what going commercial would take, with TMDB licensing as phase 0 and identity/sync costed as phase 1. Neither commits to anything.

**Archived.** The LinkedIn post shipped on 13 July 2026 and its voice brief lives in the v2.7.7-era handover in git history plus the SESSION-LOG files. Nothing outstanding there.
