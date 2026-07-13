# CHECKLIST v2.7.6, the browser verification round

Supersedes CHECKLIST-V2_7_4.md for the two new UX changes; the v2.7.4 items still stand for anything not re-walked. Run after the Vercel build goes green. Deleted files: NONE. Deploy is a `git push` to main, so nothing to drag.

## 1. Add to your phone, the tag (Shows and Films)

- [ ] Shows tab: an underlined, highlighted "📱 Add this app to your phone" tag sits at the top, above the Watchlist button.
- [ ] Films tab: the same tag sits at the top, above the Watch list / Watched toggle.
- [ ] Tap the tag from either tab: you land on the Profile page and the "Add to your phone" instructions are ALREADY open, showing the iPhone and Android steps. No popup.

## 2. Add to your phone, the section (Profile)

- [ ] Open Profile directly (bottom nav): the "ADD TO YOUR PHONE" section shows a "📱 How to add to your phone" button that is CLOSED by default (steps hidden).
- [ ] Tap it: the steps expand in place under the button, chevron flips. Tap again: they collapse. This is the same open-and-close behaviour as the Archived section on Shows.
- [ ] Read the steps: iPhone/Safari (Share, then Add to Home Screen) and Android/Chrome (⋮ menu, then Add to Home screen / Install app) both read correctly, and the last line notes the in-app-browser case.
- [ ] Optional, the real thing: follow the steps on your phone and confirm a TellyLog icon lands on the home screen and opens full screen.

## 3. Clear button in the search bars

- [ ] Explore search: type "suits". A small ✕ appears just left of the mic. Tap it: the field empties in one go, the ✕ disappears, and the keyboard stays open (no need to tap back in).
- [ ] Explore "Ask what to watch": type anything. Same ✕, same one-tap clear.
- [ ] Profile "Ask your stats": type anything. Same ✕, same one-tap clear.
- [ ] No double ✕: the browser's own little clear icon should not show alongside ours on the search fields.

## 4. General regression

- [ ] Shows tab still shows Tonight, Up next, history, Watchlist button. Films tab still toggles Watch list / Watched. Nothing shifted or broke from the new tag row.
- [ ] Stats, data and watchlist modals still open. One episode tick still round-trips. Explore trending and rails still load.
