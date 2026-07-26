/* Poster result card with an add button. Extracted verbatim from
   ExploreTab in Phase 1 so FirstRun and OnboardingGrid can reuse it.
   onAdded (optional) fires after a successful add. */
import React, { useState } from 'react';
import { track } from '@vercel/analytics';
import * as Store from '../lib/store.js';
import * as TMDB from '../lib/tmdb.js';
import { useApp } from '../context.js';
import { Poster } from './shared.jsx';

export default function ResultCard({ item, onAdded }) {
  const { toast, openPreview, openShow } = useApp();
  const [busy, setBusy] = useState(false);
  const isTV = item.media_type === 'tv' || item.first_air_date !== undefined;
  const id = item.id;
  const title = isTV ? item.name : item.title;
  const year = ((isTV ? item.first_air_date : item.release_date) || '').slice(0, 4);
  const st = Store.get();
  const tracked = isTV ? !!st.shows[id] : !!st.movies[id];
  /* v2.7.9, owner-reported: a show you already track opened the PREVIEW,
     whose only action was "Open in your tracker", so reaching your own
     episode list took two taps for no reason. Tracked shows now go
     straight there. The preview still guards untracked titles, which is
     the Phase 1.6 decision: peeking must never silently add to a library.
     A saved-but-unstarted show keeps the preview, because that is where
     "Start watching" lives. */
  const sh = isTV ? st.shows[id] : null;
  const openTrackerDirect = !!sh && !(sh.watchlist && Store.watchedCount(sh) === 0);

  /* v2.8.1, owner-reported: the green tick was inert. Removing something
     meant opening the title and finding Remove, which is a long way round
     for undoing a mistap.

     One guard the request did not ask for, added deliberately: for a show
     with ticked episodes this deletes real watch history, and a one-tap
     irreversible delete sitting where a mistap already happens is a data
     loss waiting to happen. Untouched titles remove instantly; anything
     carrying history asks first, naming what would be lost. Nothing that
     took effort to record can disappear on a single tap. */
  function untrack() {
    if (isTV) {
      const sh = Store.get().shows[id];
      const seen = sh ? Store.watchedCount(sh) : 0;
      if (seen > 0 && !window.confirm('Remove ' + (title || 'this show') + '?\n\n' + seen + ' watched episode' + (seen === 1 ? '' : 's') + ' will be deleted from your history. This cannot be undone.')) return;
      Store.removeShow(id);
    } else {
      const mv = Store.get().movies[id];
      if (mv && mv.watchedAt && !window.confirm('Remove ' + (title || 'this film') + '?\n\nIt will no longer count as watched.')) return;
      Store.removeMovie(id);
    }
    toast('Removed ' + (title || 'title'));
  }

  function add() {
    setBusy(true);
    if (isTV) {
      TMDB.tvDetails(id).then((d) => {
        Store.addShow(d);
        track('title_added', { kind: 'tv' });
        toast('Now tracking ' + d.name);
        if (onAdded) onAdded();
      }).catch(() => { setBusy(false); toast('Could not add that show.'); });
    } else {
      TMDB.movieDetails(id).then((d) => {
        Store.addMovie(d);
        track('title_added', { kind: 'movie' });
        toast('Added ' + d.title + ' to your watchlist');
        if (onAdded) onAdded();
      }).catch(() => { setBusy(false); toast('Could not add that film.'); });
    }
  }

  return (
    <article className="card">
      <div className="card__img">
        <Poster path={item.poster_path} alt={title} size="w342" />
        {tracked
          ? <button className="add-btn add-btn--on" onClick={untrack} aria-label={'Remove ' + (title || 'this title') + ' from your library'} title="Remove from your library">✓</button>
          : <button className="add-btn" onClick={add} disabled={busy} aria-label="Add">＋</button>}
      </div>
      <div className="card__body">
        <button className="card__title title-link" onClick={() => (openTrackerDirect ? openShow(id) : openPreview(isTV ? 'tv' : 'movie', id))}>
          {title || ''}<span className="title-link__chev" aria-hidden="true">›</span>
        </button>
        <div className="card__meta">{isTV ? 'TV' : 'Film'}{year ? ' • ' + year : ''}</div>
      </div>
    </article>
  );
}
