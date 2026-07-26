/* v2.5.0: the stats popup. Charts moved here from the Profile page on
   the owner's ruling (Profile stays scannable; depth is opt-in behind
   one button). The one-time genre backfill moved WITH the charts, so
   TMDB is only hit when someone actually opens stats, which is
   strictly cheaper than fetching on every Profile visit.
   Interactivity: click a bar, a slice, a legend row or a month point
   to see the titles behind the number. Selection state lives here;
   Charts.jsx stays a pure renderer. */
import React, { useEffect, useState, useRef, useMemo } from 'react';
import * as Store from '../lib/store.js';
import * as TMDB from '../lib/tmdb.js';
import { fmtNumber, fmtTvTime } from '../lib/util.js';
import { useApp } from '../context.js';
import { SectionLabel, Notice } from './shared.jsx';
import { GenreBars, GenreDonut, ActivityLine, fmtHours, paletteFor } from './Charts.jsx';

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

  /* v2.9.0: the heavy store reads are memoised on the store revision (and
     fillDone, which bumps once the genre backfill lands) so drill-down
     clicks do not re-scan a 2k-title library. Same getRev() pattern the
     Shows tab adopted in v2.8.2. */
  const rev = Store.getRev();
  const data = useMemo(() => ({
    all: Store.genreMinutes(false),
    primary: Store.genreMinutes(true),
    months: Store.monthlyMinutes(),
    st: Store.stats(),
    top: Store.topTitles(),
    watchedShows: Store.watchedShowCount()
  }), [rev, fillDone]);
  const { all, primary, months, st, top, watchedShows } = data;
  const hasAny = all.total > 0;

  const covered = all.total - all.unattributed;
  const coverage = all.total ? Math.round((covered / all.total) * 100) : 0;

  /* Headline number: total watch time, TV plus film. This is the same
     rewatch-weighted, estimate-inclusive figure insightsQA reports as
     "total watch time" and the charts sum to; it is only shown BIGGER
     here. The "≈" and the caveat line below keep it honest even in a
     cropped screenshot. */
  const totalMin = st.tvMinutes + st.movieMinutes;
  const totalHours = Math.round(totalMin / 60);
  const span = fmtTvTime(totalMin);
  const spanBits = [];
  if (span.months) spanBits.push(span.months + (span.months === 1 ? ' month' : ' months'));
  if (span.days) spanBits.push(span.days + (span.days === 1 ? ' day' : ' days'));
  const spanLine = spanBits.length ? '≈ ' + spanBits.join(', ') + ' of TV and film' : 'of TV and film';

  const topGenre = all.rows[0] || null;
  const tiles = [
    { key: 'eps', num: fmtNumber(st.episodes), label: st.episodes === 1 ? 'episode' : 'episodes' },
    { key: 'shows', num: fmtNumber(watchedShows), label: watchedShows === 1 ? 'show' : 'shows' },
    { key: 'films', num: fmtNumber(st.moviesWatched), label: st.moviesWatched === 1 ? 'film' : 'films' },
    { key: 'genre', num: topGenre ? topGenre.genre : '—', label: 'top genre', small: true }
  ];

  return (
    <>
      {/* v2.6.0: restyled after an owner-reported light-mode bug, then
          v2.9.0 turned the hero into the headline number. The accent ink
          comes from --link, which is theme-tuned (bright amber in dark, a
          dark gold in light) so the big figure reads in BOTH themes. */}
      <div className="modal__hero modal__hero--stats">
        <button className="modal__close" onClick={closeModal} aria-label="Close">✕</button>
        <div className="stats-hero__eyebrow">YOUR LIBRARY IN NUMBERS</div>
        {hasAny ? (
          <>
            <div className="stats-hero__big">
              <span className="stats-hero__figure">{fmtNumber(totalHours)}</span>
              <span className="stats-hero__unit">hours watched</span>
            </div>
            <div className="stats-hero__sub">{spanLine}</div>
          </>
        ) : (
          <h2 className="modal__title">📊 Your stats</h2>
        )}
      </div>

      <div className="modal__sections">
        {fillProgress ? (
          <Notice>Adding genre data from TMDB… {fillProgress.done} of {fillProgress.total}. Charts sharpen as it finishes.</Notice>
        ) : null}

        {!hasAny && !fillProgress ? (
          <Notice>No watch time logged yet. Charts appear once something is watched.</Notice>
        ) : (
          <>
            <div className="stats-tiles">
              {tiles.map((tile, i) => (
                <div className="stats-tile" key={tile.key} style={{ '--tile': paletteFor(i) }}>
                  <div className={'stats-tile__num' + (tile.small ? ' stats-tile__num--sm' : '')}>{tile.num}</div>
                  <div className="stats-tile__label">{tile.label}</div>
                </div>
              ))}
            </div>

            {top.show && (
              <div className="n1-card">
                <div className="n1-card__eyebrow">YOUR NUMBER ONE</div>
                <div className="n1-card__body">
                  {top.show.poster
                    ? <img className="n1-card__poster" src={TMDB.img(top.show.poster, 'w185')} alt="" />
                    : <div className="n1-card__poster n1-card__poster--none">{(top.show.title || '?').slice(0, 1).toUpperCase()}</div>}
                  <div className="n1-card__meta">
                    <div className="n1-card__name">{top.show.title}</div>
                    <div className="n1-card__stat">{fmtHours(top.show.minutes)}{top.show.rewatch > 1 ? <span className="chip chip--rewatch">×{top.show.rewatch}</span> : null}</div>
                    <div className="n1-card__sub">{fmtNumber(top.show.episodes)} {top.show.episodes === 1 ? 'episode' : 'episodes'} watched</div>
                  </div>
                </div>
              </div>
            )}

            <div className="fineprint fineprint--slab">Totals include rewatch counts and estimate runtime where TMDB has none, so the headline is a close approximation. Tap any bar, slice or point below to see the titles behind a number.</div>

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
