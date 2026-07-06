# Logline

A self-hosted replacement for the TV Time app, built when that app announced its shutdown. Tracks TV shows episode by episode, keeps a film watchlist, shows upcoming episodes for tracked shows and rebuilds the classic TV Time profile stats (total TV time, episodes watched). Imports TV Time, Netflix, Letterboxd and IMDb exports so years of watch history are not lost.

Formerly TellyLog. All data lives in your browser. No accounts, no tracking.

## Features

- **Shows tab**: a Tonight card with the single most likely next episode, an Up Next queue, a "Still watching?" keep-or-drop bucket for shows untouched for 30+ days and full watched history
- **Show pages**: synopsis, genres, year range, TMDB rating, cast, GB streaming availability (data by JustWatch via TMDB), trailers, episode stills with one-line overviews, air and watched dates, per-season progress and a pinned next-unwatched highlight
- **Episode tracking**: check off single episodes, whole seasons or entire shows; progress bars per show and per season
- **Upcoming tab**: future episodes of tracked shows grouped by day
- **Films tab**: watchlist and watched list with runtime stats
- **Explore tab**: search any show or film plus weekly trending, powered by TMDB. An optional natural-language "ask what to watch" box appears when the owner deploys the serverless functions with an Anthropic API key (see VERCEL-SETUP.md)
- **Profile stats**: total TV time in months / days / hours and episode count, matching TV Time's profile card
- **Multi-source import**: one wizard handles TV Time, Netflix viewing activity, Letterboxd and IMDb CSV exports, auto-detected from the file's headers. Show names are matched against TMDB with a similarity score; confident matches are accepted automatically and ambiguous ones ask for confirmation
- **Backup and restore**: one-click JSON export of everything, restorable on any machine. TellyLog-era backups restore unchanged
- **Themes**: dark by default, light available in Profile

## Setup

You need one thing: a free TMDB API key.

1. Create an account at [themoviedb.org](https://www.themoviedb.org/signup)
2. Go to Settings → API → Create → Developer, fill in the short form (personal use is fine)
3. Copy the **API Key (v3 auth)**

Run locally:

```bash
npm install
npm run dev
```

On first load the app asks for your TMDB key. The key is stored in your browser's localStorage only. It is never written into the code and never sent anywhere except directly to TMDB.

## Deploying

The app is a Vite build deployed on Vercel. Connect the repo, accept the Vite preset and deploy. The optional serverless functions in `api/` activate automatically once the environment variables described in `VERCEL-SETUP.md` exist; without them the deployed app behaves exactly like the static build.

## Importing your history

Open Profile → Import TV Time export and pick any of these files. The wizard detects the source automatically:

**TV Time** (Settings → export, or via their support email). Full episode-level history with dates, with a column-mapping step before matching.

**Netflix** (Account → Profile → Viewing activity → Download all). Netflix only exports episode *names*, not numbers, so Logline resolves each name against TMDB's episode list per season. Titles like "Dark: Season 1: Secrets" become tracked episodes; plain titles become films.

**Letterboxd** (Settings → Data → Export). watched.csv logs films with dates, watchlist.csv fills the Films watchlist. Export years disambiguate remakes.

**IMDb** (Your Ratings → Export). Films are logged as watched; TV series are added with no episodes marked because the export carries no episode-level data.

**Logline backup** (.json) restores everything from another device. Backups made under the TellyLog name work identically.

Sample files for every source live in `sample-data/`.

## Architecture

```
index.html               app shell
src/main.jsx             React entry
src/styles.css           two themes via CSS custom properties, 680px column
src/lib/util.js          pure functions: CSV parser, column guesser, name
                         similarity, date parsing, duration formatting,
                         provider and video shaping
src/lib/store.js         all state + persistence (localStorage), selectors,
                         import merge, JSON backup and restore
src/lib/tmdb.js          TMDB v3 client with in-memory cache and a
                         concurrency limiter
src/lib/ai.js            client for the optional serverless ask feature
src/components/          React components, one file per surface
src/hooks/useStore.js    useSyncExternalStore bridge to the store
api/                     Vercel serverless functions: health probe, TMDB
                         proxy, LLM ask endpoint (all optional, all inert
                         without their env vars)
tests/                   node assert suites for util and store plus a
                         vitest + jsdom smoke suite
```

Run the tests:

```bash
npm test
```

## Privacy

- All watch data is stored in `localStorage` under the key `tellylog:v1` (the key predates the rename and is kept so existing data survives)
- Network calls go to `api.themoviedb.org` for metadata, `image.tmdb.org` for posters and `img.youtube.com` for trailer thumbnails
- If the owner enables the ask feature, questions plus a compact summary of the library go to the owner's own serverless endpoint and from there to Anthropic. The box does not exist otherwise
- Clearing browser data deletes everything, so use Profile → Download backup periodically

## Credits

Show and film metadata from [TMDB](https://www.themoviedb.org/). This product uses the TMDB API but is not endorsed or certified by TMDB. Streaming availability data by [JustWatch](https://www.justwatch.com), licensed through TMDB.

Interface design inspired by the TV Time app.
