# Session log: v2.5.0, interactive stats, TV watchlist, profile identity

Date: 7 July 2026. Feeds the Phase 3 decision log. Version 2.4.0 → 2.5.0.

## The brief

Phase 2b verified clean by the owner (charts, backfill, taste summary, 5-7 picks, attribution). The owner then reordered the remaining roadmap on the record: feature sessions first, README last, because the README should describe a finished product. This session became the first of the reordered pair: (1) charts moved off the Profile into a Stats popup and made interactive, (2) a TV show watchlist, (3) profile and cover images, (4) the taste summary Refresh button removed. Two audit outcomes shaped the brief before any code was written.

## Decisions this session

1. **The TV Time export is dead; the grounding gate survives it.** The owner reported the export is not happening. The audit refused to let the gate die with it: by the owner's own recorded principle, AI surfaces without real watch history are demo theatre, and the next session builds MORE AI surface. Agreed replacement: a manual logging campaign of the owner's genuinely watched top 30-50 shows, roughly an evening's work, sufficient to ground every AI feature. The GDPR data-request route to TV Time was tabled as a parallel option since UK law obliges them to hand over the data even with the in-app export broken. [Likely on the GDPR route, Certain on the rest]
2. **Archive removal rejected; watchlist added instead.** The owner proposed removing archive because shows had no watchlist. The audit split the proposal: the missing watchlist was real, the removal was wrong, because the two are different states. Watchlist means not started; archive means started and shelved, the Keep/Drop journey Phase 1 built. Removing it would strand archived shows in an invisible state and delete a documented UX decision. Owner accepted: watchlist added, archive kept. [Certain]
3. **Watchlist semantics mirror films exactly.** New additive field `show.watchlist`. Saved shows appear only in a collapsible WATCHLIST section on the Shows tab, excluded from Tonight, Up next and the nudge (saved-for-later is not queued). Watching any episode clears the flag automatically, so there is no second tap to "start". librarySummary tags them "on watchlist, not started" so the Session C recommendation rails can distinguish saved from seen. Old backups without the field restore as ordinary tracked shows, pinned by test. [Certain]
4. **Charts moved into a Stats modal, and the backfill moved with them.** Owner ruling: the Profile stays scannable, depth goes behind one button. The audit found a bonus: the one-time genre backfill had been firing on every Profile visit for anyone with pre-2.4 records still missing genres; it now fires only when someone actually opens stats, which is strictly cheaper. The taste summary stays on the Profile because librarySummary carries no genres, so it never needed the backfill. [Certain]
5. **Interactivity is click-first, hover-second, still zero libraries.** Hover effects are cosmetic (desktop only); CLICK is the selection mechanism because the primary device is a phone. Bars, donut slices and legend rows select a genre and reveal the contributing titles with their minutes; month points on the activity line reveal what was logged that month with episode counts. The bar list and the donut list legitimately differ for the same genre (full crediting versus primary-only) and each drill-down captions its own method. The donut's Other slice is not clickable because it is not a real genre. All hand-rolled SVG per standing spec; the interactivity is the argument for having refused a chart library. [Certain]
6. **Refresh button removed from the taste summary, pulled forward from the README session.** Audit correction to the owner's premise: the summary ALREADY auto-refreshed, keyed on a hash of the library, so the button only rerolled an identical library at real API cost. Removing it two sessions early stops accidental spend now. The card now says it updates by itself. Deviation from the agreed session split, on the record here. [Certain]
7. **Profile and cover images ship with compression as a hard requirement, not a nicety.** Additive settings fields `avatar` and `cover` store JPEG data URLs. A raw phone photo as base64 would eat most of the ~5MB localStorage quota and ride inside every backup, so images are canvas-downscaled on the client (avatar 256px, cover 1280x512, quality 0.82) with a hard post-compression cap of ~300KB that rejects with a toast. Old backups without the fields restore clean, pinned by test. [Certain]

## Rejected or deferred, with reasons

- **Removing archive: rejected**, decision 2. Different state from watchlist.
- **Letting the grounding gate lapse with the TV Time export: rejected**, decision 1. Replaced, not retired.
- **Floating SVG tooltips for the line chart: rejected** in favour of click-selected detail rendered below the chart. Tooltips fail on touch, and the phone is the primary device.
- **A chart library for the interactivity: rejected**, standing spec. The drill-downs are ~120 lines of plain SVG event handling.
- **Uncompressed image storage: rejected**, decision 7, quota and backup-size mechanics.
- **Voice-driven Profile insights: deferred** to Session C's decision box. The audit position stands: deterministic queries (top genres, most watched) must be answered locally, not via the LLM; paying per-token for arithmetic is the kind of AI decoration this project exists to argue against.

## Tests and build

- Suites 96 → 109: util 40 unchanged, store 37 → 47 (watchlist default and explicit add, no flagging of started shows, auto-clear on first episode, queue exclusion plus selector, librarySummary tag, pre-2.5 backup restore, genreTitles full versus primary crediting, watched-films-only sorting, monthTitles aggregation with counts, avatar and cover persistence plus old-backup restore), vitest 19 → 22 (new stats.test.jsx: bar click reveals contributing titles, month point click reveals that month's log, watchlist section renders and Start clears the flag). All green. [Certain]
- Production build clean: 234.5 kB JS (72.7 kB gzip), 27.6 kB CSS. Growth over 226.2 kB is the chart interactivity, drill-down lists, watchlist UI and image handling. [Certain]
- tellylog:v1 schema: three additive fields (show.watchlist, settings.avatar, settings.cover), restores of old backups pinned by tests. ImportWizard logic untouched. [Certain]

## Files changed

New: src/components/StatsModal.jsx, tests/stats.test.jsx, CHECKLIST-V2_5_0.md, this file. Modified: src/lib/store.js, src/components/Charts.jsx, src/components/InsightsSection.jsx, src/components/ProfileTab.jsx, src/components/TitleModal.jsx, src/components/ShowsTab.jsx, src/components/App.jsx, src/styles.css, package.json, CONTEXT.md, HANDOVER-NEXT.md (regenerated). Deleted: none.
