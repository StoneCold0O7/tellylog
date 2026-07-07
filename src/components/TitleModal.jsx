/* Title preview modal (Phase 1.6).
   Opens from any card title, film row or more-like-this rail and shows
   full TMDB detail for a TV show or film WITHOUT tracking it first:
   hero, genres, synopsis, read-only season list, cast, where to watch,
   trailers and a more-like-this rail of further previews. Tracking is
   an explicit button. Tracked titles get their normal actions here too
   (films finally have a detail view; shows hand off to the tracker
   modal). All data is licensed TMDB; every fetch fails soft. */
import React, { useState, useEffect } from 'react';
import * as Store from '../lib/store.js';
import * as TMDB from '../lib/tmdb.js';
import * as U from '../lib/util.js';
import { useApp } from '../context.js';
import { Notice, SectionLabel, FadeImg, SkeletonLines, CheckBtn, Stars } from './shared.jsx';

export default function TitleModal({ media, id }) {
  const { closeModal, openShow, openPreview, toast } = useApp();
  const isTV = media === 'tv';

  const [details, setDetails] = useState(undefined);   // undefined=loading, null=failed
  const [credits, setCredits] = useState(undefined);
  const [providers, setProviders] = useState(undefined);
  const [videos, setVideos] = useState(undefined);
  const [recs, setRecs] = useState(undefined);
  const [busy, setBusy] = useState(false);

  const st = Store.get();
  const trackedShow = isTV ? st.shows[id] : null;
  const trackedMovie = !isTV ? st.movies[id] : null;

  useEffect(() => {
    let alive = true;
    const grab = (p, set, pick) => p.then((d) => { if (alive) set(pick ? pick(d) : d); })
      .catch(() => { if (alive) set(null); });
    if (isTV) {
      grab(TMDB.tvDetails(id), setDetails);
      grab(TMDB.tvCredits(id), setCredits, (d) => (d.cast || []).slice(0, 12));
      grab(TMDB.tvProviders(id), setProviders, (d) => U.providersWithLink(d.results && d.results.GB));
      grab(TMDB.tvVideos(id), setVideos, (d) => U.pickVideos(d.results, 6));
      grab(TMDB.tvRecommendations(id), setRecs, (d) => (d.results || []).filter((r) => r.poster_path).slice(0, 10));
    } else {
      grab(TMDB.movieDetails(id), setDetails);
      grab(TMDB.movieCredits(id), setCredits, (d) => (d.cast || []).slice(0, 12));
      grab(TMDB.movieProviders(id), setProviders, (d) => U.providersWithLink(d.results && d.results.GB));
      grab(TMDB.movieVideos(id), setVideos, (d) => U.pickVideos(d.results, 6));
      grab(TMDB.movieRecommendations(id), setRecs, (d) => (d.results || []).filter((r) => r.poster_path).slice(0, 10));
    }
    return () => { alive = false; };
  }, [id, isTV]);

  function trackShow() {
    setBusy(true);
    TMDB.tvDetails(id).then((d) => {
      Store.addShow(d);
      toast('Now tracking ' + d.name);
      openShow(id); // swap to the full tracker modal
    }).catch(() => { setBusy(false); toast('Could not add that show.'); });
  }

  /* v2.5.0: parity with films. Saves the show without opening the
     tracker; it lives in the WATCHLIST section until started. */
  function watchlistShow() {
    setBusy(true);
    TMDB.tvDetails(id).then((d) => {
      Store.addShowToWatchlist(d);
      setBusy(false);
      toast('Added ' + d.name + ' to your watchlist');
    }).catch(() => { setBusy(false); toast('Could not add that show.'); });
  }

  function addMovie() {
    setBusy(true);
    TMDB.movieDetails(id).then((d) => {
      Store.addMovie(d);
      setBusy(false);
      toast('Added ' + d.title + ' to your watchlist');
    }).catch(() => { setBusy(false); toast('Could not add that film.'); });
  }

  const title = details ? (isTV ? details.name : details.title) : '';
  const backdrop = details && details.backdrop_path ? TMDB.img(details.backdrop_path, 'w780') : '';
  const rating = details && details.vote_average ? details.vote_average.toFixed(1) : '';
  const meta = details ? (isTV
    ? [
        U.yearRange(details.first_air_date, details.last_air_date, details.status),
        details.status,
        (details.number_of_seasons ? details.number_of_seasons + (details.number_of_seasons === 1 ? ' season' : ' seasons') : ''),
        rating ? '★ ' + rating : ''
      ]
    : [
        (details.release_date || '').slice(0, 4),
        details.runtime ? U.fmtRuntime(details.runtime) : '',
        rating ? '★ ' + rating : ''
      ]).filter(Boolean).join(' • ') : '';

  const seasons = isTV && details
    ? (details.seasons || []).filter((s) => s.season_number > 0)
    : [];

  return (
    <>
      <div className="modal__hero" style={backdrop ? { backgroundImage: "linear-gradient(rgba(10,10,14,.4),rgba(10,10,14,.95)),url('" + backdrop + "')" } : undefined}>
        <button className="modal__close" onClick={closeModal} aria-label="Close">✕</button>
        <h2 className="modal__title">{title || '\u00A0'}</h2>
        <div className="modal__meta">{meta}</div>
      </div>

      <div className="modal__actions">
        {isTV ? (
          trackedShow ? (
            trackedShow.watchlist && Store.watchedCount(trackedShow) === 0 ? (
              <>
                <span className="preview__owned"><span>On your watchlist</span></span>
                <button className="btn btn--tiny btn--primary" onClick={() => { Store.setShowWatchlist(id, false); openShow(id); }}>Start watching</button>
                <button className="btn btn--tiny btn--danger" onClick={() => { Store.removeShow(id); toast('Removed.'); closeModal(); }}>Remove</button>
              </>
            ) : (
              <button className="btn btn--tiny btn--primary" onClick={() => openShow(id)}>Open in your tracker</button>
            )
          ) : (
            <>
              <button className="btn btn--tiny btn--primary" onClick={trackShow} disabled={busy}>{busy ? '…' : 'Track this show'}</button>
              <button className="btn btn--tiny" onClick={watchlistShow} disabled={busy}>{busy ? '…' : 'Add to watchlist'}</button>
            </>
          )
        ) : (
          trackedMovie ? (
            <>
              <span className="preview__owned">
                <CheckBtn small checked={!!trackedMovie.watchedAt} onClick={() => Store.setMovieWatched(id, !trackedMovie.watchedAt)} />
                <span>{trackedMovie.watchedAt ? 'Watched ' + U.fmtDate(trackedMovie.watchedAt) : 'On your watchlist'}</span>
              </span>
              <button className="btn btn--tiny btn--danger" onClick={() => { Store.removeMovie(id); toast('Removed.'); closeModal(); }}>Remove</button>
            </>
          ) : (
            <button className="btn btn--tiny btn--primary" onClick={addMovie} disabled={busy}>{busy ? '…' : 'Add to watchlist'}</button>
          )
        )}
      </div>

      {/* v2.6.0: film-level rewatch count + rating, watched films
          only, mirroring the show tracker. */}
      {!isTV && trackedMovie && trackedMovie.watchedAt ? (
        <div className="modal__owner-row modal__owner-row--pad">
          <div className="rewatch" role="group" aria-label="Times watched">
            <span className="rewatch__label">Watched</span>
            <button className="rewatch__btn" onClick={() => Store.setRewatchCount('movie', id, Store.rewatchOf(trackedMovie) - 1)} disabled={Store.rewatchOf(trackedMovie) <= 1} aria-label="Fewer times">−</button>
            <span className="rewatch__n">×{Store.rewatchOf(trackedMovie)}</span>
            <button className="rewatch__btn" onClick={() => Store.setRewatchCount('movie', id, Store.rewatchOf(trackedMovie) + 1)} aria-label="More times">+</button>
          </div>
          <Stars value={trackedMovie.rating || 0} onSet={(n) => Store.setRating('movie', id, n)} label={'Your rating of ' + (title || 'this film')} />
        </div>
      ) : null}

      <div className="modal__sections">
        {details === undefined ? <SkeletonLines n={3} /> :
          details === null ? <Notice>Could not load details.</Notice> : (
            <div className="about">
              {(details.genres || []).length > 0 && (
                <div className="about__chips">
                  {details.genres.slice(0, 4).map((g) => <span className="chip" key={g.id}>{g.name}</span>)}
                </div>
              )}
              {details.overview ? <p className="about__text">{details.overview}</p> : null}
            </div>
          )}

        {seasons.length > 0 && (
          <>
            <SectionLabel>SEASONS</SectionLabel>
            <div className="preview__seasons">
              {seasons.map((s) => {
                const year = (s.air_date || '').slice(0, 4);
                const tba = !s.episode_count;
                return (
                  <div className="preview__season" key={s.season_number}>
                    <span className="preview__season-name">{s.name || 'Season ' + s.season_number}</span>
                    <span className="preview__season-meta">
                      {tba ? 'Not aired yet' : s.episode_count + (s.episode_count === 1 ? ' episode' : ' episodes')}
                      {year ? ' · ' + year : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {credits && credits.length > 0 && (
          <>
            <SectionLabel>CAST</SectionLabel>
            <div className="cast-strip">
              {credits.map((c) => (
                <div className="cast" key={c.id + '-' + (c.character || '')}>
                  {c.profile_path
                    ? <FadeImg className="cast__photo" src={TMDB.img(c.profile_path, 'w185')} alt={c.name} />
                    : <div className="cast__photo cast__photo--empty" aria-hidden="true">👤</div>}
                  <div className="cast__name">{c.name}</div>
                  <div className="cast__role">{c.character || ''}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {providers && providers.list && providers.list.length > 0 && (
          <>
            <SectionLabel>WHERE TO WATCH · GB</SectionLabel>
            <div className="providers">
              {providers.list.map((p) => providers.link ? (
                <a className="provider provider--link" key={p.id} href={providers.link} target="_blank" rel="noopener noreferrer"
                  title={p.name + ' · ' + p.kind + ' · opens the watch page'}>
                  {p.logo ? <FadeImg className="provider__logo" src={TMDB.img(p.logo, 'w92')} alt={p.name} /> : null}
                  <span className="provider__kind">{p.kind}</span>
                </a>
              ) : (
                <span className="provider" key={p.id} title={p.name + ' · ' + p.kind}>
                  {p.logo ? <FadeImg className="provider__logo" src={TMDB.img(p.logo, 'w92')} alt={p.name} /> : null}
                  <span className="provider__kind">{p.kind}</span>
                </span>
              ))}
            </div>
            <div className="jw-credit">Tap a service to open this title's watch page. Watch data powered by <a href="https://www.justwatch.com" target="_blank" rel="noopener noreferrer">JustWatch</a></div>
          </>
        )}

        {videos && videos.length > 0 && (
          <>
            <SectionLabel>TRAILERS &amp; CLIPS</SectionLabel>
            <div className="video-strip">
              {videos.map((v) => (
                <a className="video" key={v.key} href={'https://www.youtube.com/watch?v=' + v.key} target="_blank" rel="noopener noreferrer">
                  <FadeImg className="video__thumb" src={'https://img.youtube.com/vi/' + v.key + '/mqdefault.jpg'} alt={v.name} />
                  <span className="video__play" aria-hidden="true">▶</span>
                  <span className="video__label">{v.type}</span>
                </a>
              ))}
            </div>
          </>
        )}
      </div>

      {recs && recs.length > 0 && (
        <div className="modal__recs">
          <SectionLabel>MORE LIKE THIS · FROM TMDB</SectionLabel>
          <div className="poster-strip">
            {recs.map((r) => (
              <button className="poster-strip__item rec" key={r.id} onClick={() => openPreview(media, r.id)}>
                <FadeImg className="thumb" src={TMDB.img(r.poster_path, 'w342')} alt={isTV ? r.name : r.title} />
                <span className="rec__name">{isTV ? r.name : r.title}</span>
              </button>
            ))}
          </div>
          <div className="fineprint">Tap a title to preview it. Nothing is added until you say so.</div>
        </div>
      )}
    </>
  );
}
