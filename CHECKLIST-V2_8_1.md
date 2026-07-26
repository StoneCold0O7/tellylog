# CHECKLIST v2.8.1, browser verification

Covers v2.7.9, v2.8.0 and v2.8.1 together. Deploy is `git push` to main, so nothing to drag. Walk this on your **phone**, since most of it is touch behaviour that a desktop cannot exercise.

Note: the app is an installed PWA, so the first load after a deploy may serve the previous version from cache. If something below is missing, close and reopen it once.

## 1. The unaired-episode fix (v2.7.9)

- [ ] A series that has not premiered yet, or whose next episode is more than a week away, no longer appears in UP NEXT and is never shown as TONIGHT. This was the twenty-day premiere you reported.
- [ ] It still appears on the Upcoming tab, which is where scheduled episodes belong.
- [ ] A show you are behind on still queues normally, even if its newest episode is weeks away.
- [ ] The nudge banner ("N episodes from finishing X") never names a show whose remaining episodes have not aired.

## 2. Explore fixes (v2.7.9 and v2.8.1)

- [ ] Tap the title of a show you already track. It opens your tracker directly, with no "Open in your tracker" step.
- [ ] Tap the title of a show you do NOT track. It still opens the preview first, and nothing is added until you say so.
- [ ] Open any film you have not added. There are two actions: "Add to watchlist" and "Already watched". "Already watched" files it under Watched, not the watchlist.
- [ ] **The green tick now removes.** Tap the green ✓ on a trending or search card for something you track. A title with no watched episodes disappears immediately.
- [ ] Tap the green ✓ on a show that HAS watched episodes. It asks first and tells you how many episodes would be deleted. Cancel leaves everything intact.

## 3. Swipe to tick (v2.8.0, corrected in v2.8.1)

- [ ] Swipe an UP NEXT row to the right. It lifts and fades, then ticks. A "✓ Watched" panel shows behind it as it moves.
- [ ] Swipe a history row to the left. It shows "↶ Undo" and unticks.
- [ ] Swipe the big TONIGHT card to the right. It marks the episode watched, same as the button.
- [ ] The "Mark watched" button and the round tick still work exactly as before. The swipe is an addition, not a replacement.
- [ ] **Scroll the Shows tab normally, with your thumb passing over the rows. Nothing ticks.** This is the important one.
- [ ] A half-hearted swipe that you stop early snaps back and changes nothing.

## 4. History at the top (v2.8.1)

- [ ] At the top of the Shows tab there is a small "▾ Watched history" handle, above everything else.
- [ ] TONIGHT is still the first real content. The default view is not pushed down.
- [ ] Pull down from the top. You see "Pull for your history", then "Release for your history", and the history opens **in place at the top**. It does not jump you to the bottom of the page.
- [ ] Tapping the handle does the same thing, so the gesture is not the only way in.
- [ ] Opening it says "Hide history"; tapping again closes it.
- [ ] The Episodes | By show toggle still works inside it.
- [ ] **On Android:** pulling down opens the history rather than triggering Chrome's page refresh.

## 5. Stats (v2.7.9)

- [ ] Open your stats and go to the monthly activity chart. Tapping anywhere in a month's vertical column selects it, not just the tiny dot. This was the fiddly one.
- [ ] The drill-down still lists what you logged that month.

## 6. General regression

- [ ] Tonight, Up next, Keep/Drop and Archived all still behave.
- [ ] Watchlist, stats and data modals still open.
- [ ] Import is untouched.

## If anything fails

The two most likely to need tuning on real hardware are the swipe commit distance (currently 72px) and the pull distance (currently 60px). Both are one-line changes, so report the feel rather than working around it.
