# SESSION LOG v2.7.6, the two small UX changes (13 July 2026)

First Claude Code session since v2.7.5 to touch product source. Two owner-requested changes, both small, both built and verified live in a local preview before the push. No schema change, ImportWizard untouched, no test rewrites (the existing suite still passes unchanged). The LinkedIn post is still the one non-optional deliverable and is untouched here.

## 1. The brief and the audit

Two requests. ONE: a persistent, underlined, highlighted tag on the Shows tab and the Films tab that leads to step-by-step instructions for adding the app to a phone home screen. On Profile the instructions sit behind an opt-in control (the owner's reference was "like the stats or data import section"); arriving from the tag opens them straight away. TWO: a clear (✕) button beside the mic in the search bars so a query can be wiped in one tap instead of reopening the keyboard and holding backspace, "in all three search bars."

The audit raised three things before any code. [Certain] "All three search bars" does not map cleanly: there are FOUR mic-equipped inputs, not three (Explore search, the Explore "Ask what to watch" box, the Profile "Ask your stats" box, plus the first-run search that only shows on an empty library). Recommendation, accepted implicitly by the "build both" go-ahead: put the ✕ on all of them, so whichever three the owner meant are covered and nothing is inconsistent. [Likely] the install steps are phone-and-browser specific and can only be shown, not performed, so the copy names iPhone/Safari and Android/Chrome separately with an honest in-app-browser caveat. [Certain] the stats and data "sections" the owner referenced are actually popups, so the first build made the install instructions a popup too, and flagged it.

The owner then ruled on the popup point: make the install instructions INLINE, an accordion that expands in place on Profile, not a popup. The first build's `InstallModal` was removed (not left dead) and rebuilt as an inline fold-out. Both the recommendation and the ruling are on the record here.

## 2. Change one, add to your phone (inline)

A new `InstallSteps.jsx` holds the instructions body only (no modal chrome): an intro line, an iPhone/Safari block, an Android/Chrome block, each a numbered list, plus the in-app-browser fineprint. On Profile a new `ADD TO YOUR PHONE` section renders an `install-inline` fold-out: a full-width toggle button with a rotating chevron, collapsed by default, the same opt-in affordance as the Archived section on Shows. `InstallSteps` renders below it only when open.

The tag itself (`install-tag`, underlined, accent-wash highlight) sits at the top of both the Shows tab and the Films tab. It calls `go('profile', 'install')`. The second argument is the existing generic nav-focus that Explore already uses for its films-first arrival (`exploreFocus`); ProfileTab reads it (aliased `navFocus`) to seed the fold-out open on mount, so arriving from the tag lands on Profile with the steps already expanded, while a plain Profile visit passes nothing and stays collapsed. No new app-level state, no new context field: the same one-argument-to-`go` channel that shipped in v2.7.2 carries this. [Certain]

`App.jsx` netted to zero change: the popup wiring was added in the first build then removed for the inline rebuild, so the committed diff does not touch it.

## 3. Change two, the clear button (all four inputs)

A new `ClearButton.jsx` mirrors `MicButton`: a small ✕ positioned just left of the mic. Each parent renders it only when its field has text and owns the actual clear, because each field resets differently (the two search fields also clear their results, the two ask boxes only clear the text). `onMouseDown` preventDefault keeps focus on the input, so on a phone the keyboard stays open and the next query types straight in, which is the exact pain the owner reported. The input gains a `search--clearable` class while text is present, widening its right padding so the text never runs under the two controls, and the browser's own `type=search` clear is suppressed in CSS so there is only ever one ✕.

Wired into all four: `ExploreTab`, `FirstRun`, `AskBox`, `StatsAsk`. [Certain] on the three exercised live; [Likely] identical on `AskBox`, which only renders when the serverless LLM key is present so a local run cannot mount it, and on `FirstRun`, which needs an empty library. Both use the same component and the compile is clean.

## 4. Test, build and live verification

Full suite green in Claude Code: 112 node (40 + 63 + 9), 26 of 26 vitest. `vite build` clean, 67 modules. No test was added: no schema change and no new pure logic, so the new surfaces are React-only and were verified by driving them rather than by unit assertions. [Likely] worth a follow-up: a `ClearButton` render test in the `mic.test.jsx` mould, offered to the owner, not built unasked.

Live-verified against a seeded library on a local dev server (the deployed site is the owner's post-push check). The tag renders on both tabs; from Shows it lands on `#/profile` with the fold-out expanded and no modal in the DOM; a plain Profile visit starts collapsed and the toggle expands and collapses in place. The ✕ appears with text in the Explore search and the Profile stats-ask, one tap empties the field, the input keeps focus, the ✕ then disappears. A fresh browser tab loads the current code with zero console errors. One environment note: the screenshot tool timed out repeatedly this session, so the proof is the live accessibility tree and DOM reads, not images.

## 5. Files

New: `src/components/ClearButton.jsx`, `src/components/InstallSteps.jsx`. Changed: `ProfileTab.jsx`, `ShowsTab.jsx`, `MoviesTab.jsx`, `ExploreTab.jsx`, `FirstRun.jsx`, `AskBox.jsx`, `StatsAsk.jsx`, `styles.css`, `package.json`. Deleted: NONE in the committed tree (`InstallModal.jsx` existed only within this session and was removed before commit). ImportWizard untouched, schema unchanged. CHECKLIST-V2_7_6.md carries the owner's browser walk-through.
