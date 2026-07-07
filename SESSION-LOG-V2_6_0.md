# SESSION LOG: v2.6.0 (Session C, 8 July 2026)

The session the grounding campaign was built FOR: real top shows logged (owner confirmed), Upstash provisioned, so the AI surfaces built here run on real data from day one. Scope roughly doubled mid-brief by owner additions; the audit flagged it and everything fit.

## Decisions on the record

**Episode-level ratings REJECTED, title-level built instead.** The owner proposed a simple rating system "for what episodes we have watched" as MVP storytelling. Audit position, accepted by the owner: episode ratings have no consumer (no social layer, no server, AI grounding is title-level), the data-entry economics guarantee near-zero coverage in a library approached top-30-to-50 at a time, and star ratings were already deferred once in Phase 1.5. Title-level ratings (1-5, tap-again-to-clear) were built on shows and films, additive fields, and fed into librarySummary so the taste summary and the new rails can tell loved from merely finished. That gives ratings a consumer from the first tap.

**Rewatch counter semantics, owner-ratified.** The count is total watch-throughs, default 1, absent field at 1 so old backups stay byte-identical in spirit. It multiplies TIME everywhere time is charted (genre bars, donut, headline totals) and never the distinct episode or film counts, so "Episodes watched" stays honest. The monthly activity line NEVER sees rewatches because they carry no dates; the owner ratified this in the brief and the chart captions disclose it. Honesty limit also captioned: only ticked episodes multiply, so half a show ticked at ×3 credits that half three times.

**Rails architecture.** Anchors are chosen locally (Store.railAnchors: top 3 shows by rewatch-weighted watched minutes, then 1 film by rewatch, rating, recency), so the LLM can produce a weak pick but never a fake "because you watched" premise. ONE call, mode:'rails' on the existing /api/ask (shared key gate, shared rate limiter), strict JSON out, sanitised server-side AND client-side. Cache in tellylog:rails:v1 outside the schema, keyed on a hash of librarySummary plus the anchors, storing the TMDB-RESOLVED cards so a cache hit costs zero LLM and zero TMDB calls. Empty results are never cached, so a one-off bad answer retries instead of pinning. Thin-library honesty is structural: the response shape carries a note and a per-rail basis the UI renders; modesty is not left to the model's discretion.

**Voice insights built deterministic, per the standing audit position.** insightsQA.js answers stats questions (top genre, most watched show, top film, totals, busiest month, rewatches, ratings, watchlist) locally from the store. Zero LLM calls, zero cost, works offline, and the unmatched case returns a help line, never a guess. The mic auto-answers here (unlike the ask box, where auto-submit stays rejected) because a misheard question here costs nothing.

**Your data moved behind one button** into DataModal, same opt-in pattern as stats, owner ruling. Side effect noted in the audit: Delete everything no longer sits permanently exposed on the Profile.

## Bug fixes, owner-reported

1. **Stats header illegible in light mode.** Root cause: .modal__hero sets color to the on-media near-white for over-image text; the --plain variant kept that colour over a light surface. New --stats variant colours with theme ink over an accent gradient with a gold underline and an eyebrow line, legible in both themes by construction.
2. **Films labelled "1 ep" in the month drill-down.** TitleList rendered count + ' ep' unconditionally. Labels are now kind-aware: films say "film", shows say "N eps". Rewatch ×N chips appear in genre drill-downs only, deliberately not in the month list.

## Schema

Additive only: show.rewatchCount, movie.rewatchCount, show.rating, movie.rating. All optional, all absent by default, restore of old backups verified by test. New derived-data key tellylog:rails:v1 lives OUTSIDE the schema like the taste cache.

## Tests

122 green (was 109): 40 util, 56 store (13 new: rewatch multipliers, count-vs-time separation, month immunity, clamping, rating set/clear, librarySummary tags, railAnchors ordering, insightsQA matching and the null-not-guess rule), 26 component (4 new: rails client contract, 429 surfacing, no-LLM gate, empty-library gate). Production build clean. ImportWizard untouched.

## Cost note

Rails add roughly one 2000-max-token Haiku call per library change, cached until the next change. Voice insights add zero API cost by design, which is itself portfolio material: the cheapest correct architecture for deterministic questions is no model at all.
