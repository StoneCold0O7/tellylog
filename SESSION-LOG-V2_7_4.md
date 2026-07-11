# SESSION LOG v2.7.4, the rails starvation round (11 July 2026)

The owner reported that the v2.7.3 owned-title fix left the Explore rails rendering ONE card each on his imported library (screenshot on the record: Drama and Comedy rails with a single pick). He proposed widening the library context sent to the model and asked for a cost analysis with pushback if unviable. The audit found the proposal viable on cost and wrong on architecture; the owner accepted the counter-proposal and instructed the build.

## 1. Diagnosis

The one-card rails are the v2.7.3 fix working correctly on a starved input, not a regression. The chain: the model is asked for 5 picks per rail; librarySummary caps at 30 shows and 20 films, so at 2k+ imported titles the model cannot know what is owned; its picks are the obvious famous titles in each genre; the owner has watched nearly all of them; the deterministic ownsTitle filter correctly removes them; 1 survivor renders. A misconception was also cleared for the record: the library is NOT the recommendation pool. The model recommends from its own world knowledge; TMDB resolves picks into cards afterwards. The summary exists only for taste context and exclusion. Making it bigger does not broaden recommendations.

## 2. The rejected option: send the whole library

Cost analysis, on the record: 2,000 titles at roughly 8 to 10 tokens per line is 16k to 25k input tokens per generation, roughly 2 to 3 cents at Haiku input pricing [Likely on exact pricing]. Under the 5-day/6-unit gate that is pennies per month. Cost was NOT the blocker and the log does not pretend it was. Rejected on architecture: a prompt rule against 2,000 names is exactly the kind of instruction that leaks, which is why exclusion went deterministic in v2.7.3 in the first place; 2,000 names drown the taste signal that 30 recent titles carry sharply; MAX_LIBRARY caps the payload at 6,000 characters server-side so most of it would truncate anyway. Sending everything buys marginal exclusion improvement at reliability and quality cost while still guaranteeing nothing.

## 3. The shipped fix, three parts

**Over-generation.** SYSTEM_RAILS now asks for 10 to 12 picks per rail, never fewer than 8, with an explicit instruction to range across eras and countries rather than only the obvious hits. The ai.js client contract caps at 12 (was 5); rails mode max_tokens raised 2000 to 3000. The UI renders the first DISPLAY_CAP (5) survivors; the surplus is cached as a reserve so serve-time filtering after a future import degrades gracefully instead of thinning back to one card.

**Targeted exclusion.** New store selector ownedTitlesInGenre(genre, kind, cap): the owned titles carrying that genre, kind-matched (tv, movie or mixed), ranked by watch minutes desc so the heaviest, most guessable titles survive the 80-name cap. RailsSection attaches it to each anchor; api/ask.js sanitises it (80 names, 120 chars each) and injects "Already owned in this genre, NEVER pick any of" into the anchor line. Best effort by design: titles without genreList are invisible to it and ownsTitle remains the guarantee. Roughly 1,500 extra input tokens across four anchors, a fraction of a penny. Deliberately NOT part of the cache hash: the exclusion list only moves when the library moves, which the gate already governs.

**Deterministic backfill.** A rail still under 4 cards after filtering is topped up from TMDB discover by genre (popularity-ranked, vote-count floored, owned and duplicate titles excluded) at zero model cost. Genre ids are hardcoded stable TMDB constants, so the backfill costs no extra metadata calls; an unknown genre name quietly skips. discover was added to the proxy allowlist. Emptied rails are now kept alive through generation long enough for the backfill to rescue them, then dropped only if still empty. Honesty ruling, consistent with the grounding thesis: backfilled cards are flagged and the rail's basis line gains "Topped up with popular GENRE picks from TMDB", because silently mixing popularity picks into taste-grounded rails would break the rule the rails are built on. Backfill runs at generation only, never on serve, so no per-visit network cost.

## 4. Cache shape version

RAILS_CACHE_V bumped 2 to 3 (the v2.7.1 lesson applied deliberately this time): the shape now carries up to 12 survivors, fill flags and the filled marker, AND the bump forces the thin post-import cache to regenerate on the owner's next Explore visit instead of serving one-card rails until the gate reopens. The refreshGate validator keys on the constant, so the suite tracked the bump without edits.

## 5. Test state

114 node tests green in-session: 40 util, 65 store (2 new, covering genre/kind filtering, minutes ranking, the cap, watchlisted-and-archived-count-as-owned and missing-genreList invisibility), 9 gate. The vitest rails contract test was updated for the 12-pick cap and the travelling exclude field but NOT executed: no npm registry in this container, the standing limitation since v2.7.0. The Vercel build plus CHECKLIST-V2_7_4.md are the compensating controls, as every round since.

## 6. Files changed

src/lib/store.js (ownedTitlesInGenre), src/lib/refreshGate.js (RAILS_CACHE_V 3), src/lib/tmdb.js (genre id maps, discoverTV, discoverMovie), src/lib/ai.js (12-pick cap), src/components/RailsSection.jsx (exclusion payload, keepEmpty strip, backfill, display cap, top-up caption), api/ask.js (prompt, exclude sanitisation, max_tokens), api/tmdb.js (discover allowlisted), tests/store.test.js (2 new), tests/rails.test.jsx (contract updated, unexecuted), README.md (the v2.7.4 decision paragraph), package.json (2.7.4). Deleted files: NONE.
