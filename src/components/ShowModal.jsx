/* Show detail modal. Mirrors renderShowModal + renderSeasonEpisodes.
   Season open/closed state and loaded episode lists live in component
   state, so they survive re-renders (the original re-clicked open
   accordions after innerHTML refresh). */
import React, { useState } from 'react';
import * as Store from '../lib/store.js';
import * as TMDB from '../lib/tmdb.js';
import * as U from '../lib/util.js';
import { useApp } from '../context.js';
import { CheckBtn, Notice } from './shared.jsx';

function Season({ sh, s, count }) {
  const [open, setOpen] = useState(false);
  const [eps, setEps] = useState(null);       // null=not loaded, []=loaded empty
  const [err, setErr] = useState(false);
  const seenS = (sh.watched[s] || []).length;

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next && eps === null && !err) {
      TMDB.tvSeason(sh.id, s).then((season) => {
        setEps(season.episodes || []);
      }).catch(() => setErr(true));
    }
  }

  return (
    <div className="season">
      <button className="season__head" onClick={toggleOpen}>
        <span>Season {s}</span>
        <span className="season__count">{seenS} / {count}</span>
        <span className="season__chev">▾</span>
      </button>
      {open && (
        <div className="season__body">
          <button className="btn btn--tiny" onClick={() => Store.markSeason(sh.id, s, count, seenS !== count)}>
            {seenS === count ? 'Unmark season' : 'Mark season watched'}
          </button>
          <div className="season__eps">
            {err ? <Notice>Could not load episodes.</Notice> :
              eps === null ? <div className="loading">Loading episodes…</div> :
              eps.map((ep) => {
                const watched = Store.isWatched(sh, s, ep.episode_number);
                return (
                  <div className="season__ep" key={ep.episode_number}>
                    <div className="season__ep-label">{U.seLabel(s, ep.episode_number)}</div>
                    <div className="season__ep-name">{ep.name || ''}</div>
                    <CheckBtn small checked={watched} onClick={() => Store.markEpisode(sh.id, s, ep.episode_number, !watched)} />
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShowModal({ id }) {
  const { closeModal, toast } = useApp();
  const sh = Store.get().shows[id];
  if (!sh) return null;

  const total = Store.totalEpisodes(sh);
  const seen = Store.watchedCount(sh);
  const pct = total ? Math.round(100 * seen / total) : 0;
  const seasonNums = Object.keys(sh.seasons).map(Number).sort((a, b) => a - b);
  const backdrop = sh.backdrop ? TMDB.img(sh.backdrop, 'w780') : '';

  function markAll() {
    Object.keys(sh.seasons).forEach((sn) => {
      Store.markSeason(sh.id, Number(sn), sh.seasons[sn], true);
    });
  }

  function archive() {
    Store.setArchived(sh.id, !sh.archived);
    toast(Store.get().shows[id].archived ? 'Archived. It keeps counting in your stats.' : 'Unarchived.');
  }

  function remove() {
    if (confirm('Stop tracking ' + sh.name + '? Its watch history and stats are deleted. Archive instead if you only want it out of Watch Next.')) {
      Store.removeShow(sh.id);
      closeModal();
    }
  }

  return (
    <>
      <div className="modal__hero" style={backdrop ? { backgroundImage: "linear-gradient(rgba(10,10,14,.4),rgba(10,10,14,.95)),url('" + backdrop + "')" } : undefined}>
        <button className="modal__close" onClick={closeModal} aria-label="Close">✕</button>
        <h2 className="modal__title">{sh.name}</h2>
        <div className="modal__meta">{[sh.status, sh.network, U.fmtRuntime(sh.avgRuntime) + ' / ep'].filter(Boolean).join(' • ')}</div>
      </div>
      <div className="progress"><div className="progress__bar" style={{ width: pct + '%' }}></div></div>
      <div className="modal__stats">{seen} of {total} episodes watched ({pct}%)</div>
      <div className="modal__actions">
        <button className="btn btn--tiny" onClick={markAll}>Mark all watched</button>
        <button className="btn btn--tiny btn--ghost" onClick={archive}>{sh.archived ? 'Unarchive' : 'Archive'}</button>
        <button className="btn btn--tiny btn--danger" onClick={remove}>Stop tracking</button>
      </div>
      <div className="modal__seasons">
        {seasonNums.map((s) => <Season key={s} sh={sh} s={s} count={sh.seasons[s]} />)}
      </div>
    </>
  );
}
