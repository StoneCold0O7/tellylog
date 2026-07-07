# TellyLog handover: after v2.5.0, into Session C (Explore rails)

Date: 7 July 2026. Supersedes every earlier handover. Pair with the updated CONTEXT.md and the v2.5.0 zip. Two build sessions remain, then the LinkedIn post: Session C (Explore recommendation rails) and Session A / Phase 3 (README, colophon, PWA).

## 1. What to do now, in order

1. Upload the v2.5.0 zip contents to the repo root on GitHub. Deleted files: NONE.
2. Run CHECKLIST-V2_5_0.md on the deployed site. Sections A (stats modal drill-downs) and C (TV watchlist) matter most.
3. **The grounding campaign, the one owner action that gates everything.** The TV Time export is dead, so before the next session log your genuine top 30-50 shows manually: search, track, tick the seasons you actually watched. Roughly an evening. Session C builds recommendation rails; on a demo library they produce filler and the whole page argues against your own portfolio thesis. Optional parallel: a GDPR data request email to TV Time, since UK law obliges them to hand over your data even with the in-app export broken. [Likely on the GDPR mechanics]
4. Still pending, zero urgency: provision the Upstash Redis store in Vercel Marketplace. The limiter degrades gracefully without it.

## 2. Decisions you owe before Session C

1. **Voice insights verdict.** Build in Session C, defer to Session A, or drop. The audit position stands on the record: deterministic queries (top genres, most watched) are answered locally from the store, never via the LLM. If built, the mic plumbing is free (Web Speech exists since v2.3.0) and the work is local intent matching.
2. **Rail count and shape.** Recommended: 3-4 rails ("Because you watched X" per anchor title), shows first then films, 5-6 picks per rail, ONE LLM call returning everything as JSON, cached like the taste summary, refreshed only when the library hash changes. If you want more rails, say so and the token budget rises with it.
3. **Verification report from CHECKLIST-V2_5_0.md**, especially anything that failed.

## 3. Session order remaining

Session C: Explore rails plus the voice-insights decision. Session A / Phase 3: README as the primary portfolio deliverable, colophon page (naming the Claude-directed method explicitly, your ruling already on record), PWA manifest plus service worker. Then the LinkedIn post, gated on real data.

## 4. Paste this prompt into the next new chat

```
TellyLog Session C. Attach CONTEXT.md, this HANDOVER-NEXT.md and the v2.5.0 zip. Current state: v2.5.0 deployed at tellylog-3d2u.vercel.app, 109 tests green, storage key tellylog:v1. v2.5.0 verified: stats modal drill-downs work on touch [CONFIRM], TV watchlist flows work [CONFIRM], profile images compress and survive backup restore [CONFIRM]. Grounding campaign done, real top shows logged: [YES/NO/PARTIAL, roughly N shows]. Upstash store provisioned: [YES/NO].

Decisions: voice insights [BUILD NOW / DEFER TO SESSION A / DROP]. Rails [3-4 as recommended / other: ...].

This session's job, in order:
1. Explore page: "Because you watched X" recommendation rails. ONE serverless LLM call (extend /api/ask with mode:'rails') returning all rails as JSON, cached outside the schema keyed on the library hash, refreshed only when the library changes. Shows first, then films. Each rail anchored to a real title from my library. Thin-library honesty: if my data is sparse the rails must say so, not fake confidence.
2. Rails render below the existing trending sections as a scrolling page; every pick opens the existing TitleModal preview so nothing is added without my say-so.
3. Voice insights per my decision above.
4. Run all tests, ImportWizard untouched, schema additive only if touched at all.
5. Zip for drag-and-drop, deleted files listed explicitly, browser checklist, session log in the established style, updated CONTEXT.md, regenerated HANDOVER-NEXT.md.

Standing rules are in CONTEXT.md section 2; follow them. Audit this brief before building. Remind me to close around 15 messages.
```

One warning, same one as always but sharper now: if the grounding campaign has not happened when Session C opens, the honest move is to spend that session's first half doing the logging together and build the rails in the second half. Rails on demo data are the exact AI decoration this portfolio exists to argue against.
