# Session log: Phase 1.5 + Phase 2 scaffold + rename to Logline

Date: 6 July 2026. This file chronicles the whole session from the first message, as requested. It feeds the Phase 3 decision log.

## Message 1: the brief as submitted

The author opened with the Phase 1.5 handover prompt but modified it in four ways:
1. Pack Phase 1.5 AND Phase 2 into one session, including AI features, serverless proxy AND Supabase
2. Real TV Time export: still not done, park it
3. More-like-this rail on the show modal: approved
4. Rename to Kino ("more mysterious" than Logline)

Plus: build without waiting for further prompts unless structural or permissions issues appear and produce this session log.

## Message 2: the audit (Claude stopped before code)

Claude declined to build as briefed and gave four objections:

1. **Supabase rejected.** Never part of Phase 2. It was deliberately scoped out with rationale so the exclusion itself becomes a README talking point about cost-vs-value judgment. A single-user localStorage app has no functional need for it; adding it deletes the talking point. [Certain]
2. **Full LLM activation contradicts the project's own logic.** The documented principle: the ask feature is only meaningful once real watch history exists. The author confirmed in the same message that the real export remains undone. An ask box over a near-empty library is demo theatre, the exact framing the project avoids. [Likely]
3. **Permissions blocker.** The proxy and the ask endpoint need env vars only the author can set in the Vercel dashboard (ANTHROPIC_API_KEY with billing, TMDB_API_KEY). This triggered the author's own stop-for-permissions clause. [Certain]
4. **Kino rejected with evidence.** A live check found kino-tv.co, an app marketed as the TV Time alternative with an AI describe-it-we-find-it feature: the exact product category and the exact planned headline feature under the exact proposed name. Separately Kino by Lux won Apple's iPhone App of the Year 2024, saturating the name. Kino also abandons the UK-relatable rationale that justified TellyLog. Logline recommended instead. [Certain on the collisions]

Verified state at that point: 60 tests passing locally (32 util, 21 store, 7 smoke), production build clean, schema tellylog:v1 intact, TMDB key stored client-side in settings.apiKey.

Proposed compromise: Phase 1.5 in full plus Phase 2 as dormant scaffolding gated behind env vars, Supabase stays cut, name Logline.

## Message 3: the author's decision

"Scaffold. Logline. Go." Plus a request for this session log.

## The build

### Rename to Logline
- Brand in top bar and onboarding, index.html title, package.json name (v2.1.0), backup filename now logline-backup-*.json, wizard and restore copy updated, file header comments updated
- **The localStorage key stays `tellylog:v1`.** Renaming it would orphan every user's existing data or force a migration for zero user benefit. The key is an internal identifier nobody sees. Old TellyLog backups restore unchanged, stated in the wizard copy. [Certain]
- The Vercel domain rename is the author's optional dashboard action, documented in VERCEL-SETUP.md with the per-domain localStorage warning

### Phase 1.5, section 2a: show modal enrichment
- About block: genre chips, synopsis, year range in the hero meta, TMDB rating as ★ x.x
- Correction to the handover's claim of "zero extra API calls" for the About block: the persisted show record never stored synopsis/genres/rating, so for shows added before this build the modal refetches tvDetails once per session (served from the in-memory cache thereafter). One cached call, not zero. The schema was NOT extended to persist these, keeping the no-new-fields constraint. [Certain]
- Cast strip via /tv/{id}/credits, 12 people, photos, character names
- Where to watch, GB region, via /tv/{id}/watch/providers: de-duped across stream/free/ads/rent/buy with a kind label per provider and the required "powered by JustWatch" credit. Logos are informational; TMDB provides no deep links. Handled by a new pure helper flattenProviders (tested)
- Trailers and clips via /tv/{id}/videos: YouTube only, trailers before teasers before BTS, official first, capped at 6, thumbnails via img.youtube.com linking out. New pure helper pickVideos (tested)
- More-like-this rail via /tv/{id}/recommendations at the bottom of the modal, labelled MORE LIKE THIS · FROM TMDB per the approved honest-labelling condition. Tapping a poster uses the app's existing openShow contract, which tracks the show and toasts; a fineprint line states this
- Every enrichment fetch fails soft: a section that cannot load does not render

### Phase 1.5, section 2b: episode depth
- Season accordion rows rebuilt: still image (96x54, reserved dimensions), episode name, two-line overview, air date, watched date where logged. Watched dates come from a new store helper watchedMapFor building one map per modal instead of scanning the log per row (tested)
- Episode overview line added to the Tonight card via the upgraded shared episode cache (now name, overview, still, airDate per episode; one tvSeason fetch fills a whole season)
- Season headers gained a mini progress bar beside the existing seen/count numbers, which already satisfied the handover's 29/76 requirement from Phase 1
- NEXT UP highlight pinned above the seasons with its own check button; the season containing that episode opens pre-loaded

### Phase 1.5, section 2c: perceived performance
- Shimmering skeletons: Explore trending grid, season episode rows, modal about block
- FadeImg component: every poster, still, cast photo, provider logo and video thumbnail now fades in on load with dimensions reserved by CSS, eliminating layout shift
- Tonight card backdrop preloads and fades in instead of popping
- All animation respects the existing prefers-reduced-motion kill switch

### Phase 2 scaffold (dormant by design)
- /api/health: returns booleans for key presence, never the keys
- /api/ask: POST question + library summary, calls the Anthropic Messages API server-side, JSON-constrained response with picks, input and output caps, 503 without the env var
- /api/tmdb/[...path]: server-side TMDB proxy with a path allowlist and an hour of edge caching, 503 without its env var, unused by the client until the Phase 2 session flips tmdb.js
- Client: src/lib/ai.js probes /api/health once per load; AskBox in Explore renders nothing unless llm:true. Picks come back resolved against TMDB search so they render as the same add-able cards used everywhere. Library context comes from a new store helper librarySummary, capped at 30 shows plus film lists (tested)
- Known gap, on record: no per-user rate limiting on /api/ask. Documented in VERCEL-SETUP.md as a Phase 2 item. [Certain]

### Tests and build
- Suites grew from 60 to 72: util 32→40 (yearRange x4, pickVideos x2, flattenProviders x2), store 21→25 (watchedMapFor, librarySummary x3), smoke 7 unchanged and passing
- Production build clean: 204 kB JS (61.6→64.7 kB gzip), 21.7 kB CSS. The increase is the modal enrichment plus the ask scaffold. [Certain]

### Constraints honoured
- ImportWizard logic untouched; only two display strings and one error string changed for the rename
- tellylog:v1 schema untouched, zero new persisted fields, legacy restore test still green
- No TMDB or Anthropic key anywhere in the repo
- Scraping stays cut; every new data source is a licensed TMDB endpoint

## Deleted files

None.

## Decisions still open after this session

1. Real TV Time export verification (author parked it again this session; it remains the stated success criterion) [Certain it remains outstanding]
2. Whether and when to add the env vars that wake the ask box (owner action, see VERCEL-SETUP.md)
3. Vercel project rename to match Logline (optional, has a data-locality consequence documented in VERCEL-SETUP.md)
