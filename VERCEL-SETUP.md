# Activating Phase 2 (owner action required)

The codebase now contains everything Phase 2 needs. None of it is visible on the deployed site until you add environment variables in the Vercel dashboard. This is deliberate: the code ships dormant, you flip it on when the real watch history is imported and you have decided to pay for API calls.

## What is dormant right now

1. **The ask box** in Explore ("ask what to watch"). Hidden until the server reports an Anthropic key. [Certain]
2. **The server-side TMDB proxy** at /api/tmdb. Written and deployed but unused by the client; the app still uses your browser-stored TMDB key. Flipping the client to the proxy is a small Phase 2 code change, not an env var. [Certain]

## Step by step: enable the ask box

1. Create an Anthropic API account at console.anthropic.com and add billing. Calls cost real money per request. With the default model (Haiku) a single ask is a fraction of a penny; a demo session is pennies. [Likely on exact pricing, check the console]
2. Create an API key in the console.
3. In Vercel: your project → Settings → Environment Variables → Add.
   - Name: `ANTHROPIC_API_KEY`
   - Value: the key
   - Environments: Production (Preview optional)
4. Redeploy (Deployments → latest → Redeploy). Env vars only apply to new deployments. [Certain]
5. Open the deployed site → Explore. The ASK WHAT TO WATCH section now appears above trending. If it does not, open /api/health in the browser; it should show `"llm": true`.

Optional: add `ANTHROPIC_MODEL` to override the default `claude-haiku-4-5-20251001` with a stronger model for demo day.

## Step by step: prepare the TMDB proxy (optional now, required for Phase 2 proper)

1. Same screen, add `TMDB_API_KEY` with your TMDB v3 key.
2. Redeploy. /api/health then shows `"tmdbProxy": true`.
3. Nothing changes for users yet. The Phase 2 session flips src/lib/tmdb.js to call /api/tmdb instead of api.themoviedb.org, which removes the key-entry onboarding step and unlocks the true under-30-second stranger first run.

## Cost control

- The ask endpoint caps question length, library context and response tokens server-side. [Certain]
- There is no per-user rate limit in this scaffold. If the repo link circulates widely with the key active, strangers on your deployed site can spend your credit. Either keep the key out until demo periods or ask the Phase 2 session for a rate limit. [Certain this gap exists]

## Renaming the Vercel project (optional)

The app is now Logline but the domain is still tellylog-3d2u.vercel.app. Vercel: project → Settings → General → rename, which changes the default domain. Old links break; update the README deployment link if you do this. Your data is unaffected because it lives in your browser under the unchanged `tellylog:v1` key, but note that browser localStorage is per-domain: on a NEW domain the app starts empty, so export a backup from the old domain and restore it on the new one. [Certain]
