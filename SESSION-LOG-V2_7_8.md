# SESSION LOG v2.7.8, visitor analytics (13 July 2026)

First change after the project was marked complete. The owner, having shipped the LinkedIn post, wanted to know how many people visit and use the app. Because TellyLog has no backend and no accounts, the only measurable signal is anonymous traffic and engagement; you can never see who a visitor is or what they tracked, which is a direct consequence of the privacy design, not a gap. This round adds that anonymous measurement.

## 1. What shipped

Vercel Web Analytics (`@vercel/analytics`, chosen over Cloudflare/Plausible/GA4 because it is native to the Vercel host, cookie-free so it needs no consent banner in the UK, and free on Hobby up to a monthly event cap). The `<Analytics/>` component mounts in `main.jsx` alongside `<App/>` and auto-tracks page views. Four custom engagement events fire through `track()`:

- `title_added` (`{kind:'tv'|'movie'}`) in `ResultCard.jsx`, the shared add chokepoint, so search, trending, rails and ask-pick adds all count. The core "actually using it" signal.
- `explore_opened` and `install_help_opened` in `App.jsx` `go()` (the latter only when the add-to-phone tag passes `focus:'install'`), so tab-level discovery and the new install feature are measured in one place.
- `ai_ask` in `AskBox.jsx` `submit()`, so AI usage is visible.

Events carry no watch data, only the event name and, for adds, the tv/movie kind.

## 2. The honesty copy change

Adding any analytics makes the old "Nothing is uploaded anywhere" line untrue, so the Profile fineprint and the DataModal fineprint were rewritten to: "Your watch history is stored in this browser only and is never uploaded. TellyLog counts anonymous visits with cookie-free analytics; nothing personal is collected. Metadata comes from TMDB." ImportWizard's separate line is about import files, is still accurate, and was left untouched (it is also under the do-not-touch rule). The owner approved this wording before the push.

## 3. Verification

Tests green (112 node, 26 vitest), `vite build` clean (69 modules, bundle +~4KB gzip for the analytics client). Verified live in a local dev preview: the Analytics component mounts and logs page views, and `explore_opened` plus `install_help_opened` fired on real clicks (dev mode logs every event to the console). `title_added` and `ai_ask` use the identical `track()` wiring but need a live TMDB add and the live AI box, which local dev lacks, so they exercise on the deployed site. No console errors; the honesty copy renders.

## 4. Owner action required, then it is on

Analytics collects NOTHING until the owner enables Web Analytics in the Vercel dashboard (project, Analytics tab, Enable). The deployed `<Analytics/>` requests `/_vercel/insights/script.js`, which Vercel serves only once the feature is enabled; before that the request 404s harmlessly and no data flows. CHECKLIST-V2_7_8.md carries the enable steps and what to look for (Visitors, Referrers for LinkedIn, Events). No schema change, ImportWizard untouched.
