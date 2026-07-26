# CHECKLIST v2.8.2, browser verification

The watched-history rework and pull responsiveness. Deploy is `git push` to main, so nothing to drag. Walk this on your **phone**, since all of it is touch behaviour a desktop cannot exercise.

Note: the app is an installed PWA, so the first load after a deploy may serve the previous version from cache. If something below is missing, close and reopen it once.

## 1. Order and the opening position

- [ ] Pull down at the top of the Shows tab to reveal the history. The panel comes DOWN from above the content, it does not throw you to the bottom of the page.
- [ ] The view lands on the NEWEST episode, at the bottom of the panel, with a strip of the Tonight card visible just below it. That strip is the cue that there is more underneath.
- [ ] Scrolling UP inside the panel walks BACKWARDS in time: the episode above is older, the one below is newer. The latest thing you watched is nearest the page.

## 2. Paging, fifteen at a time

- [ ] The first open shows about fifteen episodes, not the whole history.
- [ ] At the TOP of the panel there is a "Pull for older episodes" gesture and a "▲ Older episodes" button. Either one loads the next fifteen.
- [ ] After loading older episodes, BOTH pages stay on screen. The older block appears above and you are left looking at it, nothing you were reading jumps away under your thumb.
- [ ] You can keep pulling for older episodes until the history runs out, at which point the pull and the button stop appearing.

## 3. Auto-condense when you scroll down to the titles

- [ ] With the history open, scroll DOWN past it into the Tonight card and the queue. Once you are clearly past it, the history packs itself away on its own and the "Watched history" handle comes back.
- [ ] **The important one: when it packs away, the content you are looking at does NOT jump.** The show under your thumb stays put; you are not thrown to the top of the page.

## 4. Switching tabs

- [ ] Open the history, go to another tab (Profile, Explore), come back to Shows. The history is collapsed again, it does not stay open from before. You never have to tap "Hide history" to get your normal Shows view back.

## 5. The handle and accessibility

- [ ] Tapping the "Watched history" handle opens it the same way the pull does, landing on the newest episode.
- [ ] Tapping "Hide history" closes it.
- [ ] The Episodes / By show toggle now sits at the BOTTOM of the panel, next to the handle. "By show" still shows one row per series with the progress bar, whole, not paged.

## 6. Feel

- [ ] The pull feels responsive, not laggy. It should track your finger closely and the label should flip to "Release…" without a stutter. (The heavy recompute that ran on every frame is gone; report it if it still drags on your real library.)
- [ ] Swipe an UP NEXT row to the right to tick it. The lift-and-fade is now noticeably LONGER than before (about a third of a second), so you can see the row travel up rather than just vanish. Tell me if it now reads as lag instead of motion; that is the one number I most want your eye on.
- [ ] Everything from v2.8.1 still holds: swipe still ticks, the plain buttons still work, and scrolling with your thumb over the rows still ticks nothing.

## If a threshold feels wrong

These are one-line changes, so report the feel rather than working around it:

- Pull commit distance: 60px of travel (you drag about 80px of finger to earn it).
- Swipe commit distance: 72px.
- Page size: 15 episodes.
- Lift-and-fade: 300ms. If it reads as lag, this is the one to cut back first.
