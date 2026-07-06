# Phase 0 port notes (vanilla JS -> React)

Date: 6 July 2026. Feeds the Phase 3 decision log.

## What moved and how

| Original | React version |
|---|---|
| js/util.js | src/lib/util.js, function bodies byte-identical, IIFE replaced by ES module exports |
| js/store.js | src/lib/store.js, logic identical, plus subscribe/emit so React re-renders on any change |
| js/tmdb.js | src/lib/tmdb.js, identical client, key read via import instead of window.Store |
| js/views.js + js/app.js | src/components/*.jsx, every render-string rewritten as a component |
| js/importer.js | src/components/ImportWizard.jsx, all thresholds, grouping rules and copy unchanged |
| localStorage key | tellylog:v1, unchanged, existing browser data survives |

All 22 data-action handlers from app.js have a React equivalent. Cross-checked against a grep inventory of the original.

## Test evidence

- 32 util tests passing, unmodified assertions
- 13 store tests passing, unmodified assertions
- 3 new jsdom smoke tests: onboarding gate, seeded Shows render, click-to-mark
- Production build succeeds (Vite, 186 kB JS before gzip, 60 kB gzipped)

## Deliberate deviations from the original

1. Scroll-to-top now happens only on tab change. The original scrolled to top on every re-render, including after checking off an episode mid-list.
2. Season accordion state survives re-renders natively instead of being re-clicked open after an innerHTML refresh.
3. The storage-full warning routes through a handler instead of a window.App.toast global.
4. The toast element is always mounted (hidden by default) instead of created on first use. No visible difference.
5. file:// support is gone. The app now requires a build step and a host, per the revamp spec.

## Known carry-overs (unchanged from the original, by design)

- TV time total is approximate (episodes x average runtime)
- Netflix import resolves episode names by similarity; some specials fail and are reported
- No ratings field; Letterboxd/IMDb ratings are dropped on import
- Single user, no sync; cross-device is JSON backup/restore
