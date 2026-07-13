# SESSION LOG v2.7.7, the three post-verification fixes (13 July 2026)

Same-day follow-up to v2.7.6. The owner verified v2.7.6 on his real phone and reported three things: the tag should read as a how-to, tapping it should land ON the install section rather than at the top of Profile, and the Films tab pushed the bottom nav up while every other tab sat flush. All three fixed and verified live in a local preview. No schema change, ImportWizard untouched.

## 1. Tag reworded

`📱 Add this app to your phone` became `📱 How to add this app to your phone` on both the Shows tab and the Films tab. Wording only.

## 2. Tag scrolls to the section, not just to Profile

`go('profile', 'install')` already opened the inline fold-out, but `go()` ends with `window.scrollTo(0, 0)`, so it landed at the top of Profile with the section far below. ProfileTab now holds a ref on the ADD TO YOUR PHONE block and, when it mounts with the install nav-focus, scrolls that block to the top of the viewport. A `scroll-margin-top` on the anchor clears the sticky brand bar. A plain Profile visit (nav button) passes no focus, so it stays at the top with the section collapsed, unchanged.

Two implementation notes earned by verification, both on the record because they are easy to reintroduce. FIRST: the scroll must not run inside `requestAnimationFrame`. rAF callbacks are paused whenever the tab is not foregrounded, so the jump silently never fired; `setTimeout` runs regardless of visibility. SECOND: `scrollIntoView({ behavior: 'smooth' })` is a no-op in some embedded browsers (it did nothing in the preview, reduced-motion off), so the jump uses `behavior: 'auto'` (instant). A reliable jump beats a pretty animation that sometimes does nothing.

## 3. Films no longer pushes the tab bar up

Diagnosed, NOT caused by v2.7.6: the bottom tab bar is `position: fixed; bottom: 0`, so it cannot be moved by content in a normal browser (measured: zero gap below it on Films in the preview). The real cause is that the Films watchlist was the owner's only tab short enough to be non-scrollable (measured 621px against an 812px viewport), and mobile Safari keeps its bottom toolbar expanded on a non-scrollable page, which shifts a fixed bottom bar up; every other tab has enough content to scroll, so Safari collapses the toolbar and the bar sits flush. Fix: `.view` min-height raised from `70vh` to `100vh`, so a short tab fills the screen and scrolls like the rest. After the change the Films page measures 865px (scrollable), matching Shows (825px). This is the only viewport-specific behaviour I could not fully reproduce in the desktop preview, so the final on-device look is the owner's checklist item; the mechanism (scrollability parity) is verified.

## 4. Test, build and verification

Full suite green: 112 node (40 + 63 + 9), 26 of 26 vitest (one flaky vitest worker exit on the first run, clean on re-run). `vite build` clean, 67 modules. Verified live against a seeded 2-film watchlist: the reworded tag on both tabs, the tap landing scrolled to the section with the fold-out open (Films and Shows paths), the plain nav visit still landing at the top collapsed, the Films page now scrollable to parity with Shows. Zero console errors. The preview browser cannot show mobile Safari's toolbar, so the Films look on the real device is confirmed by the owner.

## 5. Files

Changed: `src/components/ProfileTab.jsx` (scroll-to-section effect, ref, anchor wrapper), `src/components/ShowsTab.jsx` and `src/components/MoviesTab.jsx` (tag wording), `src/styles.css` (`.view` min-height, `.install-anchor` scroll-margin), `package.json` (2.7.7). New docs: SESSION-LOG-V2_7_7.md, CHECKLIST-V2_7_7.md. Deleted: NONE. ImportWizard untouched, schema unchanged.
