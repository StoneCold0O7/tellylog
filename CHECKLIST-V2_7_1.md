# Browser checklist: v2.7.1 (UNDEFINED fix, watchlist relocation, profile film browser)

Run on the deployed site after upload. Short round: three changes.

## A. The UNDEFINED fix (Explore)

1. Open Explore. THIS time the rails genuinely regenerate once (the fix discards the old-shape cache): skeletons, then rows headed "BECAUSE YOU WATCH <A REAL GENRE>". If any heading still says UNDEFINED after a full reload, report it with a screenshot.
2. The basis line under each row now reads "Built on X, Y and Z from your library" naming YOUR titles. The old prose-style basis ("Building on your interest in...") should be gone; its presence means the old cache survived, report it.
3. Rows have 4-5 cards each, none already in your library.
4. Mark an episode watched, return to Explore: same rails, no reload. The gate holds on the NEW cache.

## B. Watchlist relocation (Shows)

1. Open the Shows tab. Top right, above Tonight: a "🔖 Watchlist (n)" button with your real count. No scrolling needed.
2. Tap it: a modal lists your saved shows. Start moves a show into the queue and opens it; ✕ removes it.
3. The old WATCHLIST section at the bottom of the tab is GONE. ARCHIVED remains where it was.
4. Save a new show to the watchlist from any preview: the button count updates.

## C. Profile film browser

1. On Profile, the library section now has two toggles: Shows | Films and Posters | List.
2. Flip to Films: your watched films, newest first, in posters. Flip to List: year, runtime and your rating where set.
3. Tap any film: its preview opens.
4. Shows behave exactly as before in both views.

## D. One regression check

1. Profile taste summary still shows instantly from cache (the gate change touched shared code).
2. Ask box answers a question.

Report failures with section letter and step number.
