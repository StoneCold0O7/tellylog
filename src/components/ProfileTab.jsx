/* Profile tab: stats, poster strip, data actions. Mirrors renderProfile. */
import React, { useState } from 'react';
import * as Store from '../lib/store.js';
import * as TMDB from '../lib/tmdb.js';
import * as U from '../lib/util.js';
import { useApp } from '../context.js';
import { Poster, SectionLabel, Counter, Notice } from './shared.jsx';
import InsightsSection from './InsightsSection.jsx';

export default function ProfileTab() {
  const { openShow, openModal, toast, go, setMoviesSub } = useApp();
  const [showView, setShowView] = useState('posters'); // 'posters' | 'list'
  const [editing, setEditing] = useState(false);
  const st = Store.stats();
  const shows = Object.keys(Store.get().shows).map((id) => Store.get().shows[id]);
  shows.sort((a, b) => (b.lastWatchedAt || b.added) - (a.lastWatchedAt || a.added));
  const cover = Store.cover();
  const avatar = Store.avatar();
  const backdrop = cover || (shows.length && shows[0].backdrop ? TMDB.img(shows[0].backdrop, 'w780') : '');

  /* v2.5.0: images are downscaled and recompressed on the client
     BEFORE they touch localStorage, because a raw phone photo as
     base64 would eat most of the ~5MB quota and triple every backup.
     Hard cap after compression as a second line of defence. */
  function pickImage(kind) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const maxW = kind === 'avatar' ? 256 : 1280;
      const maxH = kind === 'avatar' ? 256 : 512;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, maxW / img.width, maxH / img.height);
          const cv = document.createElement('canvas');
          cv.width = Math.max(1, Math.round(img.width * scale));
          cv.height = Math.max(1, Math.round(img.height * scale));
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          const url = cv.toDataURL('image/jpeg', 0.82);
          if (url.length > 400000) { toast('That image is too large even after compression. Try a smaller one.'); return; }
          if (kind === 'avatar') Store.setAvatar(url); else Store.setCover(url);
          toast(kind === 'avatar' ? 'Profile photo updated.' : 'Cover updated.');
        };
        img.onerror = () => toast('Could not read that image.');
        img.src = reader.result;
      };
      reader.onerror = () => toast('Could not read that file.');
      reader.readAsDataURL(file);
    };
    input.click();
  }

  function exportBackup() {
    const blob = new Blob([Store.exportJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tellylog-backup-' + new Date().toISOString().slice(0, 10) + '.json';
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
        <button className="btn btn--ghost btn--mini profile-hero__edit" onClick={() => setEditing(!editing)} aria-expanded={editing}>{editing ? 'Done' : 'Edit'}</button>
        {avatar
          ? <img className="avatar avatar--img" src={avatar} alt="Profile" />
          : <div className="avatar" aria-hidden="true">{(Store.get().settings.profileName || 'Y')[0].toUpperCase()}</div>}
      </div>
      {editing && (
        <div className="hero-edit">
          <button className="btn btn--tiny" onClick={() => pickImage('avatar')}>Change photo</button>
          {avatar && <button className="btn btn--tiny btn--ghost" onClick={() => { Store.setAvatar(null); toast('Photo removed.'); }}>Remove photo</button>}
          <button className="btn btn--tiny" onClick={() => pickImage('cover')}>Change cover</button>
          {cover && <button className="btn btn--tiny btn--ghost" onClick={() => { Store.setCover(null); toast('Cover removed.'); }}>Remove cover</button>}
        </div>
      )}

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
        <button className="stat-card stat-card--tap" onClick={() => { setMoviesSub('watched'); go('movies'); }}>
          <div className="stat-card__label">🎬 Films watched</div>
          <div className="stat-card__big">{U.fmtNumber(st.moviesWatched)}</div>
          <div className="stat-card__hint">See the list ›</div>
        </button>
      </div>
      <div className="data-actions">
        <button className="btn btn--primary" onClick={() => openModal({ type: 'stats' })}>📊 Open your stats</button>
      </div>

      <InsightsSection />

      <div className="section-row">
        <SectionLabel>{'SHOWS (' + shows.length + ')'}</SectionLabel>
        {shows.length > 0 && (
          <div className="seg seg--mini" role="group" aria-label="Shows view">
            <button className={'seg__opt' + (showView === 'posters' ? ' seg__opt--on' : '')} onClick={() => setShowView('posters')}>Posters</button>
            <button className={'seg__opt' + (showView === 'list' ? ' seg__opt--on' : '')} onClick={() => setShowView('list')}>List</button>
          </div>
        )}
      </div>
      {shows.length === 0 ? <Notice>No shows tracked yet.</Notice> : showView === 'posters' ? (
        <div className="poster-strip">
          {shows.map((sh) => (
            <button className="poster-strip__item" key={sh.id} onClick={() => openShow(sh.id)}>
              <Poster path={sh.poster} alt={sh.name} size="w342" />
            </button>
          ))}
        </div>
      ) : (
        <div className="show-list">
          {shows.map((sh) => (
            <article className="ep-row" key={sh.id}>
              <button className="ep-row__poster" onClick={() => openShow(sh.id)}>
                <Poster path={sh.poster} alt={sh.name} />
              </button>
              <div className="ep-row__body">
                <button className="ep-row__title title-link" onClick={() => openShow(sh.id)}>
                  {sh.name}<span className="title-link__chev" aria-hidden="true">›</span>
                </button>
                <div className="ep-row__meta">
                  {Store.watchedCount(sh)} of {Store.totalEpisodes(sh)} episodes
                  {sh.archived ? <span className="chip chip--arch">ARCHIVED</span> : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

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
        <button className="btn btn--primary" onClick={() => openModal({ type: 'import' })}>Import watch history</button>
        <button className="btn btn--ghost" onClick={exportBackup}>Download backup (JSON)</button>
        <button className="btn btn--ghost" onClick={() => openModal({ type: 'import' })}>Restore backup</button>
        <button className="btn btn--ghost" onClick={() => openModal({ type: 'settings' })}>TMDB API key</button>
        <button className="btn btn--danger" onClick={clearAll}>Delete everything</button>
      </div>
      <p className="fineprint">Import accepts TV Time, Netflix, Letterboxd and IMDb exports plus TellyLog backups. All data is stored in this browser only. Nothing is uploaded anywhere. Metadata comes from TMDB.</p>
      <p className="fineprint">TellyLog is designed and built by Anmol. The code, the decision log and every reversal along the way are public: <a className="credit-link" href="https://github.com/StoneCold0O7/tellylog" target="_blank" rel="noreferrer">github.com/StoneCold0O7/tellylog</a></p>
    </>
  );
}
