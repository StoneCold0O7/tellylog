# SESSION LOG v2.7.3, the post-import round (9 July 2026)

Same session as v2.7.2, continued. The owner completed the TV Time import against the live app (2k+ titles, 10.5k+ episodes, imported clean; the import wizard held at real scale, worth noting on the record since ImportWizard has been under a do-not-touch rule for exactly this reason) and reported two bugs the pre-import library could never have surfaced.

## 1. AI recommendations offered titles already in the library (bug, fixed)

Explore rails and ask picks recommended owned titles (Suits, Parks and Recreation among them) with the already-added state visible on the cards. Root cause, structural: api/ask.js instructs the model to never pick library titles, but librarySummary is capped at 30 shows and 20 films for token cost, so at import scale the model sees a sliver of the library and the prompt rule is unenforceable. The prompt was left as-is (it still helps at small scale); the guarantee is now deterministic and client-side. New store helper ownsTitle(mediaType, tmdbId): tracked, watchlisted and archived all count as owned, per the owner's report that long-untouched-but-tracked titles must also never surface. Applied in three places: RailsSection filters on SERVE (the stale cached rails written pre-import stop showing owned titles immediately, without waiting for the 5-day/6-unit gate to reopen), on fresh generation and at cache write; rails emptied by the filter are dropped whole. AskBox filters resolved pick cards the same way; the text answer still covers owned titles when the question is about them, since the card's only function is an add button, useless for something already added. Node-tested across both media and all three owned states.

## 2. Episode rows opened the modal at the top (UX, fixed)

Tapping a watched-history row for S04E10 opened the show modal in its default state: next-unwatched season expanded, scrolled to the top. The owner proposed landing on the tapped episode and invited pushback; none was warranted, the proposal is correct. openShow() gained an optional focus {s, e} carried through modal state into ShowModal; the focused season opens instead of the default, and once its episodes load the target row scrolls to centre with a brief accent outline. EpRow passes its own episode as focus, so UP NEXT rows gained the same behaviour for free, deliberately: consistent row semantics. Rows without episode context (Profile posters, stale cards, the By show aggregate) keep the default open state, untouched.

## Test state

63 store tests green (1 new), 40 util, 9 gate: 112 node tests in-session. The vitest suite and the vite build again ride on the Vercel build plus CHECKLIST-V2_7_3.md (no npm registry in the container, the standing limitation). One packaging note: v2.7.2 and v2.7.3 ship in a single zip because v2.7.2 was never uploaded before this round reopened.
