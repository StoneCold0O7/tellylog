# SESSION LOG v2.7.9 → v2.8.1, the gesture and correctness session (26 July 2026)

One session, three shipped versions, driven by owner verification on real data. Also the session where the commercial question moved from a passing remark to a written roadmap. No schema change anywhere, ImportWizard untouched throughout.

## The shape of the session

The owner arrived with six changes and a commercial question. The audit split them into three groups: clean fixes to build immediately, items needing a decision, and one item (the stats redesign) that was unbounded as stated. Three questions were put to him; he answered all three, overruling the audit on one. Work then shipped in three verified batches rather than one large push, so a gesture failure and a chart failure could never be tangled together.

## v2.7.9, the correctness batch

**The unaired-episode bug, root cause found.** A series premiering in twenty days was sitting in UP NEXT and being served as TONIGHT. Not a display glitch: TMDB's per-season `episode_count` includes episodes that have not aired, so `nextEpisodeFor` returned an episode weeks out and the queue treated it as watchable. New `nextEpisodeReady()`: an episode qualifies only once it has aired, or within `UPCOMING_DAYS` (7). Unparseable air dates fail OPEN, so bad metadata can never empty someone's queue.

The same root cause was found in `nudgePick`, which used raw `remainingCount` and could therefore announce "1 episode from finishing" about an episode airing in three weeks. Fixed in the same change, because it is one concern. Seven node tests, including the already-aired-backlog case (a show mid-season whose *scheduled* episode is far out must still queue its unwatched aired episodes) and the fail-open case.

**Two taps to reach your own tracker.** A show you already track opened the preview, whose only action was "Open in your tracker". Tracked shows now route straight there. The preview is kept for untracked titles, on the record as a disagreement with the broader version of the request: opening the tracker for an untracked show means silently adding it to the library, which is exactly what the Phase 1.6 preview exists to prevent. A saved-but-unstarted show also keeps the preview, because that is where "Start watching" lives.

**Films could only reach the watchlist.** A film already seen now has an "Already watched" action up front, rather than requiring an add-then-toggle.

**The month chart was a dartboard.** The hit target was a 12px circle centred on the dot, so selecting a month meant landing on a few pixels that move with the data. Each month now owns a full-height column: measured 24×24px to 44×114px as rendered, nine times the area, and vertical precision stops mattering. One existing test asserted the old circle and was rewritten to the new element with a guard that the circle target is gone.

## v2.8.0, the gestures

**Swipe to tick.** Right completes, left undoes; the wrong direction meets resistance and snaps back. The load-bearing decision is `touch-action: pan-y` on the moving surface: the browser keeps vertical panning and hands the app horizontal gestures, so there is no `preventDefault` anywhere. That matters because React registers `touchmove` as passive at the root, where `preventDefault` is silently a no-op; solving it in CSS avoids attaching native non-passive listeners purely to fight the framework. Every existing tap target is untouched, so the gesture is additive and never the only way in.

**Pull for history**, plus `overscroll-behavior-y: contain` so Android's own pull-to-refresh cannot swallow the gesture.

**Two bugs the browser caught that jsdom hid.** Both handlers originally read travel distance from React state. React batches rapid touchmoves, so a fast flick could release before a single re-render landed, the release handler would read `0`, and the gesture would silently do nothing. The jsdom tests passed only because `act()` flushes between events. Both now read from a ref. The pull handler was also calling `scrollIntoView` inside a state updater, where a side effect does not belong and can be deferred or double-invoked. Recorded because it is the clearest evidence in this project that component tests do not substitute for driving the real thing.

## v2.8.1, the owner's corrections

The owner verified v2.8.0 on his phone: all five checks passed, with one misreading and two new items.

**The history was in the wrong place.** v2.8.0 read "reach the history" as "scroll down to it". The owner wanted it physically at the top. It now lives at the TOP of the Shows tab behind a handle, and the pull reveals it in place rather than throwing you to the end of the page. It stays collapsed by default, which is what keeps the Tonight-first layout from Phase 1 intact: the default view is unchanged and the history is one gesture away instead of one long scroll away. The handle is a real button, because a gesture must never be the only route to a feature. A committed swipe now lifts and fades for 150ms before the state changes, so an episode reads as travelling up into the history rather than simply vanishing.

**The Tonight card now swipes**, matching the queue rows. The big Mark watched button stays, same principle.

**The Explore green tick was inert**, so undoing a mistap meant opening the title and finding Remove. Tapping it now removes the title. One guard was added that the request did not ask for: for a show carrying ticked episodes this deletes real watch history, and a one-tap irreversible delete sitting exactly where a mistap already happens is data loss waiting to occur. Untouched titles go instantly; anything carrying history asks first and names what would be lost.

## Rulings and reversals on the record

- The audit recommended collapsing Keep/Drop behind a button, matching the watchlist, stats and data surfaces, rather than building a pull gesture, on discoverability and verifiability grounds. **The owner overruled it.** The gesture was built; the mid-pull label and the tappable handle are the mitigations for the discoverability objection.
- The audit declined to open the tracker for *untracked* titles from Explore, defending the Phase 1.6 preview decision. Not contested.
- The audit added a confirmation guard to the Explore tick that was not requested, on data-loss grounds. Recorded as an addition rather than a refusal.
- Four tests across three files asserted superseded behaviour and were rewritten to the new UX rather than worked around, in the pattern established by v2.7.5.

## Test state

119 node tests (112 at session start, plus seven for the unaired rule) and 33 vitest (26 at session start, plus seven for the swipe decision logic). All green. `vite build` clean. Every version was verified in a real browser before its push, and v2.7.9's Explore fixes were additionally verified on the deployed site because they need live TMDB.

## Commercial track

The owner raised commercialisation mid-session. Two documents now exist: COMMERCIAL.md (written earlier, the project as it is: zero revenue, capital efficiency, honest unit economics) and COMMERCIAL-ROADMAP.md (new, what going commercial would take). The roadmap's one structural finding is that **TMDB commercial licensing is phase 0**, ahead of authentication and sync, because the entire metadata layer depends on it and building auth for a product that cannot legally be monetised would be the most expensive available mistake. Phase 1, identity and sync, is costed at under $50 a month of infrastructure until real traction, with six to ten focused sessions of engineering, of which the sync engine is two to three and is where the estimate would slip.
