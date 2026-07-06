# TellyLog: Handover for the next sessions (post Phase 1)

Last updated: after Phase 1 verification, July 2026. Take this file plus the codebase zip into the next session. Style rules for all output: no em dashes, no ", and" (drop the Oxford comma), confidence tags [Certain] / [Likely] / [Guessing] on factual claims.

---

## 1. Current state

- Phase 0 (React port) and Phase 1 (Tonight-first redesign) are complete, deployed to tellylog-3d2u.vercel.app and verified by the author against CHECKLIST-PHASE1.md. One post-verification hotfix landed: the import dropzone rendered inline and overlapped the source list; fixed in CSS only.
- Test state: 60 automated checks. 32 util, 21 store, 7 jsdom smoke. Production build clean. [Certain]
- Schema: `tellylog:v1`, Phase 1 added three additive fields (show.keptAt, settings.theme, settings.gridSeen). Legacy backups restore cleanly, covered by a test. Import wizard logic untouched since Phase 0. [Certain]
- Author is non-technical: all tests run inside the build session, author verifies via browser checklist on the deployed site, updates GitHub by dragging the extracted folder onto the upload page (queued list must show paths with slashes).

## 2. Revised sequencing (Phase 1.5 inserted)

The author flagged after Phase 1 that the UI, while redesigned, still shares the standard tracker grammar and can feel sluggish or rudimentary in places. Diagnosis: layout grammar (bottom tabs, poster rows) is shared by every tracker by convention; the fixable part is perceived performance (no loading skeletons, images pop in late, layout shifts) plus missing content depth (bare episode lists). Hence:

**Phase 1.5: Depth and polish (next session).** No AI, no proxy. Contents:
1. Episode one-line descriptions plus episode still images in the season accordion. Zero extra API calls: the tvSeason payload already returns `overview` and `still_path` per episode; the app fetches it today and discards both. [Certain]
2. Episode overview line on the Tonight card (same payload). [Certain]
3. Trailers and behind-the-scenes clips on the show modal via the TMDB videos endpoint (`/tv/{id}/videos`), rendered as YouTube links or thumbnails. This is the API route the revamp spec chose when it cut web scraping; scraping stays cut on legal and reliability grounds. [Certain]
4. Perceived-performance pass: skeleton placeholders for poster grids and rows, image fade-in on load, reserved image dimensions to stop layout shift, instant tab-switch feel.
5. Author-identified robotic screens: the author brings 2 or 3 screenshots of the moments that feel most rudimentary, plus (optionally) the TV Time episode-page screenshots that did not upload last time.
6. Regression rule unchanged: wizard logic and store schema untouched except additive fields; all suites green before delivery.

**Phase 2: the LLM "ask us what to watch" box.** The single AI feature and the project headline. Stand up the Vercel serverless proxy (moves the TMDB key server-side too, which finally unlocks the true under-30-second stranger first run), wire the natural-language box in Explore, activate only once real watch activity exists. Confirmed as the next phase after 1.5.

**Phase 3: README and decision log.** The primary portfolio deliverable. Written last.

Full product: shippable app after Phase 2, portfolio-complete after Phase 3. Three sessions remain on this plan. [Likely]

## 3. Open decisions for the author

1. **Real TV Time export verification.** The checklist's sample-CSV import passed. Confirm whether the full real export (target 11,413 episodes, 9 months 15 days 20 hours) has now run on the live site. This is the project's stated success criterion. If not yet run, run it before or during Phase 1.5.
2. **Naming.** The author asked for edgier, globally readable alternatives to TellyLog. Counterpoint on record: the author's own portfolio principle favours UK-relatable projects, and "Telly" is distinctly British, which is a feature for a UK hiring audience, not a bug. If renaming anyway, shortlist: Logline (film-industry term for a one-line synopsis, doubles as "log"), Kino (cinema across German, Russian and Nordic slang), NextEp, Episodic, Seen. Every candidate needs a trademark and domain check before adoption; several have existing products nearby. [Certain that checks are required] If renamed: do it in one commit immediately before Phase 3 so the README is written once under the final name; accept that the Vercel URL changes.

## 4. Prompt to paste into the next session

---
I am continuing TellyLog, a React TV and film tracker deployed at tellylog-3d2u.vercel.app. I am attaching the current codebase zip and HANDOVER-NEXT.md. Read both fully before responding.

This session is Phase 1.5 only, as defined in section 2 of the handover: episode descriptions and still images in the season accordion, an episode overview line on the Tonight card, trailers and BTS clips via the TMDB videos endpoint, a perceived-performance pass (skeletons, image fade-in, no layout shift) and fixes for the specific screens I flag as feeling rudimentary. No AI features, no serverless proxy. Do not pull Phase 2 forward.

I am attaching screenshots of the screens that feel most robotic or sluggish, plus my old TV Time episode-page screenshots for reference. [Attach them, plus the real TV Time export result if run.]

Before writing code: confirm you have read everything with a 5-line summary of current state, load the frontend-design skill, give me the proposed changes in plain language for approval first and flag anything that risks the import wizard or the localStorage schema. I am non-technical: you run all tests, I verify through the browser on the deployed site. End with a zip, a list of any deleted files and a browser checklist. Follow the project style rules: no em dashes, no ", and", confidence tags [Certain] / [Likely] / [Guessing].
---
