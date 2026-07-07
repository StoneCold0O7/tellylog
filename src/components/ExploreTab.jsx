/* Explore tab: debounced TMDB search + weekly trending.
   Phase 1.5: skeleton grids replace the "Loading" strings.
   Phase 2 scaffold: the AskBox mounts above trending and renders
   nothing until the serverless proxy reports a configured LLM key. */
import React, { useEffect, useState, useRef } from 'react';
import * as TMDB from '../lib/tmdb.js';
import { useApp } from '../context.js';
import { SectionLabel, Notice, apiErrorText, SkeletonCards } from './shared.jsx';
import ResultCard from './ResultCard.jsx';
import AskBox from './AskBox.jsx';
import RailsSection from './RailsSection.jsx';
import MicButton from './MicButton.jsx';

export default function ExploreTab() {
  const { offerGrid } = useApp();
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

  function runSearch(val) {
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
      <div className="search-wrap micwrap">
        <input className="search search--mic" type="search" placeholder="Search shows and films" autoComplete="off" value={q} onChange={(e) => runSearch(e.target.value)} />
        <MicButton onText={runSearch} />
      </div>
      <div>
        {searchErr ? <Notice>{apiErrorText(searchErr)}</Notice> :
          results === null ? null :
          results.length === 0 ? <div className="loading">No results for "{q.trim()}".</div> : (
            <>
              <SectionLabel>RESULTS</SectionLabel>
              <div className="grid">{results.map((it) => <ResultCard key={it.media_type + '-' + it.id} item={it} onAdded={offerGrid} />)}</div>
            </>
          )}
      </div>

      <AskBox onAdded={offerGrid} />

      <div>
        {trendErr ? <Notice>{apiErrorText(trendErr)}</Notice> :
          trending === null ? (
            <>
              <SectionLabel>TRENDING SHOWS</SectionLabel>
              <SkeletonCards n={8} />
            </>
          ) : (
            <>
              <SectionLabel>TRENDING SHOWS</SectionLabel>
              <div className="grid">{trending.tv.map((it) => <ResultCard key={'tv-' + it.id} item={it} onAdded={offerGrid} />)}</div>
              <SectionLabel>TRENDING FILMS</SectionLabel>
              <div className="grid">{trending.mv.map((it) => <ResultCard key={'mv-' + it.id} item={it} onAdded={offerGrid} />)}</div>
            </>
          )}
      </div>

      {/* v2.6.0: personalised rails render BELOW trending as one
          scrolling page, per the brief. */}
      <RailsSection onAdded={offerGrid} />
    </>
  );
}
