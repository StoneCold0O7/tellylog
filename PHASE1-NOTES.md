# TellyLog Phase 1 Notes: Tonight-first redesign

Delivered 6 July 2026. Feeds the Phase 3 decision log. Style rules: no em dashes, no ", and", confidence tags on factual claims.

## What shipped

1. **Tonight card (signature element).** The home tab leads with the single most-likely next episode: backdrop hero, mono episode code, episode name, one oversized Mark watched button plus a remaining-count chip. Marking advances the card in place. This is the two-second logging action and the "what do I watch tonight" answer in one component.
2. **Fast first run.** With a key saved and nothing tracked, the home tab is a search-led "What are you watching?" screen. Import demotes to a secondary ghost button. The genuine sub-30-second stranger first run remains blocked by the TMDB key gate until the Phase 2 proxy removes it; Phase 1 delivers the fastest possible flow given a key. [Certain]
3. **Onboarding grid.** Skippable modal of TMDB popular TV (18) then popular films (12), tap to track. Auto-offers exactly once, immediately after the very first show is added via a manual add button (FirstRun or Explore). Cannot fire during imports because add buttons live outside modals, cannot fire over existing data because the trigger requires the zero-to-one show transition. Reachable any time from Profile, Browse popular titles. [Certain]
4. **Stale reframe.** "HAVEN'T WATCHED FOR A WHILE" became "STILL WATCHING?" cards with Keep and Drop. Drop is one tap onto the existing archive flag: reversible, stats preserved. Keep stamps a new `keptAt` field that resets the 30-day staleness clock and bumps the show up the queue.
5. **Home nudge.** Banner above the Tonight card when a started, unarchived show other than the Tonight pick has 3 or fewer episodes left. Tapping opens the show; dismissal lasts the page session. Driven entirely by the user's own progress. No engagement mechanics.
6. **UI redesign, dark plus light.** Token-driven themes on `<html data-theme>`, toggle in Profile, dark default so existing users see no surprise flip. Media surfaces (backdrop heroes, Tonight card) stay cinematic dark in both themes; only UI chrome flips. Emoji tab icons replaced with stroke SVG icons. Episode codes and section labels render in the mono face as broadcast-style metadata. Motion limited to a press-scale on the log button and the toast fade; prefers-reduced-motion disables all transitions. [Certain]

## Schema changes (all additive, tellylog:v1 unchanged)

- `show.keptAt` (timestamp, absent on legacy records)
- `settings.theme` ('dark' | 'light', absent means dark)
- `settings.gridSeen` (bool, absent means false)

`restoreJSON` validates only version and shows, so legacy backups restore cleanly and new backups restore on old builds. Covered by a dedicated legacy-restore test. The import wizard component was not edited. [Certain]

## Deviations and judgment calls

1. Theme options are Dark and Light only, no system-follow. A third auto state adds test surface for marginal value on a portfolio demo; default dark preserves existing behaviour. [Likely the right trade]
2. ResultCard was extracted from ExploreTab into its own file for reuse by FirstRun and the grid. Rendering unchanged.
3. The episode-name cache moved from ShowsTab into shared.jsx as a hook so the Tonight card and queue rows share one cache.
4. The nudge intentionally skips never-started shows: "2 episodes from finishing" is only honest for shows with watch history.

## Test state

60 automated checks: 32 util (unchanged), 21 store (13 original plus 8 new covering keep/drop, nudge, theme, grid flag, legacy restore), 7 jsdom smoke (rewritten for the new UI). Production build clean. [Certain]

## Files added (none deleted)

src/components/Icons.jsx, ResultCard.jsx, TonightCard.jsx, FirstRun.jsx, OnboardingGrid.jsx, PHASE1-NOTES.md, CHECKLIST-PHASE1.md

## Hotfix, same day

Import dropzone rendered inline (label element with no display rule), collapsing onto the source list. Fixed in CSS only: block-level flex label, button-styled trigger, hover state. Wizard JSX untouched.
