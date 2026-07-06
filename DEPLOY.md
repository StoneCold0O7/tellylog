# Deploying TellyLog to Vercel (no coding needed)

Follow these steps in order. You need a web browser and about 15 minutes. You never need a terminal.

## Part 1: Put the code on GitHub

1. Go to github.com and sign up for a free account (skip if you have one).
2. Click the + icon in the top right, then "New repository".
3. Repository name: `tellylog`. Set it to Public. Do NOT tick "Add a README". Click "Create repository".
4. On the next page, click the link that says "uploading an existing file".
5. On your computer, unzip `tellylog-react.zip` and open the unzipped folder so you can see its contents (index.html, package.json, src, tests, sample-data and so on).
6. Select EVERYTHING inside that folder and drag it into the GitHub upload area in your browser. Folders drag in with their contents. Wait until every file shows as uploaded.
7. Scroll down and click "Commit changes".

## Part 2: Deploy on Vercel

1. Go to vercel.com and click "Sign Up". Choose "Continue with GitHub" and authorise it.
2. On the Vercel dashboard click "Add New..." then "Project".
3. Find `tellylog` in the list and click "Import".
4. Vercel detects it as a Vite project automatically. Change nothing. Click "Deploy".
5. Wait about a minute. You get a live URL like `tellylog-xxxx.vercel.app`. Open it.

## Part 3: Check it works (your parity checklist)

Do these on the live URL, in order:

1. You see the TellyLog onboarding screen asking for a TMDB API key.
2. Get a key if you do not have one: themoviedb.org, sign up, Settings, API, request a Developer key, copy the "API Key" (v3 auth).
3. Paste the key, click "Save and start". You should land on an empty Shows tab.
4. Go to Explore, search for any show, click the + on a result. Toast says "Now tracking".
5. Back on Shows, the show appears under WATCH NEXT. Click its check button. It moves into WATCHED HISTORY.
6. Click the show's poster. The detail modal opens. Expand a season, tick an episode, watch the progress bar move.
7. Go to Profile. Stats reflect what you just did.
8. Profile, "Import TV Time export", choose `sample-data/sample-tvtime-export.csv` from the unzipped folder. Walk the wizard through to Done.
9. Refresh the page. Everything is still there (data persists in the browser).

If all nine pass, Phase 0 parity is confirmed in the browser and the real TV Time export test is next.

## One important note about your old data

Browser data is tied to the address it was saved under. Anything you added while running the old version from a local file will NOT appear on the Vercel site automatically. If you have data in the old version worth keeping: open the old version, Profile, "Download backup (JSON)", then on the Vercel site use "Restore backup" and pick that file.
