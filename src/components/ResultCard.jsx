/* Poster result card with an add button. Extracted verbatim from
   ExploreTab in Phase 1 so FirstRun and OnboardingGrid can reuse it.
   onAdded (optional) fires after a successful add. */
import React, { useState } from 'react';
import * as Store from '../lib/store.js';
import * as TMDB from '../lib/tmdb.js';
import { useApp } from '../context.js';
import { Poster } from './shared.jsx';

export default function ResultCard({ item, onAdded }) {
  const { toast, openPreview } = useApp();
  const [busy, setBusy] = useState(false);
  const isTV = item.media_type === 'tv' || item.first_air_date !== undefined;
  const id = item.id;
  const title = isTV ? item.name : item.title;
  const year = ((isTV ? item.first_air_date : item.release_date) || '').slice(0, 4);
  const st = Store.get();
  const tracked = isTV ? !!st.shows[id] : !!st.movies[id];

  function add() {
    setBusy(true);
    if (isTV) {
      TMDB.tvDetails(id).then((d) => {
        Store.addShow(d);
        toast('Now tracking ' + d.name);
        if (onAdded) onAdded();
      }).catch(() => { setBusy(false); toast('Could not add that show.'); });
    } else {
      TMDB.movieDetails(id).then((d) => {
        Store.addMovie(d);
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
          ? <button className="add-btn add-btn--on" disabled aria-label="Already added">✓</button>
          : <button className="add-btn" onClick={add} disabled={busy} aria-label="Add">＋</button>}
      </div>
      <div className="card__body">
        <button className="card__title title-link" onClick={() => openPreview(isTV ? 'tv' : 'movie', id)}>
          {title || ''}<span className="title-link__chev" aria-hidden="true">›</span>
        </button>
        <div className="card__meta">{isTV ? 'TV' : 'Film'}{year ? ' • ' + year : ''}</div>
      </div>
    </article>
  );
}
