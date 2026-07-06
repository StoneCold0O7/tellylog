/* Import wizard. Port of importer.js: pick -> (map) -> matching ->
   review -> apply -> done. Wizard state lives in a ref and views
   re-render via a tick, mirroring the original mutate-then-render flow.
   All thresholds, grouping rules and copy are unchanged. */
import React, { useRef, useState } from 'react';
import * as Store from '../lib/store.js';
import * as TMDB from '../lib/tmdb.js';
import * as U from '../lib/util.js';
import { useApp } from '../context.js';
import { SectionLabel, Notice } from './shared.jsx';

const AUTO_THRESHOLD = 0.92;

function initialState() {
  return {
    step: 'pick',
    source: 'generic', // tvtime | netflix | letterboxd | imdb | generic
    headers: [],
    rows: [],
    fileNames: [],
    mapping: null,
    shows: [],   // [{name, episodes:[{s,e,ts}|{s,epName,ts}], candidates:[], chosen:id|null, auto:bool}]
    movies: [],  // [{title, year, ts, watchlistOnly, candidates:[], chosen:id|null, auto:bool}]
    skippedRows: 0,
    skippedNote: '',
    progress: '',
    applied: null
  };
}

/* ---------- Source-specific builders (verbatim logic) ---------- */

function colIndex(headers, name) {
  const h = headers.map((x) => String(x).trim().toLowerCase());
  return h.indexOf(name.toLowerCase());
}

function buildLetterboxd(st, files) {
  const moviesByKey = {};
  files.forEach((f) => {
    const iName = colIndex(f.headers, 'name');
    const iYear = colIndex(f.headers, 'year');
    let iDate = colIndex(f.headers, 'watched date');
    if (iDate === -1) iDate = colIndex(f.headers, 'date');
    const isWatchlist = /watchlist/i.test(f.name);
    f.rows.forEach((r) => {
      const title = (r[iName] || '').trim();
      if (!title) return;
      const year = iYear >= 0 ? parseInt(r[iYear], 10) || null : null;
      const ts = iDate >= 0 ? U.parseDateFlexible(r[iDate]) : null;
      const key = title + '|' + (year || '');
      const prev = moviesByKey[key];
      if (!prev) {
        moviesByKey[key] = { title: title, year: year, ts: ts, watchlistOnly: isWatchlist };
      } else {
        // watched beats watchlist; latest date wins
        if (!isWatchlist) prev.watchlistOnly = false;
        if (ts && ts > (prev.ts || 0)) prev.ts = ts;
      }
    });
  });
  st.shows = [];
  st.movies = Object.keys(moviesByKey).map((k) => {
    const m = moviesByKey[k];
    return { title: m.title, year: m.year, ts: m.ts, watchlistOnly: m.watchlistOnly, candidates: [], chosen: null, auto: false };
  });
  st.skippedRows = 0;
  st.skippedNote = '';
}

function buildImdb(st, file) {
  const iTitle = colIndex(file.headers, 'title');
  const iType = colIndex(file.headers, 'title type');
  const iYear = colIndex(file.headers, 'year');
  let iDate = colIndex(file.headers, 'date rated');
  if (iDate === -1) iDate = colIndex(file.headers, 'created');
  const shows = {};
  const movies = {};
  let skippedEpisodes = 0;
  file.rows.forEach((r) => {
    const title = (r[iTitle] || '').trim();
    if (!title) return;
    const type = (r[iType] || '').toLowerCase().replace(/[^a-z]/g, '');
    const year = iYear >= 0 ? parseInt(r[iYear], 10) || null : null;
    const ts = iDate >= 0 ? U.parseDateFlexible(r[iDate]) : null;
    if (type.indexOf('episode') !== -1) { skippedEpisodes++; return; }
    if (type.indexOf('series') !== -1) {
      if (!shows[title]) shows[title] = { name: title, episodes: [], candidates: [], chosen: null, auto: false };
    } else if (type.indexOf('movie') !== -1 || type.indexOf('video') !== -1 || type === '') {
      const key = title + '|' + (year || '');
      if (!movies[key] || (ts && ts > (movies[key].ts || 0))) {
        movies[key] = { title: title, year: year, ts: ts, watchlistOnly: false };
      }
    }
  });
  st.shows = Object.keys(shows).map((k) => shows[k]);
  st.movies = Object.keys(movies).map((k) => {
    const m = movies[k];
    return { title: m.title, year: m.year, ts: m.ts, watchlistOnly: false, candidates: [], chosen: null, auto: false };
  });
  st.skippedRows = skippedEpisodes;
  st.skippedNote = skippedEpisodes
    ? skippedEpisodes + ' single-episode ratings were skipped: IMDb exports do not say which series they belong to.'
    : '';
}

