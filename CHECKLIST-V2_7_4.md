# CHECKLIST v2.7.4, the browser verification round

Supersedes CHECKLIST-V2_7_3.md. This zip carries v2.7.2 + v2.7.3 + v2.7.4 together (none was deployed separately). Run after the Vercel build goes green. Deleted files: NONE. New file: CLAUDE.md (repo root, for Claude Code sessions).

## 1. Rails and ask picks are full again (v2.7.4)

- [ ] Explore: after the rails regenerate (delete the tellylog:rails:v1 key in dev tools OR just accept the gate's timing), each rail shows 4-5 cards, not 1-2, and still NO owned titles. Note: the FIRST visit after deploy may serve the old thin cache; the count fix applies from the next regeneration.
- [ ] Ask box: "what should I watch next" returns a healthy set of cards (up to 7), none owned.

## 2. Carried from v2.7.3

- [ ] No owned titles anywhere in AI surfaces (re-check Suits, Parks and Recreation).
- [ ] History row tap opens the modal at THAT episode, accent-outlined; UP NEXT rows too; Profile poster opens normally.

## 3. Carried from v2.7.2

- [ ] "Browse all movies" lands films-first, bars visible; Explore tab default unchanged.
- [ ] History Episodes | By show toggle; percentages sane, rewatches not inflating, archived tagged.
- [ ] Profile name renders, edits, survives backup round trip, legible in light mode without a cover.

## 4. Stats sanity (owner-reported, diagnosed NOT a bug)

- [ ] Stats modal: read the fineprint under BOTH genre charts. Bars = every genre a title carries (overlapping, not shares). Donut = primary genre only (true shares). Confirm your Drama/Comedy numbers make sense under those two definitions before filing this as a bug.

## 5. General regression

- [ ] Rails headings real genres. One episode tick round-trips. Watchlist, stats, data modals open.
