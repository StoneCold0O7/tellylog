# TellyLog: unit economics and commercial trade-offs

This document is the commercial companion to the [README](README.md) decision record. The README explains what was built and why in product terms. This one explains the same project in money terms: what it costs to run, how those costs were held down on purpose, and what the scale-up economics would look like if this were a business rather than a portfolio piece and a personal tool.

One honesty note up front, because it is the whole point. TellyLog earns nothing. There is no revenue, no pricing, no margin to report, by deliberate choice (see section 6). So the commercial story here is not a profit-and-loss statement. It is **capital efficiency and cost discipline**: a real product, run under a hard self-imposed spending ceiling, engineered so that the marginal cost of one more user trends to zero and the one genuinely variable cost is throttled in code rather than watched on a dashboard. Every number below is either a published rate or a clearly-labelled estimate with its assumptions stated. Nothing is inflated to look like a business it is not.

## 1. The objective and the constraint

The brief had two commercial facts baked in from the first session.

**A hard cost ceiling.** The owner set a personal monetary limit on how much the product may spend on AI, and a rule that the product should stay budget-friendly enough to run indefinitely on a hobby budget. That constraint drove architecture, not the other way round.

**No monetization, by decision.** This is a single-user, local-first tracker and a public portfolio artefact. Charging for it would add billing, support and data-protection liability for no strategic gain (section 6). Choosing not to monetize is itself the commercial call, and it is on the record rather than an omission.

The interesting commercial work, therefore, is everything done to make the ceiling comfortable to live under.

## 2. Unit economics today

**The unit.** For a free, single-user app the meaningful units are the cost to serve one user, one session, and one AI interaction. There is no revenue side to the unit, so the discipline is entirely on the cost side.

**Fixed cost: effectively zero.** The entire stack runs on free tiers.

| Line item | Provider / mechanism | Monthly cost |
|---|---|---|
| Hosting and serverless functions | Vercel Hobby | $0 |
| Database | None. All user data in the browser's localStorage | $0 |
| Rate-limit store | Upstash Redis, free tier | $0 |
| Metadata and images | TMDB API, free with attribution | $0 |
| Visitor analytics | Vercel Web Analytics, free tier, cookieless | $0 |
| Domain | The `vercel.app` subdomain | $0 |

The only account that can ever carry a balance is the Anthropic API key, and that is the one variable cost, examined next.

**Marginal cost per user: near zero for the core product.** Tracking shows and films, ticking episodes, viewing stats, importing history, backing up and restoring all run entirely in the browser against localStorage. None of it touches a paid backend, because there is no backend to touch. Serving one more user who only ever tracks and browses costs **$0** at the margin. This is a direct consequence of the local-first architecture the README describes, and it is the single biggest reason the ceiling is comfortable: the product's cost does not scale with its user count on any axis except the AI, which is deliberately throttled.

**The one variable cost: gated LLM calls.** The AI surfaces (Explore recommendation rails, the "ask what to watch" box, the Profile taste summary) call Claude Haiku through one serverless function. Haiku was chosen precisely because these are small, well-constrained JSON jobs that do not need a frontier model. At the published Haiku rate of **$1.00 per million input tokens and $5.00 per million output tokens**, a single generation costs, on stated assumptions:

| AI generation | Input (approx) | Output (approx) | Cost per call (estimate) |
|---|---|---|---|
| Explore rails (over-generates ~36 picks) | ~4,000 tokens | up to ~3,500 tokens | **~2.0 cents** |
| Ask-box answer + picks | ~4,000 tokens | ~1,500 tokens | **~1.2 cents** |
| Profile taste summary | ~4,000 tokens | ~500 tokens | **~0.7 cents** |

Assumptions: the compact library summary sent to the model is capped at 120 shows and 50 films (roughly 3,000 tokens), plus the system prompt and the user's question. Output is bounded by a hard `max_tokens` of 3,500 on rails. These are worst-case-ish upper estimates; real calls on thinner libraries cost less. The headline is that **an AI generation costs between roughly half a cent and two cents.**

