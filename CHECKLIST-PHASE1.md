# Phase 1 browser checklist

Upload the folder to GitHub (drag the extracted folder, confirm the queued list shows paths with slashes like src/components/App.jsx), wait for Vercel to deploy, then run these on the live site.

**Your real data is safe for checks 1 to 7. Checks 8 to 11 need a private/incognito window so your real library is untouched.**

## In your normal browser (real data)

1. **Tonight card.** Shows tab leads with a big backdrop card labelled TONIGHT showing one show, its next episode code (like S02 E04) plus episode name, a Mark watched button and an "N left" chip.
2. **Two-second log.** Tap Mark watched once. A toast confirms, the card advances to the following episode without opening anything.
3. **Still watching?** If any show sits untouched for 30+ days it appears under STILL WATCHING? with Keep and Drop. Tap Keep on one: it jumps back into the queue. Tap Drop on another: it disappears, then open Profile and confirm your episode stats did not change.
4. **Nudge.** If a second show (not the Tonight one) has 3 or fewer episodes left, a slim banner appears above the card. Tap the ✕ to dismiss; it stays gone until you reload.
5. **Theme.** Profile, APPEARANCE, tap Light. The whole app flips to the warm light theme including tabs, modals and toast. Backdrop heroes stay dark on purpose. Reload: light persists. Switch back to Dark.
6. **Popular grid from Profile.** Profile, Browse popular titles. A grid of popular shows then films opens; tap ＋ on one, it turns green; Done closes it. Remove it after via its show page, Stop tracking, if you don't want it.
7. **Untouched surfaces.** Upcoming, Films and a show's season accordion all look restyled but behave exactly as before. Tab icons are now line icons, not emoji.

## In a private/incognito window (clean slate)

8. **Key gate.** The TMDB key screen appears first, restyled. Paste your key, Save and start.
9. **First run.** You land on "What are you watching?" with a search box focused. Search a show, tap ＋. Toast confirms.
10. **Grid auto-offer.** Immediately after that first add, the Add a few favourites grid opens by itself. Add one or two, tap Done. It never auto-opens again.
11. **Import wizard sanity.** Profile, Import TV Time export. Run one sample CSV (any of the sample-data files from the repo) through pick, review, apply. If this passes, run your real TV Time export whenever ready: target 11,413 episodes.

Anything failing: note the check number and what you saw, bring it to the next session.
