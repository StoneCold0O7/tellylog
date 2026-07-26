# TellyLog handover: after v2.8.2. Live app complete and maintained. One build item open (the stats redesign, v2.9.0), one owner decision open (commercial).

Date: 26 July 2026. Supersedes every earlier handover. Pair with CONTEXT.md. Development runs in Claude Code; CLAUDE.md at the repo root carries the standing rules, and the repo deploys by `git push` to main with Vercel building automatically. A red Vercel build is a stop signal.

## 1. State of play

Live at tellylog-3d2u.vercel.app. Version **2.8.2**. Full suite green: **119 node, 33 vitest**. Schema UNCHANGED since v2.7.2. ImportWizard untouched. Vercel Web Analytics is enabled and collecting.

**v2.8.2 just pushed (26 July), verified in a real browser, awaiting the owner's on-phone checklist (CHECKLIST-V2_8_2.md).** The watched-history rework from the owner's voice note: newest episode at the BOTTOM with the panel opening on it (chat-window style), 15 episodes per page with a further pull or an "▲ Older episodes" button loading the next 15 and both pages staying put, an auto-condense when you scroll down past the panel with the scroll position held so nothing jumps (the restore target is computed BEFORE the collapse, because the browser clamps scrollY the instant the page shrinks; this was found and fixed by driving a real browser), the Episodes/By show toggle moved to the bottom of the panel, the pull made responsive (heavy store reads memoised on the store revision so they stop running per touchmove frame, the hint driven by transform/opacity instead of animating height, damping 0.5→0.75), and the committed-swipe lift stretched 150ms→300ms. Full detail in SESSION-LOG-V2_8_2.md.

Earlier on 26 July, each verified in a real browser before its push:

- **v2.7.9** fixed the unaired-episode bug (a series premiering in 20 days was sitting in UP NEXT and served as TONIGHT), routed already-tracked shows straight to the tracker from Explore, gave films an "Already watched" action, and made the monthly chart tappable by column instead of by a 12px dot.
- **v2.8.0** added swipe-to-tick on episode rows and the pull gesture, with `overscroll-behavior` holding off Android's pull-to-refresh.
- **v2.8.1** corrected v2.8.0's misreading (the history now physically lives at the TOP behind a handle and the pull reveals it in place, rather than scrolling to the bottom), gave the Tonight card the same swipe, and made the inert Explore green tick remove a title, with a confirmation guard for anything carrying watch history.

## 2. Open items

**Build, next session as v2.9.0.** The stats redesign. The owner chose a **Spotify Wrapped energy** direction and, this session, confirmed that means Wrapped *language* (big display numbers, saturated colour blocks, one punchy headline stat worth screenshotting) NOT Wrapped *format* (a swipeable one-stat-per-screen deck, which would strand the working drill-downs). His words on the current screen were that it looks "childish", "very basic" and "badly made". The interaction half of that complaint (the fiddly month-chart tapping) was already fixed in v2.7.9; what remains is the visual and structural redesign of the stats modal. Files: `StatsModal.jsx`, `Charts.jsx`, the chart CSS in `styles.css`. Constraint that still holds: hand-rolled SVG, no chart library. Sketched plan on the record (SESSION-LOG-V2_8_2.md): a headline slab at the top of the modal (one huge hero watch-time number with a human line under it, a four-tile colour grid for episodes/shows/films/top-genre, a "your number one" card with the poster/hours/watch-throughs of the most-watched show and film), then the three existing charts restyled into that system with EVERY drill-down and EVERY caveat kept working; one new `topTitles` store selector lifted from the duplicate ranking logic already inside `insightsQA.js`, node-tested. It will want visual iteration, so keep it to its own round.

**Owner action, blocks the commercial track.** Phase 0 of COMMERCIAL-ROADMAP.md: get a written answer from TMDB about commercial licensing terms. Everything else in the commercial plan is downstream of it, and building authentication for a product that cannot legally be monetised would be the most expensive available mistake. Nothing should be built on the commercial track until this returns.

**Owner action, verification.** CHECKLIST-V2_8_2.md, walked on a phone; it covers the history rework just pushed. (CHECKLIST-V2_8_1.md is the previous round; if any of it went unwalked, it still stands.) Most of it is touch behaviour a desktop cannot exercise. If the swipe or pull feel wrong, the thresholds (swipe 72px commit, pull 60px, page 15, fade 300ms) are one-line changes; report the feel rather than working around it. The 300ms fade is the one to watch: it is near the ceiling before a delayed tick reads as lag.

**Optional, never blocking.** A `ClearButton` render test in the `mic.test.jsx` mould (offered several sessions ago, still not built). Tuning the AI refresh-gate thresholds if real usage argues for it. The DEFERRED streaming-import track, gated on obtaining one real DSAR/export file per service and testing it against the wizard before any code.

## 3. What the next session should do

Build the stats redesign as v2.9.0, and nothing else in the same round, because it is a visual change that will want iteration. If CHECKLIST-V2_8_2.md failed anywhere, fix that first, since a threshold change is cheaper before more is built on top. The Wrapped direction is already agreed as language-not-deck (see section 2 and SESSION-LOG-V2_8_2.md), so the next session can audit the concrete plan rather than re-litigate the direction.

