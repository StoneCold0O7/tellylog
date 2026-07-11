# CHECKLIST v2.7.3, the browser verification round

Run on the deployed site after the Vercel build goes green. Phone first. Deleted files: NONE. This round supersedes CHECKLIST-V2_7_2.md; run BOTH if v2.7.2 was never deployed on its own (the two rounds ship together in this zip).

## 1. No owned titles in AI recommendations

- [ ] Explore: the genre rails render and NO card carries the already-added state. Specifically re-check the offenders you reported (Suits, Parks and Recreation): they must be gone.
- [ ] This must be true IMMEDIATELY, without waiting for the rails to regenerate: the filter runs on the cached rails too. If a rail lost all its picks to the filter, the whole rail disappears rather than rendering empty.
- [ ] Ask box: ask "what should I watch next". No pick card is a title you already have (tracked, watchlisted or dropped). The text answer may still MENTION owned titles if your question is about them; only the cards are filtered.

## 2. Episode rows land on their episode

- [ ] Shows tab, WATCHED HISTORY (Episodes view): tap a row from a LATER season of a long show. The modal opens with THAT season expanded, scrolled to THAT episode, briefly outlined in the accent colour. Not the modal top, not season one.
- [ ] UP NEXT: tap a queued row. Same behaviour for its next episode.
- [ ] Regression: open the same show from the Profile poster strip. The modal opens normally (next-unwatched season expanded, no scroll jump).

## 3. Carried from v2.7.2, if not already verified

- [ ] "Browse all movies" lands films-first with the search and Ask bars visible; the Explore tab itself stays shows-first.
- [ ] WATCHED HISTORY Episodes | By show toggle; By show percentages sane, rewatches not inflating them, archived tagged.
- [ ] Profile name renders, edits, saves and survives a backup round trip; legible in light mode with no cover.

## 4. General regression

- [ ] Rails headings show real genres (no UNDEFINED). One episode tick round-trips. Watchlist, stats and data modals open.

If everything passes, the LinkedIn session opens clean. If anything fails, paste the failure into a fix session BEFORE posting anything.
