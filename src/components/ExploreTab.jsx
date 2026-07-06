/* Explore tab: debounced TMDB search + weekly trending.
   Mirrors renderExplore/mountExplore/resultCard. */
import React, { useEffect, useState, useRef } from 'react';
import * as Store from '../lib/store.js';
import * as TMDB from '../lib/tmdb.js';
import { useApp } from '../context.js';
import { Poster, SectionLabel, Notice, apiErrorText } from './shared.jsx';

function ResultCard({ item }) {
  const { toast } = useApp();
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
      }).catch(() => { setBusy(false); toast('Could not add that show.'); });
    } else {
      TMDB.movieDetails(id).then((d) => {
        Store.addMovie(d);
        toast('Added ' + d.title + ' to your watchlist');
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
        <div className="card__title">{title || ''}</div>
        <div className="card__meta">{isTV ? 'TV' : 'Film'}{year ? ' • ' + year : ''}</div>
      </div>
    </article>
  );
}

export default function ExploreTab() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);      // null | [] | items
  const [searchErr, setSearchErr] = useState(null);
  const [trending, setTrending] = useState(null);    // null | {tv, mv}
  const [trendErr, setTrendErr] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    Promise.all([TMDB.trendingTV(), TMDB.trendingMovies()]).then((res) => {
      setTrending({
        tv: (res[0].results || []).slice(0, 8),
        mv: (res[1].results || []).slice(0, 8)
      });
    }).catch((err) => setTrendErr(err));
  }, []);

  function onInput(e) {
    const val = e.target.value;
    setQ(val);
    clearTimeout(timer.current);
    const query = val.trim();
    if (!query) { setResults(null); setSearchErr(null); return; }
    timer.current = setTimeout(() => {
      TMDB.searchMulti(query).then((res) => {
        const items = (res.results || [])
          .filter((r) => r.media_type === 'tv' || r.media_type === 'movie')
          .slice(0, 12);
        setSearchErr(null);
        setResults(items);
      }).catch((err) => setSearchErr(err));
    }, 350);
  }

  return (
    <>
      <div className="search-wrap">
        <input className="search" type="search" placeholder="Search shows and films" autoComplete="off" value={q} onChange={onInput} />
      </div>
      <div>
        {searchErr ? <Notice>{apiErrorText(searchErr)}</Notice> :
          results === null ? null :
          results.length === 0 ? <div className="loading">No results for "{q.trim()}".</div> : (
            <>
              <SectionLabel>RESULTS</SectionLabel>
              <div className="grid">{results.map((it) => <ResultCard key={it.media_type + '-' + it.id} item={it} />)}</div>
            </>
          )}
      </div>
      <div>
        {trendErr ? <Notice>{apiErrorText(trendErr)}</Notice> :
          trending === null ? <div className="loading">Loading trending…</div> : (
            <>
              <SectionLabel>TRENDING SHOWS</SectionLabel>
              <div className="grid">{trending.tv.map((it) => <ResultCard key={'tv-' + it.id} item={it} />)}</div>
              <SectionLabel>TRENDING FILMS</SectionLabel>
              <div className="grid">{trending.mv.map((it) => <ResultCard key={'mv-' + it.id} item={it} />)}</div>
            </>
          )}
      </div>
    </>
  );
}
