# TellyLog

A self-hosted replacement for the TV Time app, built when the app announced its shutdown. Tracks TV shows episode by episode, keeps a film watchlist, shows upcoming episodes for tracked shows and rebuilds the classic TV Time profile stats (total TV time, episodes watched). Imports your original TV Time CSV export so years of watch history are not lost.

All data lives in your browser. No accounts, no server, no tracking.

![Built with vanilla JavaScript](https://img.shields.io/badge/dependencies-zero-brightgreen) ![License MIT](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Shows tab**: Watch Next queue, a "Haven't watched for a while" bucket for shows untouched for 30+ days and full watched history, in the TV Time visual style
- **Episode tracking**: check off single episodes, whole seasons or entire shows; progress bars per show
- **Upcoming tab**: future episodes of tracked shows grouped by day (Yesterday / Today / weekday / Later with day counts)
- **Films tab**: watchlist and watched list with runtime stats
- **Explore tab**: search any show or film plus trending lists, powered by TMDB
- **Profile stats**: total TV time in months / days / hours and episode count, matching TV Time's profile card
- **Multi-source import**: one wizard handles TV Time, Netflix viewing activity, Letterboxd and IMDb CSV exports. The source is auto-detected from the file's headers. Show names are matched against TMDB with a similarity score; confident matches are accepted automatically and ambiguous ones ask for confirmation
- **Backup and restore**: one-click JSON export of everything, restorable on any machine

## Setup

You need one thing: a free TMDB API key.

1. Create an account at [themoviedb.org](https://www.themoviedb.org/signup)
2. Go to Settings → API → Create → Developer, fill in the short form (personal use is fine)
3. Copy the **API Key (v3 auth)**

Then run the app:

**Option A, no tooling at all**: open `index.html` in a browser. The app is plain script tags, so it works from `file://`.

**Option B, local server** (recommended, avoids any browser quirks with local files):

```bash
cd tellylog
python3 -m http.server 8000
# open http://localhost:8000
```

On first load the app asks for your TMDB key. The key is stored in your browser's localStorage only. It is never written into the code and never sent anywhere except directly to TMDB.

## Deploying to GitHub Pages

The repo is a static site, so Pages hosts it as-is:

1. Push the repo to GitHub
2. Repository Settings → Pages → Source: `main` branch, root folder
3. Visit `https://<username>.github.io/<repo>/`

Each visitor (including you on another device) enters their own TMDB key on first load.

## Importing your history

Open Profile → Import TV Time export and pick any of these files. The wizard detects the source automatically:

**TV Time** (Settings → export, or via their support email if the in-app option is gone). Full episode-level history with dates. You get a column-mapping step to check the auto-detected columns before matching.

**Netflix** (Account → Profile → Viewing activity → Download all). Netflix only exports episode *names*, not numbers, so TellyLog resolves each name against TMDB's episode list per season. Titles like "Dark: Season 1: Secrets" become tracked episodes; plain titles become films. A few unusually named episodes may not resolve and are reported at the end.

**Letterboxd** (Settings → Data → Export). Select watched.csv and watchlist.csv together: watched films are logged with their dates, watchlist films land on your Films watchlist. Years from the export are used to disambiguate remakes.

**IMDb** (Your Ratings → Export). Films are logged as watched; TV series are added as tracked shows with no episodes marked (IMDb exports do not contain episode-level watch data). Single-episode ratings are skipped because the export does not say which series they belong to.

**TellyLog backup** (.json) restores everything from another device.

Sample files for every source live in `sample-data/` if you want to try the wizard before using real exports.

## Architecture

Deliberately boring on purpose: zero dependencies, no build step, no framework.

```
index.html          app shell, tab bar, plain script tags (no modules)
css/styles.css      dark theme, mobile-first, 680px column
js/util.js          pure functions: CSV parser, column guesser, name
                    similarity (Dice bigrams), flexible date parsing,
                    TV Time style duration formatting
js/store.js         all state + persistence (localStorage), selectors for
                    watch-next / history / upcoming / stats, import merge,
                    JSON backup and restore
js/tmdb.js          TMDB v3 client with in-memory cache and a concurrency
                    limiter
js/views.js         pure-ish render functions returning HTML strings
js/app.js           hash routing, one delegated click handler driven by
                    data-action attributes, modals, toasts
js/importer.js      the CSV import wizard state machine
tests/              Node test suites for util.js and store.js (no test
                    framework, just assert)
```

Run the tests:

```bash
node tests/util.test.js
node tests/store.test.js
```

## Privacy

- All watch data is stored in `localStorage` under the key `tellylog:v1`
- The only network calls are to `api.themoviedb.org` for metadata and `image.tmdb.org` for posters
- Clearing browser data deletes everything, so use Profile → Back up data periodically

## Credits

Show and film metadata from [TMDB](https://www.themoviedb.org/). This product uses the TMDB API but is not endorsed or certified by TMDB.

Interface design inspired by the TV Time app.
