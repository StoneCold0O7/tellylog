# Browser checklist: Phase 1.5 + Phase 2 scaffold + rename

Run on the deployed site after uploading this build. Your existing data is untouched by design; nothing here migrates storage.

## Rename
- [ ] Browser tab title reads "Logline · your TV and film tracker"
- [ ] Top bar brand reads Logline (accented "line")
- [ ] Profile → Download backup produces logline-backup-YYYY-MM-DD.json
- [ ] Restore of an OLD tellylog-backup json still works (use a spare browser profile so you do not disturb live data)
- [ ] All your existing shows, history and stats are exactly as before the update

## Show modal depth (open a show you are mid-way through, ideally Fighting Spirit)
- [ ] Hero meta line now shows year range and a ★ rating
- [ ] Genre chips and synopsis appear under the action buttons
- [ ] NEXT UP row pins your continue point with a working check button
- [ ] CAST strip scrolls horizontally with photos
- [ ] WHERE TO WATCH · GB shows provider logos with a "powered by JustWatch" credit
- [ ] TRAILERS & CLIPS thumbnails open YouTube in a new tab
- [ ] The season containing your next episode is open by default
- [ ] Season headers show count plus a mini progress bar
- [ ] Episode rows show a still image, a one-to-two-line overview, the air date and (for watched episodes) your watched date
- [ ] MORE LIKE THIS rail appears at the bottom, labelled FROM TMDB; tapping a poster tracks and opens that show with a toast
- [ ] A show with no GB providers or no videos simply omits those sections, no errors

## Tonight card and performance feel
- [ ] Tonight card shows a short episode overview under the title
- [ ] Backdrop fades in rather than popping
- [ ] Explore trending shows shimmering skeleton cards while loading, then real posters fade in
- [ ] Opening a season shows skeleton episode rows, not a bare "Loading" line
- [ ] Scrolling grids: no layout jumping as images arrive

## Phase 2 gating (the important negative checks)
- [ ] Explore shows NO ask box (you have not added the env var yet)
- [ ] Visit /api/health on the deployed site: JSON with "llm": false, "tmdbProxy": false
- [ ] Everything else works exactly as before, proving the scaffold is inert

## Regression sweep
- [ ] Import wizard opens, sample CSV from sample-data still imports
- [ ] Theme toggle still flips dark/light
- [ ] Marking the Tonight episode advances the card in place
