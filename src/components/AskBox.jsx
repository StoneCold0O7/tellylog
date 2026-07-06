/* Phase 2 scaffold: the "ask what to watch" box.
   Renders ONLY when /api/health reports an LLM key on the server, so
   the deployed site is completely unchanged until the Vercel env vars
   exist (see VERCEL-SETUP.md). The question plus a compact library
   summary go to /api/ask; the reply comes back as a short answer and
   up to four picks, each resolved against TMDB so they render as the
   same add-able cards used everywhere else. */
import React, { useEffect, useState } from 'react';
import * as AI from '../lib/ai.js';
import * as Store from '../lib/store.js';
import * as TMDB from '../lib/tmdb.js';
import { SectionLabel, Notice } from './shared.jsx';
import ResultCard from './ResultCard.jsx';

export default function AskBox({ onAdded }) {
  const [enabled, setEnabled] = useState(false);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState('');
  const [cards, setCards] = useState(null);   // null | [{item, reason}]
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    AI.checkHealth().then((h) => { if (alive && h && h.llm) setEnabled(true); });
    return () => { alive = false; };
  }, []);

  if (!enabled) return null;

  function submit() {
    const question = q.trim();
    if (!question || busy) return;
    setBusy(true); setErr(''); setAnswer(''); setCards(null);
    AI.ask(question, Store.librarySummary()).then((res) => {
      setAnswer(res.answer);
      /* Resolve each pick against TMDB so the cards carry real ids,
         posters and add buttons. Unresolvable picks are dropped. */
      return Promise.all(res.picks.map((p) => {
        const search = p.mediaType === 'movie' ? TMDB.searchMovie(p.title, p.year || undefined) : TMDB.searchTV(p.title);
        return search.then((r) => {
          const hit = (r.results || [])[0];
          if (!hit) return null;
          hit.media_type = p.mediaType;
          return { item: hit, reason: p.reason };
        }).catch(() => null);
      }));
    }).then((resolved) => {
      setCards((resolved || []).filter(Boolean));
      setBusy(false);
    }).catch((e) => {
      setErr(e.message || 'Something went wrong.');
      setBusy(false);
    });
  }

  return (
    <div className="askbox">
      <SectionLabel>ASK WHAT TO WATCH</SectionLabel>
      <div className="askbox__row">
        <input
          className="search" type="text" autoComplete="off"
          placeholder="Something funny under 30 minutes an episode…"
          value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        />
        <button className="btn btn--primary askbox__go" onClick={submit} disabled={busy || !q.trim()}>
          {busy ? '…' : 'Ask'}
        </button>
      </div>
      {err ? <Notice>{err}</Notice> : null}
      {answer ? <p className="askbox__answer">{answer}</p> : null}
      {cards && cards.length > 0 && (
        <div className="grid">
          {cards.map((c) => <ResultCard key={c.item.media_type + '-' + c.item.id} item={c.item} onAdded={onAdded} />)}
        </div>
      )}
      {cards && cards.length > 0 && (
        <div className="fineprint">Suggestions come from your own watch history via Claude. Posters and metadata from TMDB.</div>
      )}
    </div>
  );
}
