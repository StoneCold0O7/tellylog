# Browser checklist: Phase 1.6 polish (v2.2.0)

Run on the deployed site after uploading this build. No storage migration; existing data is untouched.

## Brand revert
- [ ] Browser tab title reads "TellyLog · your TV and film tracker"
- [ ] Top bar brand reads TellyLog (accented "Log")
- [ ] Profile → Download backup produces tellylog-backup-YYYY-MM-DD.json
- [ ] Restoring a logline-backup json from the brief Logline period still works

## Preview before you add (the big one)
- [ ] Explore: every card title is underlined with a small › after it
- [ ] Tapping a card title opens a detail view WITHOUT adding the title
- [ ] For an untracked show the detail view has: hero with year range and ★ rating, genre chips, synopsis, a read-only SEASONS list with episode counts and years, cast strip, WHERE TO WATCH · GB, trailers and a MORE LIKE THIS rail
- [ ] "Track this show" in that view adds it and swaps to the full tracker modal
- [ ] For an already-tracked show the button reads "Open in your tracker"
- [ ] Films tab: film titles are underlined with ›; tapping opens a film detail view (this never existed before)
- [ ] Film detail view: year, runtime, rating, genres, synopsis, cast, providers, trailers, more-like-this
- [ ] Untracked film shows "Add to watchlist"; tracked film shows the watched tick plus Remove
- [ ] Show modal MORE LIKE THIS: tapping a poster now opens a PREVIEW instead of silently tracking it; fineprint says nothing is added until you say so
- [ ] Previews inside previews work (tap a more-like-this poster from a preview)

## Season quick-tick
- [ ] Every aired season header row has a small tick button beside the count, no need to expand
- [ ] Tapping it marks the whole season watched; tapping again unmarks it
- [ ] The header still expands and collapses when tapped anywhere else

## The Pit bug (0/0 seasons)
- [ ] Open The Pit: season 3 header reads "Not aired yet", no tick button, no 0 / 0
- [ ] Expanding it shows an explanatory notice, no Mark/Unmark button
- [ ] Aired seasons behave exactly as before

## Archive visibility
- [ ] Home: scroll to the bottom; an ARCHIVED (n) toggle appears if anything is archived
- [ ] Expanding it lists archived shows with episodes-left, an Unarchive button and a tap-through to the show
- [ ] Unarchive puts the show back in the queue immediately

## Profile
- [ ] SHOWS section has a Posters / List toggle
- [ ] List view shows poster, underlined name, x of y episodes and an ARCHIVED chip where relevant
- [ ] The "Films watched" stat tile shows "See the list ›" and tapping it opens Films → Watched
- [ ] The import button now reads "Import watch history"
- [ ] Fineprint under YOUR DATA lists TV Time, Netflix, Letterboxd and IMDb

## Ask box error surfacing (with your ANTHROPIC_API_KEY still set)
- [ ] Ask something. If it fails, the error box now names the actual cause (for example "Your Anthropic account has no credit. Add credit under Billing at console.anthropic.com") instead of "The ask service had a problem"
- [ ] If it succeeds you get an answer plus 2 to 4 add-able pick cards
- [ ] Fire more than 10 asks inside 10 minutes: you get a polite too-many-asks message (rate limit)

## Regression sweep
- [ ] Tonight card, marking, theme toggle, import wizard sample CSV: all unchanged
- [ ] /api/health still returns "llm": true (and "tmdbProxy": false until you add that key)
- [ ] Existing shows, history and stats identical to before the update
