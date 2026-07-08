# TellyLog handover: after v2.7.0. The build is DONE. One deliverable remains: the LinkedIn post.

Date: 8 July 2026. Supersedes every earlier handover. Pair with the updated CONTEXT.md and the v2.7.0 zip. There are no build sessions left.

## 1. What to do now, in order

1. Upload the v2.7.0 zip contents to the repo root on GitHub. Deleted files: NONE.
2. Watch the Vercel deployment. IMPORTANT, on the record: this session's build container had no npm registry access, so the vitest component suite and the production build did NOT run in-session (105 node tests did, all green). Vercel's build is therefore the first full build of v2.7.0. If Vercel shows a failed deployment, STOP, copy the build log and open a fix session with it. A green Vercel build plus the checklist is the verification path.
3. Run CHECKLIST-V2_7_0.md on the deployed site. Sections A and B prove the two big changes (genre rails, the cost gate). Note that both AI caches will regenerate ONCE on first visit because their shape changed; that single regeneration is expected, not a gate failure.
4. Read the new README.md top to bottom as a stranger would. It was written, per your instruction, as if everything verified; if any checklist step fails, the README gets corrected BEFORE the LinkedIn post goes out.

## 2. The caveat you asked to carry forward

The last piece of this project is a humanly, upbeat LinkedIn post. Do not let a model's default voice write it flat or breathless; it must sound like you. The draft brief is below. The post goes out only after the checklist passes and the README reflects reality.

**When to post, for reach.** LinkedIn engagement concentrates in the working week, on Tuesday, Wednesday or Thursday, in the 8:00-10:00am window in your audience's timezone (UK time for a UK job search), when people check feeds at the start of the workday; a secondary window sits around midday. Weekends, Friday afternoons and late evenings underperform. [Likely] These are aggregate patterns from social-scheduling studies, not a guarantee for any single post; your own network's habits can differ. Recommendation: Tuesday or Wednesday, 8:30-9:30am UK time, then spend the following hour replying to every comment, because early replies feed the algorithm's distribution. [Likely]

## 3. LinkedIn post draft brief

- Voice: first person, warm, plainly proud, zero corporate filler. Upbeat but honest.
- The hook: a non-developer shipped a deployed, tested, installable product by directing an AI; the actual portfolio piece is the decision record: what was refused, what was reversed, what the AI was never allowed to do.
- Three concrete beats to pick from: the grounding principle (no AI feature until real data existed), the deterministic-versus-LLM split (stats questions answered with zero model calls because arithmetic does not hallucinate), the cost gate (AI refreshes only after 5 days plus 6 units of real taste change, thresholds public in the README).
- One reversal told as a story (the episode-ratings rejection or the Kino rename discovery) lands better than a feature list.
- Close with the links: the live app, the repo, the colophon. Invite people to read the session logs, because the pushback in both directions is the point.
- Length: short enough to read without "see more" fatigue, roughly 150-220 words, line breaks between beats, no hashtag walls (3-4 targeted ones at most).
- Attach 2-3 screenshots: the genre rails over your real library, the stats modal, the colophon page.

## 4. Paste this prompt into the next new chat

```
TellyLog: the LinkedIn post session, the final deliverable. Attach CONTEXT.md and this HANDOVER-NEXT.md. State of play: v2.7.0 deployed at tellylog-3d2u.vercel.app, Vercel build [GREEN/FAILED], CHECKLIST-V2_7_0.md result: [ALL PASSED / list failures]. README read-through: [ACCURATE / needs these corrections].

This session's job: write the LinkedIn post per the draft brief in HANDOVER-NEXT.md section 3, in MY voice, humanly and upbeat. Give me 2-3 variants with different hooks, tell me which one you would post and why, then we refine one together. Confirm the posting-time recommendation against my stated audience. Audit the brief first: if the checklist failed anywhere, we fix the README claims before any post is drafted. Remind me to close around 15 messages.
```

## 5. Standing facts for the next session

Storage key tellylog:v1, rails cache tellylog:rails:v1 (regenerates once on v2.7.0 first load), taste cache tellylog:taste:v1 (same), version 2.7.0, refresh gate 5 days + 6 units in src/lib/refreshGate.js, colophon at #/colophon, PWA installable with a minimal offline shell. Owner-side recurring item: Anthropic credit. Nothing else is owner-blocked.
