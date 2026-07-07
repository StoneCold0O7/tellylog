# CHECKLIST-PHASE2B: verify v2.4.0 in the browser

Do these on tellylog-3d2u.vercel.app after uploading and Vercel finishes deploying. Chrome or Edge. Deleted files this time: NONE, upload only.

## A. Genre backfill (your existing library, once)

1. Open Profile. If your library predates this build you should see "Adding genre data from TMDB… X of Y" under INSIGHTS. Let it finish (a few seconds for a small library).
2. Reload the page. The progress notice must NOT reappear; the fill is one-time.
3. Restore an OLD backup file (pre-today) via Restore backup, then open Profile. The progress notice SHOULD reappear once, then charts rebuild. This is by design.

## B. The three charts

4. Profile shows an INSIGHTS section with "Hours by genre" bars. Genres with more watched time have longer bars. The caption may state a genre-data coverage percentage below 100 if some fetches failed; reload retries them.
5. "Watch time by primary genre" donut renders with a legend whose percentages sum to roughly 100 (rounding).
6. "Watch activity by month" line renders. If your data was imported from TV Time it should span the export's real dates. Episodes ticked by hand land in the month you ticked them; the caption says so.
7. Switch to the Light theme. All three charts stay readable.
8. Empty check (incognito, fresh visitor): Profile shows NO insights section and no errors.

## C. AI taste summary

9. On Profile, above the charts: "Your taste, read by Claude" with 2-3 sentences grounded in your actual library. No invented titles.
10. Reload the page: the summary appears instantly with NO new API call (it is cached until your library changes). Press Refresh: it refetches.

## D. Ask box, 5-7 picks

11. Explore tab, ask something ("something funny under 30 minutes"). You should get AT LEAST 5 cards, up to 7. A couple may drop if TMDB cannot resolve a title; 4 visible cards occasionally is acceptable, 3 or fewer repeatedly is a fail, tell the next session.

## E. Attribution

12. Profile bottom: the "designed and built by Anmol" line links to github.com/StoneCold0O7/tellylog in a new tab.
13. Open developer tools (F12), Console tab, reload: the amber TellyLog colophon message appears.

## F. Regression sweep

14. Mark an episode watched from Tonight; import wizard opens and parses a sample CSV; show modal opens with seasons; nothing else on Profile moved.

## G. Durable rate limit (only after you provision the store)

15. In Vercel: Marketplace, add Upstash Redis (free tier), attach it to the project so UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars appear, redeploy. Until then the limiter silently uses the old in-memory path; nothing breaks either way.
16. After provisioning: fire 11 asks quickly; the 11th shows the too-many-asks message even if a minute passes between some of them.
