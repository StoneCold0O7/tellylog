/* v2.5.0: slimmed to the AI taste summary only. The charts and the
   one-time genre backfill moved into StatsModal on the owner's ruling
   (Profile stays scannable, depth is opt-in). The manual Refresh
   button was removed the same session: the cache already refetches
   whenever the library hash changes, which is the auto-refresh the
   owner asked for; the button only ever rerolled an identical library
   at real API cost. Cache still lives OUTSIDE the tellylog:v1 schema
   (derived data does not belong in backups) and the card renders only
   when /api/health reports the LLM key. */
import React, { useEffect, useState } from 'react';
import * as Store from '../lib/store.js';
import * as AI from '../lib/ai.js';
import { Notice } from './shared.jsx';

const TASTE_KEY = 'tellylog:taste:v1';

/* djb2, good enough to detect "library changed since last summary" */
function hash(str) {
  var h = 5381;
  for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return String(h);
}

export default function InsightsSection() {
  const [llm, setLlm] = useState(false);
  const [taste, setTaste] = useState('');
  const [tasteBusy, setTasteBusy] = useState(false);
  const [tasteErr, setTasteErr] = useState('');

  useEffect(() => {
    let alive = true;
    AI.checkHealth().then((h) => { if (alive && h && h.llm) setLlm(true); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!llm) return;
    const lib = Store.librarySummary();
    if (!lib) return;
    const h = hash(lib);
    try {
      const cached = JSON.parse(localStorage.getItem(TASTE_KEY) || 'null');
      if (cached && cached.h === h && cached.summary) { setTaste(cached.summary); return; }
    } catch (e) { /* fall through to fetch */ }
    let alive = true;
    setTasteBusy(true); setTasteErr('');
    AI.tasteSummary(lib).then((res) => {
      if (!alive) return;
      setTaste(res.summary);
      try { localStorage.setItem(TASTE_KEY, JSON.stringify({ h: h, summary: res.summary, ts: Date.now() })); } catch (e) { /* cache only */ }
      setTasteBusy(false);
    }).catch((e) => {
      if (!alive) return;
      setTasteErr(e.message || 'Could not fetch the summary.');
      setTasteBusy(false);
    });
    return () => { alive = false; };
  }, [llm]);

  if (!llm) return null;

  return (
    <div className="taste-card">
      <div className="taste-card__head">
        <span className="taste-card__title">Your taste, read by Claude</span>
      </div>
      {tasteErr ? <Notice>{tasteErr}</Notice> :
        taste ? <p className="taste-card__body">{taste}</p> :
        tasteBusy ? <p className="taste-card__body taste-card__body--dim">Reading your library…</p> : null}
      <div className="fineprint">Updates by itself whenever your library changes.</div>
    </div>
  );
}
