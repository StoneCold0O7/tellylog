# TellyLog handover: after v2.7.3. All technical work is DONE pending one short checklist. Next session: the LinkedIn post.

Date: 9 July 2026. Supersedes every earlier handover. Pair with the updated CONTEXT.md and the v2.7.3 zip (which contains BOTH the v2.7.2 and v2.7.3 changes; v2.7.2 was never uploaded separately).

## 1. What to do now, in order

1. Upload the v2.7.3 zip contents to the repo root on GitHub. Deleted files: NONE.
2. Confirm the Vercel build goes green (the vitest suite still rides on it; a failed build is a stop signal, paste the log into a fix session).
3. Run CHECKLIST-V2_7_3.md. It covers this round (no owned titles in AI recommendations, episode rows landing on their episode) AND carries the v2.7.2 items (browse-movies landing, the By show toggle, the profile name), since both rounds deploy together.
4. If everything passes, the LinkedIn session opens clean. If anything fails, the LinkedIn session fixes it FIRST; nothing gets posted over a known bug.

## 2. The caveat carried forward

The final deliverable is a humanly, upbeat LinkedIn post in the OWNER'S voice: professional, warm, human, no emoji walls, no sticker energy, nothing that smells AI-generated or childish. It should show the human side and the AI-strategist side at once. The owner has delivered the full story in his own words; section 3 is that story, structured. The post gets drafted from section 3, not invented.

**Posting time.** Tuesday, Wednesday or Thursday, 8:00-10:00am UK time is the strongest window for a UK-market audience, with midday as the fallback; avoid Friday afternoons and weekends. Recommended: Tuesday or Wednesday, 8:30-9:30am UK, then spend the next hour replying to every comment because early replies drive distribution. [Likely] Aggregate patterns from scheduling studies, not a per-post guarantee.

**Timeliness bonus, verified in-session on 9 July 2026:** the TV Time shutdown (service ends after 15 July 2026, GDPR export until then, announced 1-2 July) is current news covered by TechCrunch, MacRumors and others. Posting BEFORE 15 July rides the news cycle; the shutdown date passing makes the story retrospective. The deploy-verify-post loop for v2.7.2 must therefore run within days, not weeks. [Certain] on the shutdown facts, [Likely] on the news-cycle benefit.

## 3. The owner's story, in his own words (the voice source for the post)

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

Drafting notes: 150-220 words, line breaks between beats, 3-4 targeted hashtags at most, 2-3 screenshots (genre rails on his real library, stats modal, colophon). Do not fabricate details beyond this list. Do not claim his TV Time data was imported (it was not; the history was logged manually). The strongest available hook, flag it to him: TV Time's parent shut the community app to chase enterprise AI; one user's answer was to direct an AI to build the tracker back for himself.

## 4. Paste this prompt into the next new chat

```
TellyLog: the LinkedIn post session, the final deliverable. Attach CONTEXT.md and this HANDOVER-NEXT.md. State of play: v2.7.3 deployed at tellylog-3d2u.vercel.app, Vercel build [GREEN/FAILED], CHECKLIST-V2_7_3.md result: [ALL PASSED / list failures].

This session's job: draft the LinkedIn post from HANDOVER-NEXT.md section 3, in MY voice per the caveat in section 2. Give me 2-3 variants with different hooks, tell me which you would post and why, then we refine one. Confirm the posting-time recommendation and the before-15-July timing point. Audit first: if the checklist failed anywhere, we fix that before any drafting. Remind me to close around 15 messages.
```

## 5. Standing facts

Version 2.7.3. Storage key tellylog:v1, schema UNCHANGED across v2.7.2 and v2.7.3. Real library imported: 2k+ titles, 10.5k+ episodes. Rails cache tellylog:rails:v1, shape-versioned (v:2). Taste cache tellylog:taste:v1. Refresh gate: 5 days + 6 units, src/lib/refreshGate.js. Watchlist: button at the top of Shows, modal. Watched history: Episodes | By show toggle, aggregate via Store.showProgressList(), rewatches never inflate the percent. Explore: go('explore', 'movies') renders TRENDING FILMS first; default stays shows-first. AI surfaces never recommend owned titles: Store.ownsTitle() filters rails (serve, generate, cache-write) and ask picks deterministically; the librarySummary cap makes prompt-only enforcement impossible at import scale. Episode rows open the show modal focused on their own episode (openShow focus {s, e}). Profile: editable name (settings.profileName, 30-char cap, 'You' fallback) plus photo and cover; name is ink-on-surface unless a backdrop image sits behind it. Colophon at #/colophon. PWA installable. First-screen search order is TMDB /search/multi relevance, no local sorting. Owner-side recurring item: Anthropic credit.
