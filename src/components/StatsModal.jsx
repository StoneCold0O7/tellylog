/* v2.5.0: the stats popup. Charts moved here from the Profile page on
   the owner's ruling (Profile stays scannable; depth is opt-in behind
   one button). The one-time genre backfill moved WITH the charts, so
   TMDB is only hit when someone actually opens stats, which is
   strictly cheaper than fetching on every Profile visit.
   Interactivity: click a bar, a slice, a legend row or a month point
   to see the titles behind the number. Selection state lives here;
   Charts.jsx stays a pure renderer. */
import React, { useEffect, useState, useRef } from 'react';
import * as Store from '../lib/store.js';
import * as TMDB from '../lib/tmdb.js';
import { useApp } from '../context.js';
import { SectionLabel, Notice } from './shared.jsx';
import { GenreBars, GenreDonut, ActivityLine, fmtHours } from './Charts.jsx';

function TitleList({ items, caption }) {
  if (!items || items.length === 0) return <Notice>Nothing attributed here yet.</Notice>;
  /* v2.6.0 fix, owner-reported: a film is a film, never "1 ep". The
     label is kind-aware and a rewatch count shows as a ×N chip (genre
     drill-downs only; the month list omits it because rewatches carry
     no dates and never land in a month). */
  function label(t) {
    const parts = [];
    if (t.kind === 'movie') parts.push('film');
    else if (t.count) parts.push(t.count + (t.count === 1 ? ' ep' : ' eps'));
    parts.push(fmtHours(t.minutes));
    return parts.join(' · ');
  }
  return (
    <div className="drill">
      <div className="drill__caption">{caption}</div>
      <ul className="drill__list">
        {items.slice(0, 12).map((t) => (
          <li className="drill__row" key={t.kind + t.title}>
            <span className="drill__name">{t.kind === 'movie' ? '🎬 ' : '📺 '}{t.title}{t.rewatch > 1 ? <span className="chip chip--rewatch">×{t.rewatch}</span> : null}</span>
            <span className="drill__mins">{label(t)}</span>
          </li>
        ))}
        {items.length > 12 && <li className="drill__row drill__row--more">+ {items.length - 12} more</li>}
      </ul>
    </div>
  );
}

export default function StatsModal() {
  const { closeModal } = useApp();
  const [fillProgress, setFillProgress] = useState(null); // null | {done, total}
  const [fillDone, setFillDone] = useState(0);            // bump to recompute charts
  const [barPick, setBarPick] = useState(null);           // genre string | null
  const [donutPick, setDonutPick] = useState(null);       // genre string | null
  const [monthPick, setMonthPick] = useState(null);       // 'YYYY-MM' | null
  const ranFill = useRef(false);

  /* One-time genre backfill, moved here from the Profile page. Records
     created before v2.4.0 carry no genreList; this fetches TMDB
     details for each missing item through the existing queued client
     (works in proxy AND direct mode). Failures are skipped and retried
     next open. New adds never need this. */
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
      }).catch(() => { /* skip, retried next open */ }).then(() => {
        done++;
        if (alive) setFillProgress({ done, total: missing.length });
        next(i + 1);
      });
    })(0);
    return () => { alive = false; };
  }, []);

  /* fillDone in deps: recompute after the backfill lands */
  const all = Store.genreMinutes(false);
  const primary = Store.genreMinutes(true);
  const months = Store.monthlyMinutes();
  const hasAny = all.total > 0;
  void fillDone;

  const covered = all.total - all.unattributed;
  const coverage = all.total ? Math.round((covered / all.total) * 100) : 0;

  return (
    <>
      {/* v2.6.0: restyled after an owner-reported light-mode bug. The
          old --plain hero kept .modal__hero's on-media (near-white)
          text on a light surface, so the title merged into the
          background. This variant colours with theme ink over an
          accent gradient, so it reads in BOTH themes by construction. */}
      <div className="modal__hero modal__hero--stats">
        <button className="modal__close" onClick={closeModal} aria-label="Close">✕</button>
        <div className="stats-hero__eyebrow">YOUR LIBRARY IN NUMBERS</div>
        <h2 className="modal__title">📊 Your stats</h2>
        <div className="modal__meta">Tap a bar, a slice or a point on the line to see the titles behind it.</div>
      </div>

      <div className="modal__sections">
        {fillProgress ? (
          <Notice>Adding genre data from TMDB… {fillProgress.done} of {fillProgress.total}. Charts sharpen as it finishes.</Notice>
        ) : null}

        {!hasAny && !fillProgress ? (
          <Notice>No watch time logged yet. Charts appear once something is watched.</Notice>
        ) : (
          <>
            {all.rows.length > 0 && (
              <div className="chart-card">
                <div className="chart-card__title">Hours by genre</div>
                <GenreBars rows={all.rows} selected={barPick} onSelect={(g) => { setBarPick(g); setDonutPick(null); }} />
                {barPick && <TitleList items={Store.genreTitles(barPick, false)} caption={'Titles counted under ' + barPick} />}
                <div className="fineprint">A title counts toward every genre it carries, so bars overlap and are not shares of a whole. A rewatch count multiplies a title's minutes.{coverage < 100 ? ' Genre data covers ' + coverage + '% of watch time so far.' : ''}</div>
              </div>
            )}

            {primary.rows.length > 0 && (
              <div className="chart-card">
                <div className="chart-card__title">Watch time by primary genre</div>
                <GenreDonut rows={primary.rows} selected={donutPick} onSelect={(g) => { setDonutPick(g); setBarPick(null); }} />
                {donutPick && <TitleList items={Store.genreTitles(donutPick, true)} caption={'Titles whose primary genre is ' + donutPick} />}
                <div className="fineprint">Each title counted once, under its first TMDB genre, so slices sum to 100%. A rewatch count multiplies a title's minutes.</div>
              </div>
            )}

            {months.length > 1 && (
              <div className="chart-card">
                <div className="chart-card__title">Watch activity by month</div>
                <ActivityLine months={months} selectedKey={monthPick} onSelect={setMonthPick} />
                {monthPick && <TitleList items={Store.monthTitles(monthPick)} caption={'Logged in ' + monthPick} />}
                <div className="fineprint">Based on when episodes were logged. Imports keep their original dates; bulk season ticks land in the month you ticked them. Rewatch counts carry no dates, so they are not shown here.</div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
