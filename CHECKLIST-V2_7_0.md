# Browser checklist: v2.7.0 (genre rails, AI cost gate, colophon, PWA)

Run on the deployed site after the drag-and-drop upload finishes and Vercel shows the new deployment. Do these in order; A and B prove this session's two big changes.

## A. Genre rails (Explore)

1. Open Explore. IMPORTANT: your old rails cache predates the genre change, so the section regenerates once. Expected: skeleton cards, then MULTIPLE rows titled "BECAUSE YOU WATCH <GENRE>" (up to 4 rows), each with 4-5 cards.
2. Under each row heading there is a basis line naming REAL titles from your library ("Built on X, Y and Z from your library"). Confirm every named title is genuinely yours. This line is built locally; if a title you never watched appears here, that is a bug, report it verbatim.
3. No picked card is a title already in your library.
4. Tap a card: the preview modal opens; nothing is added without the explicit add tap.
5. The fineprint under the rails states the refresh policy (5 days, meaningful new logging).

## B. The cost gate (rails)

1. Immediately mark one more episode watched on any show, return to Explore. Expected: the SAME rails as before, no skeleton reload, no new generation. Before v2.7.0 this would have burned an API call.
2. Reload the page fully. Still the same rails, instantly, from cache.

## C. The cost gate (taste summary)

1. Open Profile. Your existing taste summary shows (possibly regenerated once if its cache predates v2.7.0; that is expected).
2. After the episode you ticked in B1, the summary must NOT show "Reading your library" again. Same text, instantly.
3. The fineprint under the summary states the same refresh policy as the rails.

## D. Colophon

1. On Profile, the bottom fineprint now ends with "How this was made". Tap it.
2. A dedicated page opens at #/colophon: the method (directed by you, built with Claude, audit-first), what it produced, the repo link. The back link returns to Profile.
3. Browser back button also leaves the page correctly.

## E. PWA install

1. On your phone, open the site in the browser, choose Add to Home Screen (Share sheet on iOS, browser menu on Android). Expected: a TellyLog icon (dark tile, yellow TV glyph) installs.
2. Open the installed app: it launches standalone, no browser chrome, dark splash.
3. With the app opened once, turn on aeroplane mode and reopen it. Expected: the app shell loads (your shows render from localStorage). Posters may be missing offline; that is by design, images are never cached.
4. Turn the network back on, reload: everything returns.

## F. Regression spot checks

1. Ask box still answers a question (this proves /api/ask still works after the rails contract change).
2. Voice insight ("what is my most watched show") still answers instantly with no network spinner.
3. Stats modal opens, charts render, drill-downs click through.
4. Manage your data: export downloads, the file restores.
5. Light mode: flip it, check the stats header is still legible, flip back.

Report failures with the exact section letter and step number.
