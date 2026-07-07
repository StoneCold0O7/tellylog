/* Shared building blocks. Each mirrors an HTML-string builder from the
   original views.js, keeping identical class names for CSS parity.
   Phase 1.5: the episode cache now stores {name, overview, still,
   airDate} per episode, images fade in on load and skeletons replace
   the plain "Loading" strings. */
import React, { useEffect, useState } from 'react';
import * as TMDB from '../lib/tmdb.js';
import * as U from '../lib/util.js';
import { useApp } from '../context.js';

/* Module-level episode metadata cache shared by the Tonight card, the
   queue rows and the show modal. One tvSeason fetch fills every
   episode of that season. */
const epMetaCache = {};
export function useEpisodeMeta(showId, s, e) {
  const key = showId + '-' + s + '-' + e;
  const [, force] = useState(0);
  useEffect(() => {
    if (epMetaCache[key] != null) return;
    let alive = true;
    TMDB.tvSeason(showId, s).then((season) => {
      (season.episodes || []).forEach((ep) => {
        epMetaCache[showId + '-' + s + '-' + ep.episode_number] = {
          name: ep.name || '',
          overview: ep.overview || '',
          still: ep.still_path || '',
          airDate: ep.air_date || ''
        };
      });
      if (alive) force((n) => n + 1);
    }).catch(() => {});
    return () => { alive = false; };
  }, [key, showId, s]);
  return epMetaCache[key] || null;
}

/* Back-compat name-only hook, now a thin wrapper. */
export function useEpisodeName(showId, s, e) {
  const meta = useEpisodeMeta(showId, s, e);
  return meta ? meta.name : '…';
}

/* Image that fades in once loaded. Dimensions come from the CSS class,
   so nothing shifts while the file arrives. */
export function FadeImg({ src, alt, className }) {
  const [on, setOn] = useState(false);
  return (
    <img
      className={(className || '') + ' img-fade' + (on ? ' img-fade--on' : '')}
      src={src} alt={alt} loading="lazy"
      onLoad={() => setOn(true)}
    />
  );
}

export function Poster({ path, alt, size }) {
  const url = TMDB.img(path, size || 'w185');
  if (!url) return <div className="thumb thumb--empty" aria-hidden="true">📺</div>;
  return <FadeImg className="thumb" src={url} alt={alt} />;
}

/* ---------- Skeletons ---------- */
export function SkeletonCards({ n }) {
  const items = [];
  for (let i = 0; i < (n || 8); i++) {
    items.push(
      <div className="card" key={i} aria-hidden="true">
        <div className="card__img skeleton"></div>
        <div className="card__body">
          <div className="skeleton skeleton--line" style={{ width: '80%' }}></div>
          <div className="skeleton skeleton--line" style={{ width: '45%' }}></div>
        </div>
      </div>
    );
  }
  return <div className="grid">{items}</div>;
}

export function SkeletonRows({ n }) {
  const items = [];
  for (let i = 0; i < (n || 4); i++) {
    items.push(
      <div className="season__ep" key={i} aria-hidden="true">
        <div className="skeleton ep-still"></div>
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton--line" style={{ width: '60%' }}></div>
          <div className="skeleton skeleton--line" style={{ width: '90%' }}></div>
        </div>
      </div>
    );
  }
  return <div>{items}</div>;
}

export function SkeletonLines({ n }) {
  const items = [];
  for (let i = 0; i < (n || 3); i++) {
    items.push(<div className="skeleton skeleton--line" key={i} style={{ width: (90 - i * 18) + '%' }} aria-hidden="true"></div>);
  }
  return <div className="skeleton-block">{items}</div>;
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

/* v2.6.0: title-level star rating (episode-level rejected in the
   Session C audit). Tap the current value again to clear. Feeds
   librarySummary so the taste summary and the Explore rails can tell
   loved from merely finished. */
export function Stars({ value, onSet, label }) {
  return (
    <div className="stars" role="group" aria-label={label || 'Your rating'}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          className={'stars__b' + (n <= value ? ' stars__b--on' : '')}
          aria-label={n + (n === 1 ? ' star' : ' stars') + (n === value ? ', tap to clear' : '')}
          onClick={() => onSet(n === value ? 0 : n)}
        >{n <= value ? '★' : '☆'}</button>
      ))}
    </div>
  );
}