function buildNetflix(st, headers, rows) {
  const iTitle = colIndex(headers, 'title');
  const iDate = colIndex(headers, 'date');
  const showsByName = {};
  const moviesByName = {};
  rows.forEach((r) => {
    const raw = (r[iTitle] || '').trim();
    if (!raw) return;
    const ts = iDate >= 0 ? U.parseDateFlexible(r[iDate]) : null;
    const p = U.parseNetflixTitle(raw);
    if (p.film) {
      if (!moviesByName[p.film] || (ts && ts > (moviesByName[p.film].ts || 0))) {
        moviesByName[p.film] = { ts: ts };
      }
    } else {
      if (!showsByName[p.show]) showsByName[p.show] = [];
      showsByName[p.show].push({ s: p.season, epName: p.epName, ts: ts });
    }
  });
  st.shows = Object.keys(showsByName).map((name) => {
    return { name: name, episodes: showsByName[name], candidates: [], chosen: null, auto: false };
  });
  st.movies = Object.keys(moviesByName).map((title) => {
    return { title: title, year: null, ts: moviesByName[title].ts, watchlistOnly: false, candidates: [], chosen: null, auto: false };
  });
  st.skippedRows = 0;
  st.skippedNote = 'Netflix does not export episode numbers, only names. Episode names are matched against TMDB during import; a few may not resolve.';
}

function buildGroups(st) {
  const m = st.mapping;
  const showsByName = {};
  const moviesByName = {};
  st.skippedRows = 0;
  st.rows.forEach((r) => {
    const name = (r[m.show] || '').trim();
    if (!name) { st.skippedRows++; return; }
    const s = m.season >= 0 ? parseInt(r[m.season], 10) : NaN;
    const e = m.episode >= 0 ? parseInt(r[m.episode], 10) : NaN;
    const ts = m.date >= 0 ? U.parseDateFlexible(r[m.date]) : null;
    const type = m.type >= 0 ? (r[m.type] || '').toLowerCase() : '';
    let isEpisode = !isNaN(s) && !isNaN(e) && e > 0;
    if (type.indexOf('movie') !== -1 || type.indexOf('film') !== -1) isEpisode = false;
    if (isEpisode) {
      if (!showsByName[name]) showsByName[name] = [];
      showsByName[name].push({ s: s, e: e, ts: ts });
    } else {
      // one film per distinct title; latest date wins
      if (!moviesByName[name] || (ts && ts > (moviesByName[name].ts || 0))) {
        moviesByName[name] = { ts: ts };
      }
    }
  });
  st.shows = Object.keys(showsByName).map((name) => {
    return { name: name, episodes: showsByName[name], candidates: [], chosen: null, auto: false };
  });
  st.movies = Object.keys(moviesByName).map((title) => {
    return { title: title, ts: moviesByName[title].ts, candidates: [], chosen: null, auto: false };
  });
}

function pickBest(item, kind) {
  const query = kind === 'tv' ? item.name : item.title;
  let best = null;
  let bestScore = 0;
  item.candidates.forEach((c) => {
    const names = kind === 'tv' ? [c.name, c.original_name] : [c.title, c.original_title];
    names.forEach((n) => {
      const sc = U.similarity(query, n || '');
      if (sc > bestScore) { bestScore = sc; best = c; }
    });
  });
  if (best && bestScore >= AUTO_THRESHOLD) {
    item.chosen = best.id;
    item.auto = true;
  } else if (item.candidates.length > 0) {
    item.chosen = item.candidates[0].id; // preselect top hit, still needs confirming
    item.auto = false;
  }
}

/* ---------- Component ---------- */

