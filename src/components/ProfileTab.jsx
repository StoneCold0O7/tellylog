/* Profile tab: stats, poster strip, data actions. Mirrors renderProfile. */
import React from 'react';
import * as Store from '../lib/store.js';
import * as TMDB from '../lib/tmdb.js';
import * as U from '../lib/util.js';
import { useApp } from '../context.js';
import { Poster, SectionLabel, Counter, Notice } from './shared.jsx';

export default function ProfileTab() {
  const { openShow, openModal, toast } = useApp();
  const st = Store.stats();
  const shows = Object.keys(Store.get().shows).map((id) => Store.get().shows[id]);
  shows.sort((a, b) => (b.lastWatchedAt || b.added) - (a.lastWatchedAt || a.added));
  const backdrop = shows.length && shows[0].backdrop ? TMDB.img(shows[0].backdrop, 'w780') : '';

  function exportBackup() {
    const blob = new Blob([Store.exportJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'logline-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function clearAll() {
    if (confirm('Delete every show, film and stat stored in this browser? Download a backup first if in doubt.')) {
      Store.clearAll();
      toast('All data deleted.');
    }
  }

  return (
    <>
      <div className="profile-hero" style={backdrop ? { backgroundImage: "linear-gradient(rgba(10,10,14,.55),rgba(10,10,14,.92)),url('" + backdrop + "')" } : undefined}>
        <div className="avatar" aria-hidden="true">{(Store.get().settings.profileName || 'Y')[0].toUpperCase()}</div>
      </div>

      <SectionLabel>STATS</SectionLabel>
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-card__label">📺 TV time</div>
          <div className="stat-card__counters">
            <Counter n={st.tvTime.months} label="MONTHS" />
            <Counter n={st.tvTime.days} label="DAYS" />
            <Counter n={st.tvTime.hours} label="HOURS" />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">📺 Episodes watched</div>
          <div className="stat-card__big">{U.fmtNumber(st.episodes)}</div>
        </div>
      </div>
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-card__label">🎬 Film time</div>
          <div className="stat-card__counters">
            <Counter n={st.movieTime.months} label="MONTHS" />
            <Counter n={st.movieTime.days} label="DAYS" />
            <Counter n={st.movieTime.hours} label="HOURS" />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">🎬 Films watched</div>
          <div className="stat-card__big">{U.fmtNumber(st.moviesWatched)}</div>
        </div>
      </div>

      <SectionLabel>{'SHOWS (' + shows.length + ')'}</SectionLabel>
      {shows.length ? (
        <div className="poster-strip">
          {shows.map((sh) => (
            <button className="poster-strip__item" key={sh.id} onClick={() => openShow(sh.id)}>
              <Poster path={sh.poster} alt={sh.name} size="w342" />
            </button>
          ))}
        </div>
      ) : <Notice>No shows tracked yet.</Notice>}

      <SectionLabel>ADD MORE</SectionLabel>
      <div className="data-actions">
        <button className="btn" onClick={() => openModal({ type: 'grid' })}>Browse popular titles</button>
      </div>

      <SectionLabel>APPEARANCE</SectionLabel>
      <div className="seg" role="group" aria-label="Theme">
        <button
          className={'seg__opt' + (Store.theme() === 'dark' ? ' seg__opt--on' : '')}
          onClick={() => Store.setTheme('dark')}
        >Dark</button>
        <button
          className={'seg__opt' + (Store.theme() === 'light' ? ' seg__opt--on' : '')}
          onClick={() => Store.setTheme('light')}
        >Light</button>
      </div>

      <SectionLabel>YOUR DATA</SectionLabel>
      <div className="data-actions">
        <button className="btn btn--primary" onClick={() => openModal({ type: 'import' })}>Import TV Time export</button>
        <button className="btn btn--ghost" onClick={exportBackup}>Download backup (JSON)</button>
        <button className="btn btn--ghost" onClick={() => openModal({ type: 'import' })}>Restore backup</button>
        <button className="btn btn--ghost" onClick={() => openModal({ type: 'settings' })}>TMDB API key</button>
        <button className="btn btn--danger" onClick={clearAll}>Delete everything</button>
      </div>
      <p className="fineprint">All data is stored in this browser only. Nothing is uploaded anywhere. Metadata comes from TMDB.</p>
    </>
  );
}
