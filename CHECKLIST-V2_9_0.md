# CHECKLIST v2.9.0, browser verification

The stats redesign: a Spotify-Wrapped-style headline slab on top of the existing charts. Deploy is `git push` to main, so nothing to drag. This one is visual, so a **phone** is the right device (the whole point is a screen you would screenshot), but a desktop browser exercises everything too.

Note: the app is an installed PWA, so the first load after a deploy may serve the previous version from cache. If the stats screen still looks like the old one, close and reopen it once, or pull to refresh.

Open it from Profile, the "📊 Open your stats" button.

## 1. The headline slab

- [ ] At the very top, one BIG number of hours watched, with a line under it like "≈ 3 months, 12 days of TV and film". The number should feel like the thing you would screenshot.
- [ ] Under it, four colourful tiles: episodes watched, shows watched, films watched, and your top genre. The numbers are big and each tile has its own colour.
- [ ] A "YOUR NUMBER ONE" card showing your single most-watched show: its poster, its hours, an "×N" badge if you have rewatched it, and how many episodes you have watched of it.
- [ ] One small grey line of fine print below the slab, saying totals include rewatches and estimate runtime where the data has none. That line staying there is deliberate; it is the honesty behind the big number.

## 2. It reads well in both themes

- [ ] In Dark mode the numbers and tiles are crisp and legible.
- [ ] Switch to Light mode (Profile, APPEARANCE, Light) and open stats again. The big number and every tile number are still easy to read, not washed out. This is the specific thing that broke once before, so it is worth a real look.

## 3. The charts and the drill-downs still work

- [ ] Below the slab, the three charts are all there: Hours by genre, Watch time by primary genre, Watch activity by month.
- [ ] Tap a genre bar. The list of titles behind it still appears, with the "×N" rewatch chips.
- [ ] Tap a slice or a legend row on the donut. Its titles appear.
- [ ] Tap a month on the line. What you logged that month appears. (The whole vertical column is tappable, not just the dot, as before.)
- [ ] Every small grey caveat under each chart is still there and unchanged.

## 4. The numbers are believable

- [ ] The big hours figure, the four tile counts and the number-one show all match what you would expect from your real library. If any number looks wrong, tell me which one and what you expected.
- [ ] "Shows watched" counts shows you have actually watched an episode of, not saved-for-later or dropped ones. Sanity check it against your gut.

## 5. Nothing else moved

- [ ] Tonight-first Shows tab, the watched history, swipes and everything from v2.8.2 all still behave. This round only touched the stats screen.

## If something looks off

Report what you see rather than working around it. The likely knobs are one-line changes: the big number's unit (hours), the tile colours, and whether the number-one card shows a film too (we chose show-only this round; say the word if you want the film back).
