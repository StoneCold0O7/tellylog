/* Onboarding grid: browsable popular titles, TV first then films,
   TMDB popular endpoints only (no AI, per spec 3.1). Opens once after
   the first show is tracked, reachable any time from Profile. Marks
   itself seen on mount so the auto-offer never repeats. */
import React, { useEffect, useState } from 'react';
import * as Store from '../lib/store.js';
import * as TMDB from '../lib/tmdb.js';
import { useApp } from '../context.js';
import { SectionLabel, Notice, apiErrorText } from './shared.jsx';
import ResultCard from './ResultCard.jsx';

export default function OnboardingGrid() {
  const { closeModal } = useApp();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [added, setAdded] = useState(0);

  useEffect(() => { Store.setGridSeen(); }, []);

  useEffect(() => {
    Promise.all([TMDB.popularTV(), TMDB.popularMovies()]).then((res) => {
      setData({
        tv: (res[0].results || []).slice(0, 18),
        mv: (res[1].results || []).slice(0, 12)
      });
    }).catch((e) => setErr(e));
  }, []);

  return (
    <>
      <button className="modal__close" onClick={closeModal} aria-label="Close">✕</button>
      <div className="grid-head">
        <h2>Add a few favourites</h2>
        <p>Tap anything you watch. Skip any time, this list lives in Profile too.</p>
      </div>
      <div className="grid-scroll">
        {err ? <Notice>{apiErrorText(err)}</Notice> :
          data === null ? <div className="loading">Loading popular titles…</div> : (
            <>
              <SectionLabel>POPULAR SHOWS</SectionLabel>
              <div className="grid">
                {data.tv.map((it) => (
                  <ResultCard key={'tv-' + it.id} item={{ ...it, media_type: 'tv' }} onAdded={() => setAdded((n) => n + 1)} />
                ))}
              </div>
              <SectionLabel>POPULAR FILMS</SectionLabel>
              <div className="grid">
                {data.mv.map((it) => (
                  <ResultCard key={'mv-' + it.id} item={{ ...it, media_type: 'movie' }} onAdded={() => setAdded((n) => n + 1)} />
                ))}
              </div>
            </>
          )}
      </div>
      <div className="grid-foot">
        <button className={'btn ' + (added > 0 ? 'btn--primary' : 'btn--ghost')} onClick={closeModal}>
          {added > 0 ? 'Done (' + added + ' added)' : 'Skip for now'}
        </button>
      </div>
    </>
  );
}
