/* Shared building blocks. Each mirrors an HTML-string builder from the
   original views.js, keeping identical class names for CSS parity. */
import React, { useEffect, useState } from 'react';
import * as TMDB from '../lib/tmdb.js';
import * as U from '../lib/util.js';
import { useApp } from '../context.js';

/* Module-level episode-name cache shared by the Tonight card and the
   queue rows (was previously local to ShowsTab). */
const epNameCache = {};
export function useEpisodeName(showId, s, e) {
  const key = showId + '-' + s + '-' + e;
  const [, force] = useState(0);
  useEffect(() => {
    if (epNameCache[key] != null) return;
    let alive = true;
    TMDB.tvSeason(showId, s).then((season) => {
      (season.episodes || []).forEach((ep) => {
        epNameCache[showId + '-' + s + '-' + ep.episode_number] = ep.name || '';
      });
      if (alive) force((n) => n + 1);
    }).catch(() => {});
    return () => { alive = false; };
  }, [key, showId, s]);
  return epNameCache[key] != null ? epNameCache[key] : '…';
}

export function Poster({ path, alt, size }) {
  const url = TMDB.img(path, size || 'w185');
  if (!url) return <div className="thumb thumb--empty" aria-hidden="true">📺</div>;
  return <img className="thumb" src={url} alt={alt} loading="lazy" />;
}

export function SectionLabel({ children }) {
  return <div className="section-label"><span>{children}</span></div>;
}

export function CheckBtn({ checked, small, onClick, disabled }) {
  return (
    <button
      className={'check ' + (checked ? 'check--on ' : '') + (small ? 'check--small' : '')}
      aria-label={checked ? 'Mark as unwatched' : 'Mark as watched'}
      onClick={onClick}
      disabled={disabled}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
    </button>
  );
}

/* Episode row used by Shows history, Watch Next and stale sections. */
export function EpRow({ show, s, e, remaining, epName, badge, checked, onToggle }) {
  const { openShow } = useApp();
  const rem = remaining != null && remaining > 1
    ? <span className="rem">+{remaining - 1}</span> : null;
  return (
    <article className={'ep-row' + (checked ? ' ep-row--watched' : '')}>
      <button className="ep-row__poster" onClick={() => openShow(show.id)}>
        <Poster path={show.poster} alt={show.name} />
      </button>
      <div className="ep-row__body">
        <button className="show-pill" onClick={() => openShow(show.id)}>
          {show.name.toUpperCase()} <span className="show-pill__chev">›</span>
        </button>
        <div className="ep-row__se">{U.seLabel(s, e)} {rem}</div>
        {epName ? <div className="ep-row__name">{epName}</div> : null}
        {badge ? <span className="badge">{badge}</span> : null}
      </div>
      <CheckBtn checked={!!checked} onClick={onToggle} />
    </article>
  );
}

export function EmptyState({ title, sub, children }) {
  return (
    <div className="empty">
      <h2 className="empty__title">{title}</h2>
      <div className="empty__art" aria-hidden="true"><span>🍿</span></div>
      <p className="empty__sub">{sub}</p>
      {children}
    </div>
  );
}

export function Counter({ n, label }) {
  return <div className="counter"><div className="counter__num">{n}</div><div className="counter__label">{label}</div></div>;
}

export function apiErrorText(err) {
  if (err && err.message === 'NO_KEY') return 'Add your TMDB API key in Profile to search and browse.';
  if (err && err.message === 'BAD_KEY') return 'Your TMDB API key was rejected. Check it in Profile.';
  return 'Could not reach TMDB. Check your connection and try again.';
}

export function Notice({ children }) {
  return <div className="notice">{children}</div>;
}
