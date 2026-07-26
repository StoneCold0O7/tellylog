# TellyLog handover: after v2.9.0. Live app complete and maintained. Stats redesign shipped, awaiting on-phone verification. One owner decision open (commercial).

Date: 26 July 2026. Supersedes every earlier handover. Pair with CONTEXT.md. Development runs in Claude Code; CLAUDE.md at the repo root carries the standing rules, and the repo deploys by `git push` to main with Vercel building automatically. A red Vercel build is a stop signal.

## 1. State of play

Live at tellylog-3d2u.vercel.app. Version **2.9.0**, pushed 26 July. Full suite green: **72 node** (per store suite; run `npm test` for the total across suites) and **33 vitest**. `vite build` clean. Schema UNCHANGED since v2.7.2. ImportWizard untouched. Vercel Web Analytics is enabled and collecting.

**v2.9.0 just pushed, verified in a real browser at phone width in both themes, awaiting the owner's on-phone checklist (CHECKLIST-V2_9_0.md).** The stats redesign: a Spotify-Wrapped-style headline slab on top of the three existing charts. A big hours-watched hero number with a human "≈ N months, N days" sub-line, a four-tile colour grid (episodes, shows watched, films, top genre) with soft palette-tinted backgrounds and theme-safe numbers, and a "your number one" card for the most-watched show (poster, hours, rewatch chip, episode count). The three charts, every drill-down and every caveat are unchanged and were re-verified live. Wrapped *language*, not a deck, as agreed. Full detail in SESSION-LOG-V2_9_0.md.

Two new store selectors carry it, both node-tested: `topTitles()` (show and film ranked by rewatch-weighted minutes; the card uses show only) and `watchedShowCount()` (shows with a ticked episode, so the "shows" tile does not count saved-not-started or archived titles the way `stats().shows` does). `insightsQA.js` was deliberately left alone; its top-film answer ranks by rewatch then rating then recency (a "favourite"), which is a different, intentional basis from the card's minutes ranking.

Design decisions the owner made this round, both on the record: number-one card is **show only** (film is the weak twin at minutes ranking, and it is already a tile); tiles are **soft-tinted** not saturated (boldness from scale and type, contrast verified AA in both themes, the v2.6.0 light-mode trap avoided by construction). The hero keeps "≈" plus a caveat line rather than a visible "about", the owner's call.

## 2. Open items

**Owner action, verification.** CHECKLIST-V2_9_0.md, best walked on a phone since the whole point is a screenshot-worthy screen. Desktop exercises it too. The visual "would I share this" judgment is the owner's on device. This round was kept to its own version precisely because a visual redesign tends to want a tuning pass; if a number, a colour or the copy feels wrong, the knobs (the hero unit, the tile colours, show-only versus show-plus-film) are one-line changes, so report the feel rather than working around it.

**Owner action, blocks the commercial track.** Phase 0 of COMMERCIAL-ROADMAP.md: get a written answer from TMDB about commercial licensing terms. Everything else in the commercial plan is downstream of it, and building authentication for a product that cannot legally be monetised would be the most expensive available mistake. Nothing should be built on the commercial track until this returns.

**Optional, never blocking.** A `ClearButton` render test in the `mic.test.jsx` mould (offered several sessions ago, still not built). Tuning the AI refresh-gate thresholds if real usage argues for it. The DEFERRED streaming-import track, gated on obtaining one real DSAR/export file per service and testing it against the wizard before any code. If the owner ever wants the number-one card to include the film again, it is a small addition (the `topTitles` selector already returns the film).

## 3. What the next session should do

If CHECKLIST-V2_9_0.md failed anywhere, fix that first; a tuning change to the new slab is cheap and isolated. Otherwise there is no pending build. Any future work follows the same audit-first contract. Do not start commercial engineering until the TMDB answer is in hand.

## 4. Paste this prompt into the next chat

```
TellyLog maintenance session. The clone is at C:\Users\LEGION\tellylog (NOT the Claude Code default working dir, which is empty). Read CLAUDE.md, CONTEXT.md and HANDOVER-NEXT.md from the repo root first; they are the source of truth.

State of play: v2.9.0 live at tellylog-3d2u.vercel.app, full suite green, Vercel build [GREEN/FAILED], CHECKLIST-V2_9_0.md result: [ALL PASSED / list what looked wrong].

[Describe what you want. If this is stats-redesign tuning, name the number, colour or copy that felt off and I will treat it as a one-line change first.]

Audit first: stress-test the concrete plan before building, show me the plan, and tell me before you push because it goes live. One concern per change. Do not touch ImportWizard or the schema. I am non-technical and never run code locally, so run the tests and build yourself and verify on the deployed site.

Remind me to close around 15 messages.
```

## 5. Standing facts

Deploy: `git push` to main. Tests: `npm test`. Build: `npm run build`. Storage key `tellylog:v1`, schema additive-only, restore of old backups must always work.

**Stats modal (v2.9.0).** `StatsModal.jsx` renders a headline slab (`.modal__hero--stats` big figure, `.stats-tiles` four-tile grid, `.n1-card` number-one card, a `.fineprint--slab` honesty line) above the three `chart-card` charts. The big figure and the number-one stat colour use `--link` (theme-tuned amber). Tiles set a `--tile` custom property from the chart PALETTE; CSS mixes the tint background and darkens the number in light mode. The heavy store reads are memoised on `Store.getRev()` plus `fillDone` so drill-down clicks do not re-scan the library. Selectors: `topTitles()` and `watchedShowCount()` in `store.js`, node-tested in `store.test.js`. The charts, drill-downs and caveats in `Charts.jsx` are unchanged from v2.7.9.

**Gestures, history, queue, Explore, AI cost gate, owned-title filtering, rails cache, PWA, colophon, editable profile** are all unchanged from v2.8.2 and documented in CONTEXT.md.

**Commercial.** COMMERCIAL.md reads the project as it is; COMMERCIAL-ROADMAP.md covers what going commercial would take, with TMDB licensing as phase 0 and identity/sync as phase 1. Neither commits to anything.

**Archived.** The LinkedIn post shipped on 13 July 2026; nothing outstanding there.
