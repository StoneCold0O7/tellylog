/* Profile tab: stats, poster strip, data actions. Mirrors renderProfile. */
import React, { useState, useRef, useEffect } from 'react';
import * as Store from '../lib/store.js';
import * as TMDB from '../lib/tmdb.js';
import * as U from '../lib/util.js';
import { useApp } from '../context.js';
import { Poster, SectionLabel, Counter, Notice } from './shared.jsx';
import InsightsSection from './InsightsSection.jsx';
import StatsAsk from './StatsAsk.jsx';
import InstallSteps from './InstallSteps.jsx';

export default function ProfileTab() {
  const { openShow, openPreview, openModal, toast, go, setMoviesSub, exploreFocus: navFocus } = useApp();
  const [showView, setShowView] = useState('posters'); // 'posters' | 'list'
  const [libKind, setLibKind] = useState('shows');     // 'shows' | 'films' (v2.7.1)
  const [editing, setEditing] = useState(false);
  /* "Add to your phone" is an opt-in fold-out here (collapsed by default,
     the same as the Archived section), BUT arriving from the tag on the
     Shows or Films tab lands with it already open. go('profile','install')
     carries that signal through the shared nav focus; a plain Profile visit
     passes nothing, so it stays collapsed. */
  const [installOpen, setInstallOpen] = useState(navFocus === 'install');
  /* Arriving from the tag should not just land at the top of Profile: it
     scrolls down to the ADD TO YOUR PHONE section (already open) so the
     steps are in view immediately. go() had just scrolled to the top; this
     runs after mount and overrides it. rAF waits for first layout so the
     target position is real. */
  const installRef = useRef(null);
  useEffect(() => {
    if (navFocus !== 'install' || !installRef.current) return;
    const el = installRef.current;
    /* setTimeout, not requestAnimationFrame: rAF callbacks are paused when
       the tab is not foregrounded, so the jump could silently never fire.
       The small delay lets the page lay out first. behavior:'auto' (instant)
       because smooth scrollIntoView is a no-op in some embedded browsers; a
       reliable jump to the section beats a pretty animation that does
       nothing. scroll-margin-top on .install-anchor clears the sticky bar. */
    const id = setTimeout(() => el.scrollIntoView({ behavior: 'auto', block: 'start' }), 60);
    return () => clearTimeout(id);
  }, [navFocus]);
  const [nameDraft, setNameDraft] = useState(() => Store.profileName()); // v2.7.2
  const st = Store.stats();
  const shows = Object.keys(Store.get().shows).map((id) => Store.get().shows[id]);
  shows.sort((a, b) => (b.lastWatchedAt || b.added) - (a.lastWatchedAt || a.added));
  /* v2.7.1: watched films get the same browser the shows have, behind
     a Shows | Films segment (owner ruling: two alternating buttons,
     the same pattern as Posters | List, rather than stacked lists). */
  const films = Object.keys(Store.get().movies).map((id) => Store.get().movies[id])
    .filter((mv) => !!mv.watchedAt)
    .sort((a, b) => (b.watchedAt || 0) - (a.watchedAt || 0));
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

  return (
    <>
      <div className={'profile-hero' + (backdrop ? ' profile-hero--img' : '')} style={backdrop ? { backgroundImage: "linear-gradient(rgba(10,10,14,.55),rgba(10,10,14,.92)),url('" + backdrop + "')" } : undefined}>
        <button className="btn btn--ghost btn--mini profile-hero__edit" onClick={() => setEditing(!editing)} aria-expanded={editing}>{editing ? 'Done' : 'Edit'}</button>
        {avatar
          ? <img className="avatar avatar--img" src={avatar} alt="Profile" />
          : <div className="avatar" aria-hidden="true">{Array.from(Store.profileName())[0].toUpperCase()}</div>}
        <div className="profile-hero__name">{Store.profileName()}</div>
      </div>
      {editing && (
        <div className="hero-edit">
          {/* v2.7.2: the name was schema-resident since Phase 0 but had
              no editor; this closes the gap alongside photo and cover. */}
          <div className="hero-edit__namewrap">
            <input
              className="hero-edit__name" type="text" maxLength={30}
              placeholder="Your name" aria-label="Profile name"
              value={nameDraft} onChange={(e) => setNameDraft(e.target.value)}
            />
            <button className="btn btn--tiny" onClick={() => { Store.setProfileName(nameDraft); setNameDraft(Store.profileName()); toast('Name updated.'); }}>Save name</button>
          </div>
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

      <StatsAsk />

      <div className="section-row">
        <SectionLabel>{libKind === 'shows' ? 'SHOWS (' + shows.length + ')' : 'FILMS (' + films.length + ')'}</SectionLabel>
        <div className="seg-pair">
          <div className="seg seg--mini" role="group" aria-label="Library kind">
            <button className={'seg__opt' + (libKind === 'shows' ? ' seg__opt--on' : '')} onClick={() => setLibKind('shows')}>Shows</button>
            <button className={'seg__opt' + (libKind === 'films' ? ' seg__opt--on' : '')} onClick={() => setLibKind('films')}>Films</button>
          </div>
          {(libKind === 'shows' ? shows.length : films.length) > 0 && (
            <div className="seg seg--mini" role="group" aria-label="Library view">
              <button className={'seg__opt' + (showView === 'posters' ? ' seg__opt--on' : '')} onClick={() => setShowView('posters')}>Posters</button>
              <button className={'seg__opt' + (showView === 'list' ? ' seg__opt--on' : '')} onClick={() => setShowView('list')}>List</button>
            </div>
          )}
        </div>
      </div>
      {libKind === 'shows' ? (
        shows.length === 0 ? <Notice>No shows tracked yet.</Notice> : showView === 'posters' ? (
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
        )
      ) : (
        films.length === 0 ? <Notice>No films watched yet.</Notice> : showView === 'posters' ? (
          <div className="poster-strip">
            {films.map((mv) => (
              <button className="poster-strip__item" key={mv.id} onClick={() => openPreview('movie', mv.id)}>
                <Poster path={mv.poster} alt={mv.title} size="w342" />
              </button>
            ))}
          </div>
        ) : (
          <div className="show-list">
            {films.map((mv) => (
              <article className="ep-row" key={mv.id}>
                <button className="ep-row__poster" onClick={() => openPreview('movie', mv.id)}>
                  <Poster path={mv.poster} alt={mv.title} />
                </button>
                <div className="ep-row__body">
                  <button className="ep-row__title title-link" onClick={() => openPreview('movie', mv.id)}>
                    {mv.title}<span className="title-link__chev" aria-hidden="true">›</span>
                  </button>
                  <div className="ep-row__meta">
                    {(mv.releaseDate || '').slice(0, 4)}{mv.runtime ? ' · ' + U.fmtRuntime(mv.runtime) : ''}{mv.rating ? ' · ' + mv.rating + '/5' : ''}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )
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

      <div className="install-anchor" ref={installRef}>
        <SectionLabel>ADD TO YOUR PHONE</SectionLabel>
        <div className="install-inline">
          <button className="install-inline__toggle" onClick={() => setInstallOpen(!installOpen)} aria-expanded={installOpen}>
            <span>📱 How to add to your phone</span>
            <span className={'install-inline__chev' + (installOpen ? ' install-inline__chev--open' : '')} aria-hidden="true">▾</span>
          </button>
          {installOpen && <InstallSteps />}
        </div>
      </div>

      {/* v2.6.0: the data actions moved into their own modal, same
          opt-in pattern as stats, on the owner's ruling. */}
      <SectionLabel>YOUR DATA</SectionLabel>
      <div className="data-actions">
        <button className="btn" onClick={() => openModal({ type: 'data' })}>🗂️ Manage your data</button>
      </div>
      <p className="fineprint">Your watch history is stored in this browser only and is never uploaded. TellyLog counts anonymous visits with cookie-free analytics; nothing personal is collected. Metadata comes from TMDB.</p>
      <p className="fineprint">TellyLog is designed and built by Anmol. The code, the decision log and every reversal along the way are public: <a className="credit-link" href="https://github.com/StoneCold0O7/tellylog" target="_blank" rel="noreferrer">github.com/StoneCold0O7/tellylog</a> · <a className="credit-link" href="#/colophon">How this was made</a></p>
    </>
  );
}
