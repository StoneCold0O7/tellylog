# v2.5.0 browser checklist

Run on tellylog-3d2u.vercel.app after Vercel finishes deploying the push. Mark each PASS/FAIL and bring failures to the next session.

## A. Stats modal

1. Profile tab: charts are GONE from the page. A "📊 Open your stats" button sits under the stat cards.
2. Tap it. A popup opens titled "Your stats" with the three charts inside.
3. If any pre-2.4 items still lacked genres, the backfill notice runs INSIDE the popup, not on the Profile.
4. Tap a genre bar: the bar highlights, others dim, a titles list appears under the chart with hours per title. Tap the same bar again: selection clears.
5. Tap a donut slice or its legend row: same behaviour, but the list shows only titles whose PRIMARY genre matches. The Other slice does nothing, by design.
6. Tap a point on the activity line: a dashed cursor marks the month, the header shows month and hours, a list below shows what was logged that month with episode counts. Works with a finger, not just a mouse.
7. Close the popup, reopen it: no second backfill run (it only refetches items still missing genres).

## B. Taste summary

1. The taste card is still on the Profile. There is NO Refresh button.
2. Fineprint reads "Updates by itself whenever your library changes."
3. Add or remove any title, revisit Profile: the summary refetches once (watch the wording change or the brief "Reading your library…" state).

## C. TV watchlist

1. Explore, open any show you do NOT track. The preview now shows TWO buttons: "Track this show" and "Add to watchlist".
2. Tap "Add to watchlist". Toast confirms. The show does NOT open the tracker.
3. Shows tab: a WATCHLIST section lists it as "Saved to watch later". It does NOT appear in Tonight or Up next.
4. Reopen its preview: it says "On your watchlist" with "Start watching" and "Remove".
5. Back in the WATCHLIST section, tap Start: the tracker opens and the show moves into the queue.
6. Watchlist a second show, then mark any episode watched directly from its tracker: it leaves the watchlist without tapping Start.
7. Films are untouched: the Films tab watchlist behaves exactly as before.

## D. Profile images

1. Profile tab: an "Edit" button sits top-right on the hero. Tap it: Change photo / Change cover buttons appear.
2. Set a photo from your camera roll: it replaces the initial in the circle.
3. Set a cover: it replaces the recent-show backdrop.
4. Remove buttons appear once each is set and work.
5. Download a backup AFTER setting both images and check the file size stays sane (well under 1 MB unless your library is enormous). This is the compression working.
6. Restore that backup in a private window: images survive the round trip.

## E. Regression sweep

1. Import wizard opens and its labels are unchanged.
2. Ask box on Explore still answers and still returns 5-7 picks.
3. Old backup from before v2.5.0 restores clean; its shows land in the queue, not the watchlist.
4. Dark and light themes both render the new modal and drill-down lists legibly.

## F. Still owner-gated from earlier sessions

1. Upstash Redis store still unprovisioned: the rate limiter continues on the in-memory fallback. Provision via Vercel Marketplace whenever; zero code changes needed.
2. Grounding campaign: log your genuine top 30-50 shows BEFORE the next session. Session C builds recommendation rails on this data.
