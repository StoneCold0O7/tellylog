# TellyLog handover: after Phase 2b (v2.4.0), into Phase 3

Date: 7 July 2026. Supersedes every earlier handover. Pair this with CONTEXT.md (the stable master context, new this session) and the codebase zip. Style rules and the working contract live in CONTEXT.md now; this file is only the volatile state.

## 1. What to do now, in order

1. Upload the v2.4.0 zip contents to the repo root on GitHub. Deleted files: NONE this time.
2. Run CHECKLIST-PHASE2B.md on the deployed site. The genre backfill (section A) and the 5-7 picks check (section D) are the two that matter most.
3. Owner action, unblocks nothing but adds durability: provision Upstash Redis via the Vercel Marketplace (checklist section G). The limiter works either way; it only becomes durable once the store exists.

## 2. Decisions you owe before the Phase 3 session

1. **Chart weighting verdict.** You reserved the right to change the minute-weighting or the primary-genre donut after seeing them live. Say "charts stand" or describe the change in the next prompt.
2. **The TV Time export (~11,413 episodes), now parked across six sessions.** It gates the LinkedIn post by your own criterion. Phase 3 produces the public-facing README; launching that README with a demo-sized library undercuts it. Strong recommendation: dedicate the session BEFORE Phase 3, or the first half of it, to the real import.
3. **Colophon content.** Phase 3 includes the "how this was built" page. Decide how explicitly it names the Claude-directed build method. Recommendation: fully explicit, it IS the portfolio story.

## 3. Phase 3 scope (final build phase)

README plus decision log as the primary portfolio deliverable (raw material: SESSION-LOG*.md, PHASE1-NOTES.md, PORT-NOTES.md, CONTEXT.md section 6), colophon page, PWA manifest plus service worker. After Phase 3: export verification if still outstanding, then the LinkedIn post.

## 4. Paste this prompt into the next new chat

```
TellyLog Phase 3 session. Attach CONTEXT.md, this HANDOVER-NEXT.md and the v2.4.0 zip. Current state: v2.4.0 deployed at tellylog-3d2u.vercel.app, 96 tests green, storage key tellylog:v1. Phase 2b verified: charts render and backfill ran once [CONFIRM], taste summary grounded and cached [CONFIRM], ask box returns 5-7 picks [CONFIRM], footer credit and console colophon present [CONFIRM]. Upstash store provisioned: [YES/NO]. TV Time export imported: [YES/NO/THIS SESSION FIRST].

Decisions: charts weighting [STANDS / change: ...]. Colophon names the Claude-directed method [YES/NO].

This session's job, in order:
1. README.md rewritten as the primary portfolio deliverable: strategist voice, the decision log with every reversal (Logline revert, Kino rejection, v2.3.0 proxy failure, lazy-backfill reversal, watermark reframe), scope-outs as cost-versus-value judgments.
2. Colophon page in the app telling the build story, linked from the Profile credit line.
3. PWA manifest plus service worker, installable, no offline-sync promises beyond what localStorage already gives.
4. Run all tests, ImportWizard untouched, schema untouched.
5. Zip for drag-and-drop, deleted files listed explicitly, browser checklist, session log in the established style, regenerated HANDOVER-NEXT.md.

Standing rules are in CONTEXT.md section 2; follow them. Remind me to close around 15 messages.
```

One warning: if the export is still not imported when Phase 3 closes, the LinkedIn post stays gated. Do not let the README's polish talk you into launching on demo data.
