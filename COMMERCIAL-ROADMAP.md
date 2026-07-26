# TellyLog: what going commercial would actually take

A companion to [COMMERCIAL.md](COMMERCIAL.md). That document reads the project as it is: a zero-revenue, local-first tool run under a hard cost ceiling. This one answers a different question, asked in July 2026 after friends suggested the project could be a product: **if TellyLog were pursued commercially, what would have to change, in what order, and what would the first phase cost.**

Nothing here is committed. It is a decision record for a decision not yet made, written so that the option stays open and the sequencing is understood before any money or months go into it.

## The premise change

Every architectural decision in this repo was correct for a single-user, local-first app and several of them stop being correct the moment there are customers. That is worth stating plainly, because the temptation is to defend past decisions rather than notice their premise expired.

The clearest example: rejecting a backend. COMMERCIAL.md is right that a single-user localStorage app gains nothing from a database except cost and liability. A commercial product inverts that completely. Data that lives only in one browser cannot survive a cache clear, cannot follow a user to a second device and cannot be recovered by support. **Reversing that decision is not an admission the original call was wrong. It is the same reasoning applied to a different premise.** Reversals are already this project's currency, so this one belongs on the record with the rest.

## The five priorities, in dependency order

Ranked by what can block a launch, not by what is most interesting to build.

### Phase 0. Licensing, before anything else

This sits at zero because it can invalidate everything after it, and because building auth for a product that cannot legally be monetised would be the single most expensive mistake available here.

TellyLog's entire metadata and imagery layer is TMDB. [Likely, and this must be verified directly with TMDB before any commercial work begins] TMDB's terms treat commercial use differently from personal use, and commercial applications generally require applying for a commercial licence rather than relying on the free tier. There may be a fee, revenue conditions or attribution requirements attached.

The action is a written answer from TMDB about the intended commercial model, obtained **before** phase 1 starts. Alongside it: confirm JustWatch attribution obligations for commercial use, and confirm Anthropic's terms for reselling AI output inside a paid product.

The reason this is phase 0 rather than a footnote: "we build on an API we are not licensed to monetise" is a question that gets asked in any serious room, and the answer needs to be ready. If TMDB says no on acceptable terms, the product either changes its data source, which is a rebuild, or stays free. Better to learn that in a week than after six months of engineering.

### Phase 1. Identity and sync

The structural unlock. Nothing else on this list matters without it, and it is costed in detail below.

### Phase 2. Entitlements and cost control that survive strangers

Today's protection is ten requests per ten minutes per IP. That is correct for one user and wrong for a product: IP limits are trivially bypassed and they punish people who share an IP, such as a university, an office or a mobile carrier's NAT. Commercially you need per-account quotas enforced server-side, entitlements attached to a plan, and an organisation-level spend ceiling so a single abusive account cannot run up an Anthropic bill.

The good news is architectural. The expensive surface is already isolated behind one endpoint with a documented cost gate, so this is an upgrade rather than a rebuild. The economics from COMMERCIAL.md carry over: AI costs cents per active user per month, which is exactly why it is the natural paywall.

### Phase 3. Legal footing as a data controller

The moment watch history sits on your server you are a data controller under UK GDPR. That brings a privacy policy, terms of service, a stated lawful basis, the ability to export and delete a user's data on request, and data processing agreements with every subprocessor (Anthropic, TMDB, whoever hosts the database). None of it is hard, all of it is unskippable, and it is cheaper to build export and delete into the schema in phase 1 than to retrofit them.

Worth noting honestly: the app currently advertises that nothing leaves your browser. That copy becomes false the day sync ships, and the privacy story has to be rewritten rather than quietly dropped.

### Phase 4. Positioning, pricing and the wedge

The economics work. Tracking costs nothing at the margin so it stays free; AI costs cents so it prices comfortably as a subscription with a high gross margin. The hard part is not the pricing, it is the competition. Trakt, Simkl and Letterboxd already exist and Trakt already sells a VIP tier. "Another tracker" loses.