Do not start commercial engineering until the TMDB answer is in hand.

## 4. Paste this prompt into the next chat

```
TellyLog: the stats redesign session (v2.9.0). The clone is at C:\Users\LEGION\tellylog (NOT the Claude Code default working dir, which is empty). Read CLAUDE.md, CONTEXT.md and HANDOVER-NEXT.md from the repo root first; they are the source of truth.

State of play: v2.8.2 live at tellylog-3d2u.vercel.app, full suite green (119 node, 33 vitest), Vercel build [GREEN/FAILED], CHECKLIST-V2_8_2.md result: [ALL PASSED / list failures].

This session's job: redesign the stats screen. I want SPOTIFY WRAPPED energy: bold colour, big numbers, punchy headline stats I would actually screenshot and share. We already agreed this means Wrapped LANGUAGE (big numbers, bold colour, one punchy stat per block), NOT a swipeable one-stat-per-screen deck, and the drill-downs and every caveat stay working. Keep the hand-rolled SVG rule, no chart libraries. The monthly chart's tap target was already fixed, so this is about how it looks and how it is structured, not that.

Audit first: stress-test the concrete plan before building, show me the plan, and tell me before you push because it goes live. One concern per change. Do not touch ImportWizard or the schema. I am non-technical and never run code locally, so run the tests and build yourself and verify on the deployed site.

Remind me to close around 15 messages.
```

## 5. Standing facts

Deploy: `git push` to main. Tests: `npm test`. Build: `npm run build`. Storage key `tellylog:v1`, schema additive-only, restore of old backups must always work.

**Gestures (v2.8.0/v2.8.1/v2.8.2).** `SwipeRow` in `shared.jsx` wraps episode rows and the Tonight card: right completes, left undoes, wrong direction resists. `touch-action: pan-y` is load-bearing (browser keeps vertical panning, app gets horizontal, so no `preventDefault`; React registers touchmove passive at the root where preventDefault is a no-op). Both the swipe and the pull read travel from a **ref**, not state, because React batches rapid touchmoves and a state-only read can see 0 on a fast flick. Commit distances: swipe 72px, pull 60px (damping 0.75). A committed swipe lifts and fades **300ms** (v2.8.2, was 150ms) before the toggle fires; the CSS `swipe-fly` duration in `styles.css` and `SWIPE_FLY_MS` in `shared.jsx` MUST stay equal or the row snaps back for a frame. The v2.8.2 pull writes transform/opacity straight to the DOM during the gesture (composited, no per-frame React render), and `ShowsTab` memoises `history()`/`watchNextList()`/`showProgressList()` on `Store.getRev()` so those heavy reads stop running sixty times a second while a thumb moves.

**History placement and paging (v2.8.2).** Watched history lives at the TOP of the Shows tab behind `.histtop__handle`, collapsed by default so Tonight-first survives; the pull (or the handle) reveals it in place and lands on the NEWEST episode at the bottom of the panel, chat-window style. Episodes view is reversed (newest at the bottom) and paged 15 at a time; a further pull at the top, or the "▲ Older episodes" button, prepends the next 15 with both pages kept mounted. "By show" is a chronology-free aggregate and stays whole, unpaged. Scrolling down past the panel auto-condenses it after scrolling goes idle; the scroll-restore target is computed BEFORE the collapse (the browser clamps scrollY the instant the page shrinks, so computing it after overshoots and jumps to the top), and `.histtop__panel` carries `overflow-anchor:none` plus `padding-bottom` (not margin, `offsetHeight` excludes it) so the arithmetic holds. The Episodes/By show toggle sits at the BOTTOM of the panel. The handle is a real button; the gesture is never the only route.

**Queue rules.** `nextEpisodeReady()` in `store.js` keeps unaired episodes out of UP NEXT and out of `nudgePick`: an episode qualifies once aired, or within `UPCOMING_DAYS` (7). Unparseable air dates fail OPEN. Cause of the original bug: TMDB per-season `episode_count` counts unaired episodes.

**Explore.** Tracked shows open the tracker directly; untracked keep the Phase 1.6 preview (peeking must never silently add). The green tick removes, with a confirmation when watch history would be lost.

Everything else (AI cost gate 5 days + 6 units, owned-title filtering via `Store.ownsTitle()`, rails cache `v:4`, librarySummary 120/50, PWA, colophon at `#/colophon`, editable profile) is unchanged and documented in CONTEXT.md.

**Commercial.** COMMERCIAL.md reads the project as it is (zero revenue, capital efficiency, honest unit economics). COMMERCIAL-ROADMAP.md covers what going commercial would take, with TMDB licensing as phase 0 and identity/sync costed as phase 1. Neither commits to anything.

**Archived.** The LinkedIn post shipped on 13 July 2026 and its voice brief lives in the v2.7.7-era handover in git history plus the SESSION-LOG files. Nothing outstanding there.
