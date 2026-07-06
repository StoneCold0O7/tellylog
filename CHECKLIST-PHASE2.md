# Browser checklist: Phase 2 proxy flip + voice + clickable providers (v2.3.1)

Run on the deployed site after uploading this build. No storage migration; existing data is untouched. Precondition: /api/health returns {"ok":true,"llm":true,"tmdbProxy":true} (verified last session).

## Do this FIRST: the direct proxy check (30 seconds, settles the v2.3.0 failure)
- [ ] Open tellylog-3d2u.vercel.app/api/tmdb?p=configuration in the browser
- [ ] Expected: a JSON blob of TMDB image sizes and base URLs. That means the proxy works end to end
- [ ] If instead you see a message about "TMDB rejected the server key": the TMDB_API_KEY env var VALUE in Vercel is wrong (must be only the 32-character v3 key). Fix the value, redeploy, reopen the URL. The app falls back to your browser key in the meantime, so nothing is broken for you while you fix it

## The visitor-first-run test (the point of Phase 2)
- [ ] Open the site in a PRIVATE/incognito window (no localStorage, no key). You should land straight on "What are you watching?" with a working search box. NO key-entry screen, ever
- [ ] Type a show name in that incognito window: results appear (proving metadata now flows through the server proxy with no browser key)
- [ ] Add a show, open it, expand a season: episode names and stills load
- [ ] Explore tab in incognito: trending shows and films load
- [ ] Your normal window (with your old key still stored): everything works exactly as before. Your data is untouched
- [ ] DevTools → Network (normal or incognito): metadata requests go to /api/tmdb?p=... and no request URL contains api_key

## Fallback (nothing to click, just understand it)
- [ ] If the TMDB_API_KEY env var were ever removed, the app would fall back to browser keys and the key screen, exactly as pre-Phase-2. Do not test this by deleting the env var; the two new automated tests pin it

## Settings copy
- [ ] Profile → TMDB API key: the modal now notes the site has a built-in connection and a personal key is optional

## Clickable streaming providers
- [ ] Open any show or film detail view with a WHERE TO WATCH · GB row
- [ ] Provider icons now show a pointer cursor and an accent outline on hover
- [ ] Tapping any provider icon opens that title's watch page (TMDB's JustWatch-powered page) in a new tab, where each service links onward
- [ ] The credit line now reads "Tap a service to open this title's watch page. Watch data powered by JustWatch"
- [ ] Note what this deliberately is NOT: a tap on the Netflix icon does not land inside the Netflix app on this exact title. TMDB provides one watch-page link per title, not per-provider deep links. See the session log for the decision

## Voice search (Chrome, Edge or Safari; the button is absent in Firefox by design)
- [ ] Explore tab: a mic icon sits at the right edge of the search bar
- [ ] First-run screen (incognito): same mic in the search bar
- [ ] Tap the mic: the browser asks for microphone permission (first time only), the button turns accent-yellow and pulses
- [ ] Say a show name: the transcript lands in the box and the search runs
- [ ] Ask-what-to-watch box: its own mic FILLS THE FIELD ONLY; you still press Ask (so a misheard question never spends API credit)
- [ ] Tap the mic while it is listening: it stops
- [ ] Optional: open the site in Firefox: no mic button anywhere, no errors

## Regression spot checks
- [ ] Tonight card, Still watching?, archive section, films watchlist/watched: all as before
- [ ] Import watch history: opens and parses a CSV as before (logic untouched)
- [ ] Theme toggle still flips dark/light
- [ ] Ask box still answers with picks