The wedge is the AI grounded in a real library, which none of the incumbents do well, plus timing. TV Time shut down on 15 July 2026 and left a displaced user base actively looking for a home. [Certain on the shutdown, Likely on the opportunity] That window is perishable, which is the strongest argument for moving quickly if this is pursued at all, and the strongest argument for deciding rather than drifting.

### Phase 5. Being a system of record

The least glamorous item and the one that most often kills side projects that become products. Once people trust years of history to your server you owe them uptime, backups, error monitoring, a support channel and an incident process. That is a recurring commitment of the owner's time, and an honest pitch says so rather than pretending software runs itself.

## Phase 1 costed: identity and sync

The only phase worth costing in detail now, because the others are gated behind it or behind phase 0.

### Scope

**Authentication.** Google and Apple sign-in cover the overwhelming majority of consumers, with an email magic link as the fallback. No passwords, which removes a whole category of support burden and breach liability.

**Storage.** A Postgres database mirroring the existing schema shape rather than reinventing it. The current schema is already versioned and additive-only, which makes it an unusually clean starting point.

**Sync.** This is the genuinely hard part and the part most plans underestimate. The saving grace is that TellyLog's data is unusually friendly to merging: the watch log is append-mostly, and an episode tick is closer to a set membership than a mutable field. A union-of-ticks model with server timestamps for the genuinely mutable fields (ratings, rewatch counts, archived and watchlist flags) handles the realistic conflicts. The failure mode to design against is two devices offline at once, not two users editing one record.

**Migration.** On first sign-in, an existing local library uploads and becomes the account. This must be non-destructive and reversible, because the first thing it touches is 2,000 titles and 10,500 episodes of real history that exist in exactly one place.

**Keep local-first.** localStorage stays the working copy and the server becomes a sync target rather than a replacement. That preserves offline use, keeps the app fast, and means a server outage degrades rather than bricks. It also preserves the part of the privacy story that can honestly survive.

### Cost

**Infrastructure, roughly $0 to $25 a month until real scale.** Supabase's free tier covers a meaningful number of monthly active users on both auth and Postgres, and the paid step is about $25 a month. Vercel stays on Hobby until bandwidth or function invocations bind, then about $20 a month. A real domain is roughly £10 to £15 a year. [Likely, on current published tiers] Call it **under $50 a month all-in until there is genuine traction**, which is not the constraint people assume it is.

**Engineering, the real cost.** In this project's working model the money cost of building is Anthropic credit, which is small, and the actual cost is the owner's directed time. Phase 1 is realistically **six to ten focused sessions**: auth, schema and server, the sync engine, migration, then hardening. The sync engine alone is two to three of those and is where the estimate would slip if it slips.

**Ongoing.** Once live, the recurring costs are the infrastructure above plus AI spend as modelled in COMMERCIAL.md, plus support time, which is unpaid but not free.

### What phase 1 deliberately excludes

No payments, no paid tier, no pricing page. Monetisation is phase 4 for a reason: charging before sync is reliable would be selling a promise. No social or community features, despite community being the thing the owner personally missed about TV Time, because that is a second product and it needs an audience first.

### The gate

Phase 1 should not start until phase 0 returns a usable answer from TMDB, and until the owner decides the perishable TV Time window is worth acting on. Both are decisions, not engineering.

## The honest summary

The economics work, the architecture is unusually well positioned for the transition (versioned additive schema, isolated AI surface, existing cost gate), and the timing is briefly favourable. The blockers are not technical. They are a licensing answer nobody has asked for yet, a competitive field with incumbents, and the fact that a product is a years-long commitment where a portfolio piece is finished when it is finished.

Choosing not to pursue this remains a legitimate outcome, and COMMERCIAL.md already argues why. The purpose of this document is that if the answer becomes yes, the first move is a licensing email rather than a database migration.
