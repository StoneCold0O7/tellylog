# TellyLog: working rules for Claude Code sessions

Read CONTEXT.md (full project history, architecture, schema, rejected directions) and HANDOVER-NEXT.md (current state, next steps) before doing anything. They are the source of truth; this file is only the standing rules.

## Status (13 July 2026)
Every planned deliverable has shipped and is live, including the LinkedIn post (the owner posted it). The app is live at tellylog-3d2u.vercel.app at v2.7.7. The project is in MAINTENANCE MODE: no session is pending, future work is ad-hoc owner requests under the same audit-first contract below. Currently on the owner's radar but NOT yet built: privacy-friendly visitor analytics (Vercel Web Analytics is the leading option).

## Contract
- Audit-first: stress-test every owner proposal before building. Lead with the weakest part. Stop for structural blockers.
- The owner is non-technical: every action he must take gets step-by-step instructions.
- One concern per change. Never refactor untouched code in passing.
- ImportWizard.jsx is under a do-not-touch rule unless the session is explicitly about import. It survived a 2k-title / 10.5k-episode real import; treat it as load-bearing.
- Session close: regenerate CONTEXT.md, HANDOVER-NEXT.md, a SESSION-LOG-Vx_y_z.md and a CHECKLIST-Vx_y_z.md. Bump package.json version.

## Commands
- Tests: `npm test` (node suites + vitest; vitest needs `npm install` once locally, which Claude Code CAN do, unlike the web container).
- Build: `npm run build`. Dev server: `npm run dev`.
- Deploy: push to GitHub main; Vercel builds automatically. A red Vercel build is a stop signal.

## Architecture in one breath
React 18 + Vite SPA, hash routing, ALL user data in localStorage (key tellylog:v1), TMDB via serverless proxy (api/tmdb.js), Claude via api/ask.js (modes: ask, taste, rails) with a documented cost gate (src/lib/refreshGate.js: 5 days + 6 signal units). No backend database, by design. AI recommendation surfaces are deterministically filtered through Store.ownsTitle(); the prompt-level exclusion cannot hold past the librarySummary cap.
