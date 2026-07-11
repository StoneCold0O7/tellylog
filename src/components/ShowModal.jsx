/* Show detail modal, Phase 1.5 depth pass.
   Order: hero -> progress -> actions -> next-up highlight -> about ->
   cast -> where to watch (JustWatch-attributed) -> trailers ->
   seasons (stills, overviews, air + watched dates) -> more like this.
   All data comes from TMDB API endpoints; nothing is scraped. Every
   fetch fails soft: a section that cannot load simply does not render.
   The tellylog:v1 schema is untouched; enrichment lives in the tmdb.js
   in-memory cache, not in localStorage. */
import React, { useState, useEffect, useRef } from 'react';
import * as Store from '../lib/store.js';
import * as TMDB from '../lib/tmdb.js';
import * as U from '../lib/util.js';
import { useApp } from '../context.js';
import { CheckBtn, Notice, FadeImg, SectionLabel, SkeletonRows, SkeletonLines, useEpisodeMeta, Stars } from './shared.jsx';

function fmtAirDate(iso) {
  const ts = U.parseDateFlexible(iso);
  return ts ? U.fmtDate(ts) : '';
}

function Season({ sh, s, count, watchedMap, defaultOpen, focusEp }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const [eps, setEps] = useState(null);       // null=not loaded, []=loaded empty
  const [err, setErr] = useState(false);
  const seenS = (sh.watched[s] || []).length;
  const focusRef = useRef(null);

  useEffect(() => {
    if (open && eps === null && !err) {
      TMDB.tvSeason(sh.id, s).then((season) => {
        setEps(season.episodes || []);
      }).catch(() => setErr(true));
    }
  }, [open, eps, err, sh.id, s]);

  /* v2.7.3: when the modal was opened from a specific episode row,
     scroll that episode into view once its season body has rendered. */
  useEffect(() => {
    if (focusEp && eps && focusRef.current) {
      focusRef.current.scrollIntoView({ block: 'center' });
    }
  }, [focusEp, eps]);

  const unaired = !count; /* 0 episodes = announced but not released */

  return (
    <div className="season">
      <div className="season__head">
        <button className="season__head-main" onClick={() => setOpen(!open)} aria-expanded={open}>
          <span>Season {s}</span>
          {unaired
            ? <span className="season__count season__count--tba">Not aired yet</span>
            : <span className="season__count">{seenS} / {count}</span>}
          <span className="season__minibar" aria-hidden="true">
            <span style={{ width: (count ? Math.round(100 * seenS / count) : 0) + '%' }}></span>
          </span>
          <span className="season__chev">▾</span>
        </button>
        {!unaired && (
          <CheckBtn
            small
            checked={seenS === count}
            onClick={() => Store.markSeason(sh.id, s, count, seenS !== count)}
          />
        )}
      </div>
      {open && (
        <div className="season__body">
          {unaired ? <Notice>No episodes have aired yet. This season unlocks when TMDB lists released episodes.</Notice> : (
            <button className="btn btn--tiny" onClick={() => Store.markSeason(sh.id, s, count, seenS !== count)}>
              {seenS === count ? 'Unmark season' : 'Mark season watched'}
            </button>
          )}
          {!unaired && <div className="season__eps">
            {err ? <Notice>Could not load episodes.</Notice> :
              eps === null ? <SkeletonRows n={Math.min(count || 4, 5)} /> :
              eps.map((ep) => {
                const watched = Store.isWatched(sh, s, ep.episode_number);
                const wTs = watchedMap[s + '-' + ep.episode_number];
                const dates = [
                  ep.air_date ? 'Aired ' + fmtAirDate(ep.air_date) : '',
                  watched && wTs ? 'Watched ' + U.fmtDate(wTs) : ''
                ].filter(Boolean).join(' · ');
                return (
                  <div
                    className={'season__ep' + (watched ? ' season__ep--watched' : '') + (focusEp === ep.episode_number ? ' season__ep--focus' : '')}
                    key={ep.episode_number}
                    ref={focusEp === ep.episode_number ? focusRef : null}
                  >
                    {ep.still_path
                      ? <FadeImg className="ep-still" src={TMDB.img(ep.still_path, 'w185')} alt="" />
                      : <div className="ep-still ep-still--empty" aria-hidden="true">📺</div>}
                    <div className="season__ep-main">
                      <div className="season__ep-top">
                        <span className="season__ep-label">{U.seLabel(s, ep.episode_number)}</span>
                        <span className="season__ep-name">{ep.name || ''}</span>
                      </div>
                      {ep.overview ? <div className="season__ep-overview">{ep.overview}</div> : null}
                      {dates ? <div className="season__ep-dates">{dates}</div> : null}
                    </div>
                    <CheckBtn small checked={watched} onClick={() => Store.markEpisode(sh.id, s, ep.episode_number, !watched)} />
                  </div>
                );
              })}
          </div>}
        </div>
      )}
    </div>
  );
}

/* Continue-point row pinned above the seasons accordion. */
function NextUp({ sh }) {
  const next = Store.nextEpisodeFor(sh);
  const meta = useEpisodeMeta(sh.id, next ? next.s : 1, next ? next.e : 1);
  if (!next) return null;
  return (
    <div className="nextup">
      <div className="nextup__eyebrow">NEXT UP</div>
      <div className="nextup__main">
        <span className="nextup__se">{U.seLabel(next.s, next.e)}</span>
        <span className="nextup__name">{meta && meta.name ? meta.name : ''}</span>
      </div>
      <CheckBtn small checked={false} onClick={() => Store.markEpisode(sh.id, next.s, next.e, true)} />
    </div>
  );
}

