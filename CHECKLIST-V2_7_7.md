# CHECKLIST v2.7.7, the three post-verification fixes

Supersedes CHECKLIST-V2_7_6.md. Run after the Vercel build goes green. Deleted files: NONE. Deploy is a `git push` to main.

## 1. The tag reads as a how-to

- [ ] Shows tab and Films tab: the tag now reads "📱 How to add this app to your phone" (underlined, highlighted, at the top).

## 2. The tag lands ON the section

- [ ] Tap the tag from Shows or Films: you land on Profile scrolled straight down to the ADD TO YOUR PHONE section, already open, with the iPhone and Android steps in view. You should NOT have to scroll down yourself.
- [ ] Open Profile the normal way (bottom nav): it opens at the TOP, and the ADD TO YOUR PHONE section is CLOSED until you tap it. This is the opt-in case, unchanged.

## 3. The Films tab no longer pushes the bottom bar up (the main fix to eyeball)

- [ ] Open Films with a short watchlist (a couple of items). The bottom nav row (Shows/Upcoming/Films/Explore/Profile) sits at the very bottom, the SAME height as on Shows, Upcoming, Explore and Profile. It should no longer float up with a gap beneath it.
- [ ] Flip between all five tabs and watch the bottom row: it should stay put, not jump, on any of them.
- [ ] A short Films list can now be scrolled a little even with only a couple of items. That is expected and is what keeps the bar consistent with the other tabs.

## 4. General regression

- [ ] Films Watch list / Watched toggle still works, films still open, mark-watched and remove still work.
- [ ] Shows Tonight, Up next, history and Watchlist button all still there. Stats, data and watchlist modals still open. Explore search, ask box and clear ✕ still work.
