# SESSION LOG v2.7.2, the late-change round (9 July 2026)

The owner opened what was briefed as the LinkedIn session with three build requests plus one knowledge question, overruling the "no build sessions remain" line in CONTEXT.md. Overrule accepted and recorded; the LinkedIn post moves one session later. The session also opened with a structural blocker: neither the codebase zip nor HANDOVER-NEXT.md was attached. Work stopped until both arrived, per the contract.

## 1. Browse all movies landed on trending shows (bug, fixed)

The "Browse all movies" button on the empty Films watchlist called go('explore'), which lands at the top of Explore where TRENDING SHOWS renders first. Audit note on the owner's phrasing ("the search bar and ask bar stay and don't get hid"): scrolling to a films section below shows would necessarily hide those bars, so the fix reorders instead of scrolling. go() gained an optional focus argument; the button passes 'movies'; ExploreTab renders TRENDING FILMS first when that focus is set, skeleton state included. Focus resets to null on every ordinary navigation, so the Explore tab itself keeps its shows-first default. No hash-schema change, no sticky-header CSS risk.

## 2. Watched history: Episodes | By show aggregate (feature)

The WATCHED HISTORY header gained the established seg--mini toggle. Episodes is the untouched as-watched stream. By show renders one row per series with the accent progress bar, distinct episodes ticked over the known total and a completion percent. Two rulings were put to the owner and went unanswered, so the recorded audit defaults applied: (a) rewatches never inflate the percent, distinct ticks only, capped at 100, consistent with the v2.6.0 ticked-episodes-only rule; (b) any show with at least one ticked episode qualifies, archived included (tagged "archived" in the meta line), watchlist naturally excluded at zero ticks. New store selector showProgressList() with node tests, including a metadata-shrink edge (TMDB revising a season down under existing ticks caps seen at total rather than showing 7 of 4).

## 3. Editable profile name (feature)

settings.profileName existed since Phase 0 (default 'You') but was only ever consumed as the avatar initial, with no editor. The hero now displays the name; the existing Edit panel gained a name field with Save, next to photo and cover. Store gained profileName() and setProfileName() (trim, 30-char cap, empty falls back to 'You'). Two defensive details on the record: the name renders ink-on-surface by default and white only over an actual backdrop image, re-applying the v2.6.0 light-mode legibility lesson before it could recur; and the avatar initial now uses Array.from() so an emoji-leading name cannot render half a surrogate pair (pre-existing flaw, fixed in passing). No schema change: the field was already there, so old backups restore clean, covered by a new node test.

## 4. Owner knowledge question: search result ordering

Answered from the code: FirstRun and Explore both call TMDB /search/multi, filter to tv and movie, slice to 12 and apply NO local sorting. The visible order is therefore TMDB's own relevance ranking, which weights text match against the title together with TMDB popularity signals. Not rating, not alphabetical, not episode count. [Certain]

## Decisions and refusals this round

- NOT added: new vitest component tests. The container again had no npm registry access, so new vitest code could not be executed; the static check showed no existing assertion breaks (the smoke suite only asserts the WATCHED HISTORY label, which still renders) and the three features are covered by CHECKLIST-V2_7_2.md in the browser. Adding unexecutable test code with no verification path was judged worse than none. Precedent distinguished: v2.7.0 edited that suite because existing assertions broke; nothing broke here.
- NOT changed: public/sw.js. Navigations are network-first, so a deploy serves the fresh shell without a cache-name bump.
- README updated with one sentence for the history aggregate and the profile additions, keeping the decision-record framing intact.

## Test state

111 node tests green in-session (40 util, 62 store including 4 new, 9 refresh gate). The vitest suite and the vite production build again ride on the Vercel build plus the checklist, the same recorded limitation as v2.7.0 and v2.7.1.