export default function ShowModal({ id, focus }) {
  const { closeModal, toast, openShow, openPreview } = useApp();
  const sh = Store.get().shows[id];

  /* Enrichment payloads. undefined=loading, null=failed, object=ready. */
  const [details, setDetails] = useState(undefined);
  const [credits, setCredits] = useState(undefined);
  const [providers, setProviders] = useState(undefined);
  const [videos, setVideos] = useState(undefined);
  const [recs, setRecs] = useState(undefined);

  useEffect(() => {
    if (!sh) return;
    let alive = true;
    const grab = (p, set, pick) => p.then((d) => { if (alive) set(pick ? pick(d) : d); })
      .catch(() => { if (alive) set(null); });
    grab(TMDB.tvDetails(id), setDetails);
    grab(TMDB.tvCredits(id), setCredits, (d) => (d.cast || []).slice(0, 12));
    grab(TMDB.tvProviders(id), setProviders, (d) => U.providersWithLink(d.results && d.results.GB));
    grab(TMDB.tvVideos(id), setVideos, (d) => U.pickVideos(d.results, 6));
    grab(TMDB.tvRecommendations(id), setRecs, (d) => (d.results || []).filter((r) => r.poster_path).slice(0, 10));
    return () => { alive = false; };
  }, [id, sh]);

  if (!sh) return null;

  const total = Store.totalEpisodes(sh);
  const seen = Store.watchedCount(sh);
  const pct = total ? Math.round(100 * seen / total) : 0;
  const seasonNums = Object.keys(sh.seasons).map(Number).sort((a, b) => a - b);
  const backdrop = sh.backdrop ? TMDB.img(sh.backdrop, 'w780') : '';
  const watchedMap = Store.watchedMapFor(id);
  const next = Store.nextEpisodeFor(sh);
  const nextSeason = next ? next.s : null;

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

  const years = details ? U.yearRange(details.first_air_date, details.last_air_date, details.status) : '';
  const rating = details && details.vote_average ? details.vote_average.toFixed(1) : '';

  return (
    <>
      <div className="modal__hero" style={backdrop ? { backgroundImage: "linear-gradient(rgba(10,10,14,.4),rgba(10,10,14,.95)),url('" + backdrop + "')" } : undefined}>
        <button className="modal__close" onClick={closeModal} aria-label="Close">✕</button>
        <h2 className="modal__title">{sh.name}</h2>
        <div className="modal__meta">{[years, sh.status, sh.network, U.fmtRuntime(sh.avgRuntime) + ' / ep', rating ? '★ ' + rating : ''].filter(Boolean).join(' • ')}</div>
      </div>
      <div className="progress"><div className="progress__bar" style={{ width: pct + '%' }}></div></div>
      <div className="modal__stats">{seen} of {total} episodes watched ({pct}%)</div>
      <div className="modal__actions">
        <button className="btn btn--tiny" onClick={markAll}>Mark all watched</button>
        <button className="btn btn--tiny btn--ghost" onClick={archive}>{sh.archived ? 'Unarchive' : 'Archive'}</button>
        <button className="btn btn--tiny btn--danger" onClick={remove}>Stop tracking</button>
      </div>

      {/* v2.6.0: series-level rewatch count + title rating. Both only
          make sense once something is watched, so the row waits for
          the first tick. The count multiplies TIME in stats, never
          the distinct episode count. */}
      {seen > 0 && (
        <div className="modal__owner-row">
          <div className="rewatch" role="group" aria-label="Times watched through">
            <span className="rewatch__label">Watched through</span>
            <button className="rewatch__btn" onClick={() => Store.setRewatchCount('tv', sh.id, Store.rewatchOf(sh) - 1)} disabled={Store.rewatchOf(sh) <= 1} aria-label="Fewer times">−</button>
            <span className="rewatch__n">×{Store.rewatchOf(sh)}</span>
            <button className="rewatch__btn" onClick={() => Store.setRewatchCount('tv', sh.id, Store.rewatchOf(sh) + 1)} aria-label="More times">+</button>
          </div>
          <Stars value={sh.rating || 0} onSet={(n) => Store.setRating('tv', sh.id, n)} label={'Your rating of ' + sh.name} />
        </div>
      )}

      <div className="modal__sections">
        <NextUp sh={sh} />

        {details === undefined ? <SkeletonLines n={3} /> : details && (details.overview || (details.genres || []).length) ? (
          <div className="about">
            {(details.genres || []).length > 0 && (
              <div className="about__chips">
                {details.genres.slice(0, 4).map((g) => <span className="chip" key={g.id}>{g.name}</span>)}
              </div>
            )}
            {details.overview ? <p className="about__text">{details.overview}</p> : null}
          </div>
        ) : null}

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

      <div className="modal__seasons">
        <SectionLabel>SEASONS</SectionLabel>
        {seasonNums.map((s) => (
          <Season key={s} sh={sh} s={s} count={sh.seasons[s]} watchedMap={watchedMap} defaultOpen={focus ? s === focus.s : s === nextSeason} focusEp={focus && focus.s === s ? focus.e : null} />
        ))}
      </div>

      {recs && recs.length > 0 && (
        <div className="modal__recs">
          <SectionLabel>MORE LIKE THIS · FROM TMDB</SectionLabel>
          <div className="poster-strip">
            {recs.map((r) => (
              <button className="poster-strip__item rec" key={r.id} onClick={() => openPreview('tv', r.id)}>
                <FadeImg className="thumb" src={TMDB.img(r.poster_path, 'w342')} alt={r.name} />
                <span className="rec__name">{r.name}</span>
              </button>
            ))}
          </div>
          <div className="fineprint">Tap a title to preview it. Nothing is added until you say so.</div>
        </div>
      )}
    </>
  );
}