**Cost per active user per month (illustrative).** Because the AI does not re-run on every tap (section 3), the number of billable generations per user is small and bounded. A heavy, genuinely active user triggers at most one rails refresh and one taste refresh per five-day window, plus whatever they choose to ask. A rough envelope:

- Auto-refreshed surfaces (rails + taste), gated at 5 days: about 6 refreshes each per month, so ~6 × 2.0c + ~6 × 0.7c ≈ **16 cents/month**.
- Ask box, user-initiated and rate-limited: a heavy user asking ~30 times a month adds ~30 × 1.2c ≈ **36 cents/month**.
- Total for a heavy, engaged user: **under $0.55/month.** A casual user costs **close to $0**, because the cache serves them and they rarely ask.

So even the worst-case single user is cents per month, and the median user rounds to zero. That is the unit economics: no fixed cost, a marginal cost that is zero for the core product and a few cents a month for the most AI-hungry users.

## 3. The cost ceiling, enforced in code

The commercial point that distinguishes this project is that the spending limit is not a resolution to be careful. It is enforced by the architecture, so it holds whether or not anyone is watching.

**The refresh gate is the primary lever.** Neither AI surface refreshes just because the library changed. The first generation is immediate; after that a cached result is served, even when stale, until BOTH at least five days have passed AND at least six "signal units" of genuine taste change have accumulated (each show started, film watched, rating set or extra watch-through counts one, plus one per ten episodes ticked). The effect is that **API spend tracks real taste change, not user activity.** Ticking three more episodes of a show you are already watching costs nothing; it is not a taste event. The thresholds live in a single module (`src/lib/refreshGate.js`) so the policy, the code and the in-app fineprint cannot drift apart, and the two numbers are one-line tunable if the real-world bill ever argues for it.

**Model choice is a five-times cost decision.** Haiku at $1/$5 per million tokens versus a Sonnet-class model at several times that, for a task that is small constrained JSON, is a straight cost-versus-value call. The frontier model would not produce better genre picks here; it would just cost more. The cheapest model that clears the quality bar was chosen on purpose.

**Deterministic where a model is not needed.** Stats questions ("what is my most watched show?") are answered locally by a small matcher over the user's own numbers, at zero model cost, because the answer is already in localStorage and arithmetic does not hallucinate. When a recommendation rail runs short after filtering out titles the user already owns, it is topped up from TMDB popular-in-genre data, also at zero model cost. The LLM is reserved for the two jobs that genuinely need judgment over taste. Everywhere a free deterministic path clears the bar, it is used.

**Input is capped.** The library summary sent to the model is bounded (120 shows, 50 films, a fixed character ceiling), so input token cost per call cannot balloon as a user's library grows to thousands of titles.

**Waste is designed out.** Rails over-generate and cache the spare picks, so when owned titles are later filtered out the rail backfills from cache instead of paying for a fresh call. Empty results are never cached, so a one-off bad answer retries rather than sticking and forcing a manual, billable re-roll. A manual "refresh" button on the taste summary was removed precisely because it only ever re-rolled identical input at real API cost.

**Abuse is capped.** The single AI endpoint sits behind a durable rate limiter (10 requests per 10 minutes per IP, Upstash Redis, free tier, with an in-memory fallback so the feature never goes down because the limiter did). That bounds the blast radius of a scraper or a stuck client on the one cost that can run up a bill.

## 4. Build-versus-buy, priced

Every major architectural refusal in this project was also a cost decision. The pattern throughout is: do not buy or build capacity the product does not need, and take the free path wherever it clears the quality bar.

