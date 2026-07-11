# TellyLog handover: after v2.7.4. All technical work is DONE pending one short checklist. Next session: the LinkedIn post.

Date: 11 July 2026. Supersedes every earlier handover. Pair with the updated CONTEXT.md and the v2.7.4 zip.

## 1. What to do now, in order

1. Upload the v2.7.4 zip contents to the repo root on GitHub. Deleted files: NONE.
2. Confirm the Vercel build goes green (the vitest suite still rides on it; a failed build is a stop signal, paste the log into a fix session).
3. Run CHECKLIST-V2_7_4.md. The headline check: the Explore rails render 4 to 5 cards each again on your real library, no owned titles, honest top-up captions where the backfill ran. It also carries a quick regression pass on the v2.7.2 and v2.7.3 items.
4. If everything passes, the LinkedIn session opens clean. If anything fails, the LinkedIn session fixes it FIRST; nothing gets posted over a known bug.

## 2. What v2.7.4 changed (one paragraph)

The post-import one-card rails were the v2.7.3 owned-title filter working correctly on a starved input: the model only ever sees ~50 library titles, so at 2k+ owned its obvious picks were mostly owned and the filter ate them. Fix, three parts at fraction-of-a-penny cost: the model over-generates 10 to 12 picks per rail (UI shows the first 5 survivors, surplus cached as reserve), each genre anchor now carries the owned titles in that genre so picks stop landing on owned territory and rails still short after filtering are topped up deterministically from TMDB discover at zero model cost with an honest caption. Sending the whole library to the model was costed (pennies) and rejected on architecture, on the record in SESSION-LOG-V2_7_4.md. Rails cache shape bumped to v:3, so the first Explore visit after deploy regenerates once, immediately.

## 3. The caveat carried forward

The final deliverable is a humanly, upbeat LinkedIn post in the OWNER'S voice: professional, warm, human, no emoji walls, no sticker energy, nothing that smells AI-generated or childish. It should show the human side and the AI-strategist side at once. The owner has delivered the full story in his own words; section 4 is that story, structured. The post gets drafted from section 4, not invented.

**Posting time.** Tuesday, Wednesday or Thursday, 8:00-10:00am UK time is the strongest window for a UK-market audience, with midday as the fallback; avoid Friday afternoons and weekends. Recommended: Tuesday or Wednesday, 8:30-9:30am UK, then spend the next hour replying to every comment because early replies drive distribution. [Likely] Aggregate patterns from scheduling studies, not a per-post guarantee.

**Timeliness, re-checked against the calendar:** the TV Time shutdown lands after 15 July 2026. Today is 11 July. The deploy-verify-post loop for v2.7.4 must run within DAYS: posting before 15 July rides the news cycle; after it the story turns retrospective. [Certain] on the shutdown date as verified 9 July, [Likely] on the news-cycle benefit.

## 4. The owner's story, in his own words (the voice source for the post)

- Using TV Time since 2016: tracking shows, next episodes, next seasons. The community side was the soul of it: episode comments, spoilers, character favourability votes, where-to-watch, crowd reactions, ratings, the funny posts after each episode.
- The undergrad ritual: comparing with uni friends who had watched more minutes, more episodes, more series, more films. Young-people-being-chill energy; keep it.
- Last week: the in-app notification that TV Time closes permanently on 15 July, data downloadable on request. It genuinely made him sad, melancholic. That word choice is his; keep the sentiment honest, not performative.
- He talked to those same uni friends. ONE FRIEND suggested: why not build your own AI app on local storage? The owner wants that friend credited in the post.
- The fate part: he noticed the newest Claude model was included in his plan, thought "let's put my boards up" and see what he could make.
- The bridge from work: he had been working with an AI chatbot project professionally and wanted AI in his personal life too.
- What he actually did: brainstormed, set guardrails, strategized the why (foster that community again, ship an MVP his friends could use). Five planned phases that became, in his words, a one-man scrum ceremony with Claude: refinement sessions, retrospectives, things pushed to later waves, A/B checks, weeding out bugs, iterating until viable.
- The honest budget angle: he set a monetary ceiling and guardrails on how many LLM calls the product may make, so it stays budget-friendly; all documented in the README. Trade-offs written down deliberately: he chose not to scale now but knows exactly how he would.
- The ask: live app plus GitHub repo linked; he would love his LinkedIn community to try it and comment with their experience.
- Sign-off sentiment: this was fun and personal; "I hope you enjoy using it as much as I enjoyed making it."

Drafting notes: 150-220 words, line breaks between beats, 3-4 targeted hashtags at most, 2-3 screenshots (genre rails on his real library, stats modal, colophon). Do not fabricate details beyond this list. UPDATE from the stale v2.7.3 note: the real TV Time history IS now imported (2k+ titles, 10.5k+ episodes, v2.7.3), so the post may truthfully say his decade of history lives in the app; the earlier manual top-50 campaign preceded it and both are true. The strongest available hook, flag it to him: TV Time's parent shut the community app to chase enterprise AI; one user's answer was to direct an AI to build the tracker back for himself.

## 5. Paste this prompt into the next new chat

```
TellyLog: the LinkedIn post session, the final deliverable. Attach CONTEXT.md and this HANDOVER-NEXT.md. State of play: v2.7.4 deployed at tellylog-3d2u.vercel.app, Vercel build [GREEN/FAILED], CHECKLIST-V2_7_4.md result: [ALL PASSED / list failures].

This session's job: draft the LinkedIn post from HANDOVER-NEXT.md section 4, in MY voice per the caveat in section 3. Give me 2-3 variants with different hooks, tell me which you would post and why, then we refine one. Confirm the posting-time recommendation and the before-15-July timing point. Audit first: if the checklist failed anywhere, we fix that before any drafting. Remind me to close around 15 messages.
```

## 6. Standing facts

Version 2.7.4. Storage key tellylog:v1, schema UNCHANGED across v2.7.2, v2.7.3 and v2.7.4. Real library imported: 2k+ titles, 10.5k+ episodes. Rails cache tellylog:rails:v1, shape-versioned (v:3 as of this round; a bump regenerates on next visit). Taste cache tellylog:taste:v1. Refresh gate: 5 days + 6 units, src/lib/refreshGate.js. AI surfaces never recommend owned titles: Store.ownsTitle() filters rails (serve, generate, cache-write) and ask picks deterministically; v2.7.4 adds over-generation (10-12 picks, show 5), per-genre owned exclusions in the prompt (Store.ownedTitlesInGenre) and a captioned TMDB-discover backfill for rails under 4 cards. Watchlist: button at the top of Shows, modal. Watched history: Episodes | By show toggle, aggregate via Store.showProgressList(), rewatches never inflate the percent. Explore: go('explore', 'movies') renders TRENDING FILMS first; default stays shows-first. Episode rows open the show modal focused on their own episode (openShow focus {s, e}). Profile: editable name (settings.profileName, 30-char cap, 'You' fallback) plus photo and cover; name is ink-on-surface unless a backdrop image sits behind it. Colophon at #/colophon. PWA installable. First-screen search order is TMDB /search/multi relevance, no local sorting. Owner-side recurring item: Anthropic credit.
