# CHECKLIST v2.7.4, the browser verification round

Run on the deployed site after the Vercel build goes green. Phone first. Deleted files: NONE. This round fixes the one-card rails you reported after the import.

## 1. Rails are full again (the headline check)

- [ ] Open Explore. The rails REGENERATE once on this visit (skeletons, then cards): the cache shape version was bumped exactly so the thin post-import cache dies immediately instead of serving one-card rails until the gate reopens. Expect a few seconds.
- [ ] Every rail that renders shows 4 to 5 cards, not 1. Specifically re-check the Drama and Comedy rails from your screenshot.
- [ ] NO card is a title you already have (tracked, watchlisted or dropped). The v2.7.3 guarantee is unchanged; there are just more survivors now.
- [ ] Rail headings still show real genres, no UNDEFINED (the v2.7.1 regression stays dead).

## 2. The honest top-up caption

- [ ] If any rail's basis line ends with "Topped up with popular GENRE picks from TMDB", that rail ran the deterministic backfill. Its extra cards should be recognisable popular titles in that genre that you do NOT own. If no rail carries the caption, the model's picks survived on their own; that is the better outcome and also a pass.
- [ ] A rail must never render with fewer than 4 cards AND no caption while unowned popular titles obviously exist in that genre. That combination would mean the backfill silently failed; report it.

## 3. Cost and behaviour regressions

- [ ] Generating the rails is still ONE AI call. Rough proxy: Explore loads in one skeleton pass, no repeated spinners.
- [ ] Reload Explore straight after: rails serve instantly from cache, no regeneration (the gate governs again from here).
- [ ] Ask box: pick cards still exclude owned titles; the text answer still discusses owned titles when asked about them.

## 4. General regression, quick pass

- [ ] Episode row tap still lands on its episode with the accent outline (v2.7.3).
- [ ] One episode tick round-trips. Watchlist, stats and data modals open. Backup export downloads.

If everything passes, the LinkedIn session opens clean and the rails screenshots for the post can be taken from your real library. If anything fails, paste the failure into a fix session BEFORE posting anything.