| Decision | Rejected | Why, commercially |
|---|---|---|
| Backend and accounts (Supabase) | Yes | A single-user local-first app gains nothing from a database except hosting cost and data-protection liability. $0 spent, zero custody risk. |
| Embeddings recommender | Yes | Rejected on infrastructure cost. A grounded prompt against the user's own history does the job with no vector store to run. |
| Whisper voice transcription | Yes | Rejected on cost, then satisfied for free by the browser's built-in Web Speech API. Same feature, zero marginal cost. |
| Cloudflare Pages | Yes | Evaluated at identical ($0) cost to Vercel and rejected on ease-of-use. Cost parity meant the decision was made on operational friction, correctly. |
| Prompt caching | Yes | Evaluated and rejected because the system prompt sits below the cacheable minimum. Turning it on would have added a write premium, not saved money. |
| Google Analytics 4 | Yes | Rejected in favour of free cookieless analytics. GA4 would have forced a consent banner (a UX and compliance cost) and clashed with the privacy story. |
| Chart libraries | Yes | Every chart is hand-rolled SVG. Zero dependency cost, smaller bundle, no supply-chain surface. |
| Native iOS build | Yes | Rejected for the PWA path. Avoids the Apple developer fee and a separate build-and-review pipeline for a product that does not need native APIs. |

The through-line is capital efficiency: the product buys nothing it can get for free and builds nothing it does not need.

## 5. Where the first real bill would appear (scale scenario, illustrative)

This section is deliberately labelled a forward projection. The point of including it is to show the scale-up economics were modelled, not that they were incurred. The figures are order-of-magnitude, on today's free-tier limits and Haiku pricing.

| Monthly active users | What stays free | Where the first cost appears |
|---|---|---|
| ~100 | Everything. Well inside Vercel Hobby, TMDB and Upstash free tiers. | AI spend only: at the section-2 envelope, maybe **$5 to $30/month** in Anthropic credit depending on how AI-hungry the cohort is. |
| ~1,000 | TMDB and localStorage still free. | AI spend scales roughly linearly with active users (**tens to low hundreds of dollars/month**), still gated. Vercel Hobby bandwidth and function-invocation limits start to bind, pushing to Vercel Pro (~$20/month). Upstash free tier may need a paid step. |
| ~10,000 | localStorage is still $0 storage; the architecture never adds per-user server storage. | AI is now the dominant cost and the gate thresholds become the primary lever (raising 5 days to 10, or 6 units to 12, roughly halves AI spend with no code rewrite). Vercel and Upstash move to paid tiers. Serious use would justify a cheaper self-hosted rate limiter and possibly batching AI calls. |

The levers to manage all of this are already in the codebase, not hypothetical: the gate thresholds are two tunable numbers, the model is a single swappable string, the library summary cap bounds per-call input, and the rails cache already absorbs repeat demand. The design that keeps the hobby bill near zero is the same design that would keep a scaled bill controllable.

## 6. If it were a business (monetization, not pursued)

The economics would support a freemium model cleanly, which is exactly why not pursuing one is a choice rather than a limitation.

The costly surface is already isolated: the AI features are the only thing that costs money, and they already sit behind their own endpoint, their own rate limiter and their own cost gate. A free tier (unlimited tracking, stats and import, all zero marginal cost) with a paid AI tier would map straight onto the existing architecture. Because the marginal cost of the AI is cents per active user per month, even a modest subscription would carry a very high gross margin. The unit economics of a paid tier would work.

It is not pursued because the strategic objective is a portfolio artefact and a tool the owner and his friends actually use, not a venture. Adding billing would introduce payment handling, customer support and personal-data custody, all of which cut against the privacy story that is the product's spine, for no gain toward the actual goal. The commercial instinct on display is knowing the monetization path exists, knowing the numbers would work, and choosing deliberately not to take it now. Scale was declined with the plan for it written down, not for lack of one.

## 7. What this demonstrates

Read as a commercial exercise, the project shows a specific set of instincts:

- A hard cost ceiling translated into architecture that enforces it automatically, rather than a spending target someone has to police.
- Marginal cost per user driven to zero for the core product through a local-first design, with the one variable cost isolated and throttled.
- Build-versus-buy discipline applied consistently: free where free clears the bar, deterministic where a model is not needed, nothing bought or built that the product does not require.
- Every scope-out framed and recorded as a cost-versus-value judgment, not a limitation.
- Honest unit economics: real rates, stated assumptions, no invented revenue.
- The ability to model the scale-up and the monetization that were deliberately not pursued, with the levers to execute either already sitting in the code.

The README argues that the decisions are the product. This document argues the narrower commercial version of the same claim: the cost decisions are a product too, and they were made on purpose.
