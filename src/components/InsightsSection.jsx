/* Phase 2b: the INSIGHTS block on the Profile page.
   Owns three jobs:
   1. One-time genre backfill. Records created before v2.4.0 carry no
      genreList; on mount this fetches TMDB details for each missing
      item through the existing queued client (works in proxy AND
      direct mode) and persists names via Store.setGenres. Progress is
      shown; failures are skipped and retried on the next visit. New
      adds and restored NEW backups never need this. Restored OLD
      backups trigger it again, by design.
   2. The charts: minute-weighted genre bars, primary-genre donut,
      monthly activity line. All hand-rolled SVG in Charts.jsx.
   3. The AI taste summary. Appears only when /api/health reports an
      LLM key. Cached in a separate localStorage key (derived data,
      deliberately OUTSIDE the tellylog:v1 backup schema) and only
      refetched when the library summary actually changes or the
      owner presses refresh. */
import React, { useEffect, useState, useRef } from 'react';
import * as Store from '../lib/store.js';
import * as TMDB from '../lib/tmdb.js';
import * as AI from '../lib/ai.js';
import { SectionLabel, Notice } from './shared.jsx';
import { GenreBars, GenreDonut, ActivityLine } from './Charts.jsx';

const TASTE_KEY = 'tellylog:taste:v1';

/* djb2, good enough to detect "library changed since last summary" */
function hash(str) {
  var h = 5381;
  for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return String(h);
}

export default function InsightsSection() {
  const [fillProgress, setFillProgress] = useState(null); // null | {done, total}
  const [fillDone, setFillDone] = useState(0);            // bump to recompute charts
  const [llm, setLlm] = useState(false);
  const [taste, setTaste] = useState('');
  const [tasteBusy, setTasteBusy] = useState(false);
  const [tasteErr, setTasteErr] = useState('');
  const ranFill = useRef(false);

  /* ---- one-time genre backfill ---- */
  useEffect(() => {
    if (ranFill.current) return;
    ranFill.current = true;
    const missing = Store.genreBackfillList();
    if (missing.length === 0) return;
    let alive = true;
    let done = 0;
    setFillProgress({ done: 0, total: missing.length });
    (function next(i) {
      if (!alive || i >= missing.length) {
        if (alive) { setFillProgress(null); setFillDone((n) => n + 1); }
        return;
      }
      const item = missing[i];
      const fetchOne = item.kind === 'movie' ? TMDB.movieDetails(item.id) : TMDB.tvDetails(item.id);
      fetchOne.then((d) => {
        Store.setGenres(item.kind, item.id, (d.genres || []).map((g) => g.name));
      }).catch(() => { /* skip, retried next visit */ }).then(() => {
        done++;
        if (alive) setFillProgress({ done, total: missing.length });
        next(i + 1);
      });
    })(0);
    return () => { alive = false; };
  }, []);

  /* ---- taste summary ---- */
  useEffect(() => {
    let alive = true;
    AI.checkHealth().then((h) => { if (alive && h && h.llm) setLlm(true); });
    return () => { alive = false; };
  }, []);

  function loadTaste(force) {
    const lib = Store.librarySummary();
    if (!lib) return;
    const h = hash(lib);
    if (!force) {
      try {
        const cached = JSON.parse(localStorage.getItem(TASTE_KEY) || 'null');
        if (cached && cached.h === h && cached.summary) { setTaste(cached.summary); return; }
      } catch (e) { /* fall through to fetch */ }
    }
    setTasteBusy(true); setTasteErr('');
    AI.tasteSummary(lib).then((res) => {
      setTaste(res.summary);
      try { localStorage.setItem(TASTE_KEY, JSON.stringify({ h: h, summary: res.summary, ts: Date.now() })); } catch (e) { /* cache only */ }
      setTasteBusy(false);
    }).catch((e) => {
      setTasteErr(e.message || 'Could not fetch the summary.');
      setTasteBusy(false);
    });
  }

  useEffect(() => { if (llm) loadTaste(false); }, [llm, fillDone]);

  /* ---- chart data (recomputed after backfill finishes) ---- */
  const all = Store.genreMinutes(false);
  const primary = Store.genreMinutes(true);
  const months = Store.monthlyMinutes();
  const hasAny = all.total > 0;
  if (!hasAny && !fillProgress) return null;

  const covered = all.total - all.unattributed;
  const coverage = all.total ? Math.round((covered / all.total) * 100) : 0;

  return (
    <>
      <SectionLabel>INSIGHTS</SectionLabel>
      {fillProgress ? (
        <Notice>Adding genre data from TMDB… {fillProgress.done} of {fillProgress.total}. Charts sharpen as it finishes.</Notice>
      ) : null}

      {llm ? (
        <div className="taste-card">
          <div className="taste-card__head">
            <span className="taste-card__title">Your taste, read by Claude</span>
            <button className="btn btn--ghost btn--mini" onClick={() => loadTaste(true)} disabled={tasteBusy}>{tasteBusy ? '…' : 'Refresh'}</button>
          </div>
          {tasteErr ? <Notice>{tasteErr}</Notice> :
            taste ? <p className="taste-card__body">{taste}</p> :
            tasteBusy ? <p className="taste-card__body taste-card__body--dim">Reading your library…</p> : null}
        </div>
      ) : null}

      {all.rows.length > 0 && (
        <div className="chart-card">
          <div className="chart-card__title">Hours by genre</div>
          <GenreBars rows={all.rows} />
          <div className="fineprint">A title counts toward every genre it carries, so bars overlap and are not shares of a whole.{coverage < 100 ? ' Genre data covers ' + coverage + '% of watch time so far.' : ''}</div>
        </div>
      )}

      {primary.rows.length > 0 && (
        <div className="chart-card">
          <div className="chart-card__title">Watch time by primary genre</div>
          <GenreDonut rows={primary.rows} />
          <div className="fineprint">Each title counted once, under its first TMDB genre, so slices sum to 100%.</div>
        </div>
      )}

      {months.length > 1 && (
        <div className="chart-card">
          <div className="chart-card__title">Watch activity by month</div>
          <ActivityLine months={months} />
          <div className="fineprint">Based on when episodes were logged. Imports keep their original dates; bulk season ticks land in the month you ticked them.</div>
        </div>
      )}
    </>
  );
}
