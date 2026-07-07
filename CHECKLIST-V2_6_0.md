# CHECKLIST v2.6.0: verify on tellylog-3d2u.vercel.app after deploy

Do these in order on your phone (primary device) plus a quick pass on desktop. Report failures with the section letter.

## A. Explore rails (the headline feature)

1. Open Explore and scroll below TRENDING FILMS. Within a few seconds rails appear titled BECAUSE YOU WATCHED [a real show of yours]. Expect up to 3 show rails then 1 film rail, 5-6 cards each.
2. Every anchor title is genuinely from your library. If ANY anchor is a title you never watched, that is a critical failure, report it.
3. Each rail has a one-line basis under the heading explaining what the picks build on.
4. Tap any card: the existing preview modal opens. Nothing is added to your library by tapping alone.
5. Reload Explore. Rails reappear INSTANTLY (cached), no spinner, no new API spend.
6. Watch one new episode of anything, return to Explore. Rails refetch once (brief skeleton) because the library changed.
7. Rate limiter check: the rails call shares the 10-per-10-minutes limit with the ask box. Heavy testing may hit 429; the error should render as a readable notice, not a blank section.

## B. Voice insights (ASK YOUR STATS on Profile)

1. Profile shows ASK YOUR STATS between the taste summary and your shows. Works even offline, no AI badge needed.
2. Tap the mic, say "what is my most watched show". The answer appears immediately, no Ask press needed for voice.
3. Type "busiest month" and press Ask. Sensible answer.
4. Try "top genre", "how many episodes", "total watch time", "what have I rewatched", "best rated".
5. Ask something unrelated ("what is the weather"). It replies with the help line listing what it can answer, it must NOT invent an answer.

## C. Rewatch counter

1. Open a fully or partly watched show. Under the action buttons there is a row: Watched through ×1 with − and + plus five stars.
2. Set a show you have genuinely rewatched to ×2 or ×3. The − button disables at ×1.
3. Open a watched film from the Films tab. Same row appears (unwatched films must NOT show it).
4. Open your stats. Genre bar hours have grown for that title's genres. Tap the bar: the drill-down list shows the title with a ×N chip and multiplied minutes.
5. Watch activity by month is UNCHANGED by rewatch counts and its caption says rewatches carry no dates.
6. Profile headline TV time has grown. Episodes watched count has NOT (distinct episodes stay distinct, by design).
7. Download a backup, delete everything, restore. Rewatch counts and ratings survive.

## D. Ratings

1. Star row on watched shows and watched films. Tap 4 stars, reopen, still 4. Tap the 4th star again, rating clears.
2. After rating a few titles, ask your stats "best rated": your rated titles come back with scores.

## E. Stats modal header (bug fix)

1. Switch to LIGHT theme, open Your stats. The header must be fully legible: eyebrow line, 📊 Your stats title, tap hint, all dark ink on a soft gold wash with a gold underline. Previously the title merged into the background.
2. Dark theme: same header, still legible.

## F. Month drill-down label (bug fix)

1. In Your stats, tap a month point that includes a watched film. The film row now says "film · 1h 40m" style, NOT "1 ep".
2. Show rows still say "N eps".

## G. Your data behind a button

1. Profile YOUR DATA section now has one button: Manage your data. Import, backup, restore, TMDB key and Delete everything are NOT directly on the Profile any more.
2. Tap it: a modal opens with all five actions. Import and Restore open the wizard; Delete everything still asks for confirmation.
3. The taste summary, ask box and everything else still work after a backup/restore round trip.

## H. Regression sweep (5 minutes)

1. Search, add a show, tick an episode, Tonight card updates.
2. Ask box on Explore still answers with 5-7 picks.
3. Taste summary on Profile still renders.
4. Import wizard untouched: re-run any sample CSV from sample-data if in doubt.
5. Light/dark toggle, watchlist section, archived section all as before.
