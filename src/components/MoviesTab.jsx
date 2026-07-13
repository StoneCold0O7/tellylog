/* Films tab: watchlist / watched subtabs. Mirrors renderMovies. */
import React from 'react';
import * as Store from '../lib/store.js';
import * as U from '../lib/util.js';
import { useApp } from '../context.js';
import { Poster, CheckBtn, EmptyState } from './shared.jsx';

export default function MoviesTab() {
  const { moviesSub: sub, setMoviesSub, go, openPreview } = useApp();
  const st = Store.get();
  const all = Object.keys(st.movies).map((id) => st.movies[id]);
  const list = sub === 'watchlist'
    ? all.filter((m) => !m.watchedAt)
    : all.filter((m) => !!m.watchedAt);
  list.sort((a, b) => (b.watchedAt || b.added) - (a.watchedAt || a.added));

  const installTag = (
    <div className="install-tagrow">
      <button className="install-tag" onClick={() => go('profile', 'install')}>
        📱 Add this app to your phone
      </button>
    </div>
  );

  const toggle = (
    <div className="subtabs">
      <button className={'subtab' + (sub === 'watchlist' ? ' subtab--on' : '')} onClick={() => setMoviesSub('watchlist')}>Watch list</button>
      <button className={'subtab' + (sub === 'watched' ? ' subtab--on' : '')} onClick={() => setMoviesSub('watched')}>Watched</button>
    </div>
  );

  if (list.length === 0) {
    return (
      <>
        {installTag}
        {toggle}
        {sub === 'watchlist' ? (
          <EmptyState title="Your watchlist is empty!" sub="Add movies you want to watch.">
            <div className="empty__actions"><button className="btn btn--primary" onClick={() => go('explore', 'movies')}>Browse all movies</button></div>
          </EmptyState>
        ) : (
          <EmptyState title="No movies watched yet" sub="Mark a movie as watched and it shows up here." />
        )}
      </>
    );
  }

  return (
    <>
      {installTag}
      {toggle}
      {list.map((m) => {
        const meta = [U.fmtRuntime(m.runtime), m.genres].filter(Boolean).join(' • ');
        return (
          <article className="ep-row" key={m.id}>
            <button className="ep-row__poster" onClick={() => openPreview('movie', m.id)}><Poster path={m.poster} alt={m.title} /></button>
            <div className="ep-row__body">
              <button className="ep-row__title title-link" onClick={() => openPreview('movie', m.id)}>
                {m.title}<span className="title-link__chev" aria-hidden="true">›</span>
              </button>
              <div className="ep-row__name">{meta}</div>
              {m.watchedAt ? <div className="ep-row__meta">Watched {U.fmtDate(m.watchedAt)}</div> : null}
            </div>
            <div className="ep-row__actions">
              <CheckBtn checked={!!m.watchedAt} onClick={() => Store.setMovieWatched(m.id, !m.watchedAt)} />
              <button className="icon-btn" onClick={() => Store.removeMovie(m.id)} aria-label="Remove movie">✕</button>
            </div>
          </article>
        );
      })}
    </>
  );
}
