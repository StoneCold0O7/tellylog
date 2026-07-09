# CHECKLIST v2.7.2, the browser verification round

Run on the deployed site after the Vercel build goes green. Phone first, then a quick desktop pass. Deleted files: NONE.

## 1. Browse all movies lands on films

- [ ] Films tab with an empty watchlist: tap "Browse all movies". Explore opens with the search bar and the Ask bar visible at the top and TRENDING FILMS as the FIRST rail under them, TRENDING SHOWS below it.
- [ ] Now tap the Explore tab directly from the bottom bar. Order is back to the default: TRENDING SHOWS first. (The films-first order applies only when arriving via the movies button, by design.)
- [ ] Shows tab empty-queue "Browse shows" still lands shows-first. Regression tap.

## 2. Watched history: Episodes | By show

- [ ] Shows tab, WATCHED HISTORY header now carries an Episodes | By show segment. Default is Episodes and looks exactly like before. Unticking an episode from the stream still works. Regression tap.
- [ ] Tap By show: one row per series, poster, name, the accent progress bar, "X of Y episodes · Z% complete". Percentages sane against your library.
- [ ] A show with rewatches set shows the SAME percent as without (rewatches must not inflate completion).
- [ ] A dropped (archived) show appears with an "archived" tag in its meta line.
- [ ] Tapping a row opens the show modal.

## 3. Profile name

- [ ] Profile: your name renders next to the avatar in the hero ("You" if never set).
- [ ] Tap Edit: a name field with Save name sits above the photo and cover buttons. Change the name, Save, toast fires, hero and avatar initial update.
- [ ] Light theme, NO cover image set and an empty library: the name is still legible on the plain hero (this is the v2.6.0 light-mode lesson re-applied).
- [ ] Export a backup, restore it: the name survives the round trip.

## 4. General regression

- [ ] Explore rails still render with real genre headings (no UNDEFINED).
- [ ] Watchlist button, stats modal, data modal all open. One episode tick round-trips.

If everything passes, v2.7.2 is done and the LinkedIn session opens clean. If anything fails, paste the failure into a fix session BEFORE posting anything.
