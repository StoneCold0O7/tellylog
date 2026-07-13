import React from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import * as Store from './lib/store.js';
import App from './components/App.jsx';
import './styles.css';

/* Console colophon. Attribution, not proof: the proof of authorship
   is the commit history and the decision log in this repo. */
try {
  console.log(
    '%cTellyLog%c  designed and directed by Anmol (StoneCold0O7)\n' +
    'Every build decision, reversal and scope-out is on the record:\n' +
    'github.com/StoneCold0O7/tellylog  ·  see SESSION-LOG.md',
    'background:#FFC53D;color:#221A02;font-weight:bold;padding:2px 8px;border-radius:4px',
    'color:inherit'
  );
} catch (e) { /* consoles that dislike %c */ }

/* v2.7.0 PWA: register the minimal offline-shell worker, production
   only so the Vite dev server never fights a stale shell. */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () { /* installability is a bonus, never a blocker */ });
  });
}

Store.load();
/* Vercel Web Analytics: privacy-friendly, cookie-free page-view counts
   plus the custom engagement events fired via track() (title_added,
   explore_opened, ai_ask, install_help_opened). No-ops off Vercel and
   logs to the console in dev; sends only once Web Analytics is enabled
   in the Vercel dashboard. No watch data is ever included. */
createRoot(document.getElementById('root')).render(
  <>
    <App />
    <Analytics />
  </>
);
