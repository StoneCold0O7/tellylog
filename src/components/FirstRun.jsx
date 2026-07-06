/* First run (key already saved, nothing tracked): search-led.
   One show in under 30 seconds: type, tap, done. Import is the
   secondary path, per the revamp spec. */
import React, { useRef, useState } from 'react';
import * as TMDB from '../lib/tmdb.js';
import { useApp } from '../context.js';
import { SectionLabel, Notice, apiErrorText } from './shared.jsx';
import ResultCard from './ResultCard.jsx';

export default function FirstRun() {
  const { openModal, offerGrid } = useApp();
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [err, setErr] = useState(null);
  const timer = useRef(null);

  function onInput(e) {
    const val = e.target.value;
    setQ(val);
    clearTimeout(timer.current);
    const query = val.trim();
    if (!query) { setResults(null); setErr(null); return; }
    timer.current = setTimeout(() => {
      TMDB.searchMulti(query).then((res) => {
        const items = (res.results || [])
          .filter((r) => r.media_type === 'tv' || r.media_type === 'movie')
          .slice(0, 12);
        setErr(null);
        setResults(items);
      }).catch((error) => setErr(error));
    }, 350);
  }

  return (
    <div className="firstrun">
      <h1 className="firstrun__title">What are you watching?</h1>
      <p className="firstrun__sub">Search anything, tap ＋ to start tracking.</p>
      <div className="search-wrap">
        <input
          className="search" type="search" autoFocus autoComplete="off"
          placeholder="Try “Severance” or “Slow Horses”"
          value={q} onChange={onInput}
        />
      </div>
      {err ? <Notice>{apiErrorText(err)}</Notice> :
        results === null ? null :
        results.length === 0 ? <div className="loading">No results for "{q.trim()}".</div> : (
          <>
            <SectionLabel>RESULTS</SectionLabel>
            <div className="grid">
              {results.map((it) => (
                <ResultCard key={it.media_type + '-' + it.id} item={it} onAdded={offerGrid} />
              ))}
            </div>
          </>
        )}
      <div className="firstrun__alt">
        <button className="btn btn--ghost" onClick={() => openModal({ type: 'import' })}>
          Import your history instead (TV Time, Netflix, Letterboxd, IMDb)
        </button>
      </div>
    </div>
  );
}