export default function ImportWizard() {
  const { toast, closeModal, go } = useApp();
  const stRef = useRef(null);
  if (stRef.current === null) stRef.current = initialState();
  const st = stRef.current;
  const [, setTick] = useState(0);
  const refresh = () => setTick((n) => n + 1);

  function matchAll() {
    st.step = 'matching';
    refresh();
    const total = st.shows.length + st.movies.length;
    let doneCount = 0;
    function tick() {
      doneCount++;
      st.progress = 'Matched ' + doneCount + ' of ' + total + ' titles…';
      refresh();
    }
    const showJobs = st.shows.map((item) =>
      TMDB.searchTV(item.name).then((res) => {
        item.candidates = (res.results || []).slice(0, 6);
        pickBest(item, 'tv');
        tick();
      }).catch(() => { item.candidates = []; tick(); })
    );
    const movieJobs = st.movies.map((item) =>
      TMDB.searchMovie(item.title, item.year || undefined).then((res) => {
        item.candidates = (res.results || []).slice(0, 6);
        pickBest(item, 'movie');
        tick();
      }).catch(() => { item.candidates = []; tick(); })
    );
    Promise.all(showJobs.concat(movieJobs)).then(() => {
      st.step = 'review';
      refresh();
    });
  }

  function applyAll() {
    st.step = 'applying';
    refresh();
    const failed = [];
    let doneShows = 0;
    let doneEps = 0;
    let doneMovies = 0;
    const chosenShows = st.shows.filter((s) => s.chosen);
    const chosenMovies = st.movies.filter((m) => m.chosen);
    const total = chosenShows.length + chosenMovies.length;
    let doneCount = 0;
    function tick() {
      doneCount++;
      st.progress = 'Imported ' + doneCount + ' of ' + total + ' titles…';
      refresh();
    }
    const showJobs = chosenShows.map((item) =>
      TMDB.tvDetails(item.chosen).then((d) => {
        const named = item.episodes.filter((ep) => ep.epName != null);
        if (named.length === 0) {
          Store.importShowBatch(d, item.episodes);
          doneShows++;
          doneEps += item.episodes.length;
          tick();
          return;
        }
        // Netflix path: episodes carry names, not numbers. Resolve each
        // referenced season and match episode names by similarity.
        const seasons = {};
        item.episodes.forEach((ep) => { seasons[ep.s] = true; });
        const seasonJobs = Object.keys(seasons).map((sn) =>
          TMDB.tvSeason(item.chosen, Number(sn)).then((season) => {
            seasons[sn] = season.episodes || [];
          }).catch(() => { seasons[sn] = []; })
        );
        return Promise.all(seasonJobs).then(() => {
          const resolved = [];
          let lost = 0;
          item.episodes.forEach((ep) => {
            const eps = seasons[ep.s] || [];
            let best = null;
            let bestScore = 0;
            eps.forEach((te) => {
              const sc = U.similarity(ep.epName, te.name || '');
              if (sc > bestScore) { bestScore = sc; best = te; }
            });
            if (best && bestScore >= 0.6) resolved.push({ s: ep.s, e: best.episode_number, ts: ep.ts });
            else lost++;
          });
          Store.importShowBatch(d, resolved);
          doneShows++;
          doneEps += resolved.length;
          if (lost > 0) failed.push(item.name + ' (' + lost + ' episodes unresolved)');
          tick();
        });
      }).catch(() => { failed.push(item.name); tick(); })
    );
    const movieJobs = chosenMovies.map((item) =>
      TMDB.movieDetails(item.chosen).then((d) => {
        if (item.watchlistOnly) Store.importMovieToWatchlist(d);
        else Store.importMovie(d, item.ts);
        doneMovies++;
        tick();
      }).catch(() => { failed.push(item.title); tick(); })
    );
    Promise.all(showJobs.concat(movieJobs)).then(() => {
      st.applied = { shows: doneShows, episodes: doneEps, movies: doneMovies, failed: failed };
      st.step = 'done';
      refresh();
    });
  }

  function onFiles(fileList) {
    const files = Array.prototype.slice.call(fileList || []);
    const csvs = [];
    const jsons = [];
    files.forEach((f) => {
      if (/\.json$/i.test(f.name)) jsons.push(f);
      else csvs.push(f);
    });
    if (jsons.length > 0) {
      jsons[0].text().then((text) => {
        try {
          Store.restoreJSON(text);
          toast('Backup restored.');
          closeModal();
        } catch (e) {
          toast('That JSON is not a TellyLog backup.');
        }
      });
      return;
    }
    if (csvs.length === 0) return;
    Promise.all(csvs.map((f) => f.text().then((text) => ({ name: f.name, text: text })))).then((items) => {
      const parsed = items.map((it) => {
        const p = U.parseCSV(it.text);
        return { name: it.name, headers: p.headers, rows: p.rows, source: U.detectSource(p.headers) };
      }).filter((p) => p.headers.length > 0);
      if (parsed.length === 0) { toast('Could not read that CSV.'); return; }

      const source = parsed[0].source;
      st.source = source;
      st.fileNames = parsed.map((p) => p.name);

      if (source === 'letterboxd') {
        // Letterboxd exports several CSVs with the same shape; each file can be
        // watched, diary or watchlist. Filename decides watchlist status.
        buildLetterboxd(st, parsed.filter((p) => p.source === 'letterboxd'));
        matchAll();
        return;
      }
      if (source === 'imdb') {
        buildImdb(st, parsed[0]);
        matchAll();
        return;
      }
      if (source === 'netflix') {
        let rows = [];
        parsed.forEach((p) => { if (p.source === 'netflix') rows = rows.concat(p.rows); });
        buildNetflix(st, parsed[0].headers, rows);
        matchAll();
        return;
      }

      // TV Time / generic: concat same-header files, then the manual mapping step
      const headers = parsed[0].headers;
      let rows2 = parsed[0].rows;
      parsed.slice(1).forEach((p) => {
        if (p.headers.join('|') === headers.join('|')) rows2 = rows2.concat(p.rows);
      });
      st.headers = headers;
      st.rows = rows2;
      st.mapping = U.guessColumns(headers);
      if (st.mapping.show === -1) st.mapping.show = 0;
      st.step = 'map';
      refresh();
    });
  }

  /* ---------- Step views ---------- */

  const Head = ({ title, sub }) => (
    <>
      <button className="modal__close" onClick={closeModal} aria-label="Close">✕</button>
      <h2 className="import__title">{title}</h2>
      {sub ? <p className="import__sub">{sub}</p> : null}
    </>
  );

  if (st.step === 'pick') {
    return (
      <>
        <Head title="Import your history" sub="Drop in a CSV export and TellyLog works out where it came from." />
        <div className="source-list">
          <div className="source-row"><strong>TV Time</strong><span>tracking export CSV: full episode history</span></div>
          <div className="source-row"><strong>Netflix</strong><span>Account → Profile → Viewing activity → Download all</span></div>
          <div className="source-row"><strong>Letterboxd</strong><span>Settings → Data → Export: watched.csv, watchlist.csv</span></div>
          <div className="source-row"><strong>IMDb</strong><span>Your Ratings → Export: films and tracked series</span></div>
          <div className="source-row"><strong>TellyLog</strong><span>backup .json from another device</span></div>
        </div>
        <label className="dropzone">
          <input type="file" accept=".csv,.json,text/csv,application/json" multiple hidden onChange={(e) => onFiles(e.target.files)} />
          <span>Choose file(s)</span>
        </label>
        <p className="fineprint">Nothing is uploaded. Files are read locally in your browser. If your export is a .zip, extract it first and pick the CSV inside.</p>
      </>
    );
  }

  if (st.step === 'map') {
    const m = st.mapping;
    const select = (field, label, allowNone) => (
      <label className="map-row">
        <span>{label}</span>
        <select value={m[field]} onChange={(e) => { m[field] = parseInt(e.target.value, 10); refresh(); }}>
          {allowNone ? <option value="-1">— none —</option> : null}
          {st.headers.map((h, i) => (
            <option key={i} value={i}>{h || '(column ' + (i + 1) + ')'}</option>
          ))}
        </select>
      </label>
    );
    return (
      <>
        <Head title="Map the columns" sub={st.rows.length + ' rows found. Check the auto-detected mapping below, fix anything wrong, then continue.'} />
        <div className="preview-wrap">
          <table className="preview">
            <thead><tr>{st.headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>
              {st.rows.slice(0, 4).map((r, ri) => (
                <tr key={ri}>{st.headers.map((_, i) => <td key={i}>{r[i] || ''}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="map-grid">
          {select('show', 'Show / film title')}
          {select('season', 'Season number', true)}
          {select('episode', 'Episode number', true)}
          {select('date', 'Watched date', true)}
        </div>
        <p className="fineprint">Rows with a season and episode number are treated as TV episodes. Rows without either are treated as films.</p>
        <div className="import__actions">
          <button className="btn btn--primary" onClick={() => { buildGroups(st); matchAll(); }}>Match against TMDB</button>
        </div>
      </>
    );
  }

  if (st.step === 'matching') {
    return (
      <>
        <Head title="Matching shows…" sub="Looking up each title on TMDB. Large libraries take a minute." />
        <div className="loading">{st.progress || 'Working…'}</div>
      </>
    );
  }

  if (st.step === 'review') {
    const auto = st.shows.filter((s) => s.auto && s.chosen);
    const review = st.shows.filter((s) => !s.auto);
    const autoM = st.movies.filter((m) => m.auto && m.chosen);
    const reviewM = st.movies.filter((m) => !m.auto);

    const candidateSelect = (item, kind, idx) => {
      const tag = kind === 'show'
        ? (item.episodes.length ? item.episodes.length + ' eps' : 'tracked')
        : (item.watchlistOnly ? 'watchlist' : 'film');
      return (
        <div className="review-row" key={kind + '-' + idx}>
          <div className="review-row__name">
            {kind === 'show' ? item.name : item.title}
            <span className="review-row__count">{tag}</span>
          </div>
          <select
            value={item.chosen == null ? '' : item.chosen}
            onChange={(e) => {
              item.chosen = e.target.value ? parseInt(e.target.value, 10) : null;
              refresh();
            }}
          >
            <option value="">Skip this one</option>
            {item.candidates.map((c) => {
              const year = ((c.first_air_date || c.release_date) || '').slice(0, 4);
              return <option key={c.id} value={c.id}>{(c.name || c.title) + (year ? ' (' + year + ')' : '')}</option>;
            })}
          </select>
        </div>
      );
    };

    const srcLabel = { tvtime: 'TV Time', netflix: 'Netflix', letterboxd: 'Letterboxd', imdb: 'IMDb', generic: 'CSV' }[st.source];
    const epTotal = st.shows.reduce((a, s) => a + (s.chosen ? s.episodes.length : 0), 0);
    const shTotal = st.shows.filter((s) => s.chosen).length;
    const mvTotal = st.movies.filter((m) => m.chosen).length;

    return (
      <>
        <Head
          title={'Review matches (' + srcLabel + ')'}
          sub={auto.length + autoM.length + ' matched automatically. ' +
            (review.length + reviewM.length) + ' need a decision. ' +
            (st.skippedNote || (st.skippedRows ? st.skippedRows + ' rows had no usable season/episode and were treated as films or skipped.' : ''))}
        />
        {review.length > 0 && (
          <>
            <SectionLabel>SHOWS TO CONFIRM</SectionLabel>
            {review.map((s) => candidateSelect(s, 'show', st.shows.indexOf(s)))}
          </>
        )}
        {reviewM.length > 0 && (
          <>
            <SectionLabel>FILMS TO CONFIRM</SectionLabel>
            {reviewM.map((m) => candidateSelect(m, 'movie', st.movies.indexOf(m)))}
          </>
        )}
        {auto.length > 0 && (
          <>
            <SectionLabel>MATCHED AUTOMATICALLY</SectionLabel>
            <div className="auto-list">
              {auto.map((s, i) => <span className="chip" key={i}>{s.name} · {s.episodes.length || 'tracked'}</span>)}
            </div>
          </>
        )}
        {autoM.length > 0 && (
          <div className="auto-list">
            {autoM.map((m, i) => <span className="chip" key={i}>🎬 {m.title}</span>)}
          </div>
        )}
        <div className="import__actions">
          <button className="btn btn--primary" onClick={applyAll}>
            Import {[epTotal ? U.fmtNumber(epTotal) + ' episodes' : '', shTotal ? shTotal + ' shows' : '', mvTotal ? mvTotal + ' films' : ''].filter(Boolean).join(', ')}
          </button>
        </div>
      </>
    );
  }

  if (st.step === 'applying') {
    return (
      <>
        <Head title="Importing…" sub="Fetching show details and writing your history." />
        <div className="loading">{st.progress || 'Working…'}</div>
      </>
    );
  }

  // done
  const a = st.applied;
  return (
    <>
      <Head title="Done" />
      <div className="done-stats">
        <div className="stat-card"><div className="stat-card__label">Shows imported</div><div className="stat-card__big">{a.shows}</div></div>
        <div className="stat-card"><div className="stat-card__label">Episodes logged</div><div className="stat-card__big">{U.fmtNumber(a.episodes)}</div></div>
        <div className="stat-card"><div className="stat-card__label">Films logged</div><div className="stat-card__big">{a.movies}</div></div>
        {a.failed.length ? <Notice>Could not import: {a.failed.join(', ')}</Notice> : null}
      </div>
      <div className="import__actions">
        <button className="btn btn--primary" onClick={() => { closeModal(); go('shows'); }}>See my shows</button>
      </div>
    </>
  );
}
