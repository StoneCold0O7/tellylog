/* App root. Replaces app.js: routing, tabs, modal host, toast. */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Store from '../lib/store.js';
import * as TMDB from '../lib/tmdb.js';
import { useStoreRev } from '../hooks/useStore.js';
import { AppContext } from '../context.js';
import Onboarding from './Onboarding.jsx';
import ShowsTab from './ShowsTab.jsx';
import UpcomingTab from './UpcomingTab.jsx';
import MoviesTab from './MoviesTab.jsx';
import ExploreTab from './ExploreTab.jsx';
import ProfileTab from './ProfileTab.jsx';
import ShowModal from './ShowModal.jsx';
import SettingsModal from './SettingsModal.jsx';
import ImportWizard from './ImportWizard.jsx';

const TABS = ['shows', 'upcoming', 'movies', 'explore', 'profile'];
const TAB_META = [
  ['shows', '📺', 'Shows'],
  ['upcoming', '🗓️', 'Upcoming'],
  ['movies', '🎬', 'Films'],
  ['explore', '🔍', 'Explore'],
  ['profile', '👤', 'Profile']
];

function initialTab() {
  const t = (location.hash || '').replace('#/', '');
  return TABS.indexOf(t) !== -1 ? t : 'shows';
}

export default function App() {
  useStoreRev();
  const [tab, setTab] = useState(initialTab);
  const [moviesSub, setMoviesSub] = useState('watchlist');
  const [modal, setModal] = useState(null); // {type:'show',id} | {type:'settings'} | {type:'import'} | null
  const [toastMsg, setToastMsg] = useState('');
  const [toastOn, setToastOn] = useState(false);
  const toastTimer = useRef(null);

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    setToastOn(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastOn(false), 2600);
  }, []);

  const go = useCallback((t) => {
    setTab(t);
    location.hash = '#/' + t;
    window.scrollTo(0, 0);
  }, []);

  const closeModal = useCallback(() => setModal(null), []);

  /* Open a show modal; untracked shows are fetched and tracked first,
     matching the original openShow behaviour. */
  const openShow = useCallback((id) => {
    const sh = Store.get().shows[id];
    if (sh) { setModal({ type: 'show', id }); return; }
    TMDB.tvDetails(id).then((d) => {
      Store.addShow(d);
      setModal({ type: 'show', id });
      toast('Now tracking ' + d.name);
    }).catch(() => toast('Could not load that show.'));
  }, [toast]);

  /* Storage-full errors from the store surface as toasts. */
  useEffect(() => { Store.setSaveErrorHandler(toast); }, [toast]);

  /* Back/forward hash navigation. */
  useEffect(() => {
    const onHash = () => {
      const t = (location.hash || '').replace('#/', '');
      if (TABS.indexOf(t) !== -1) setTab(t);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  /* Body scroll lock while a modal is open, as in the original. */
  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modal]);

  const hasKey = !!Store.apiKey();
  const ctx = { go, toast, openShow, openModal: setModal, closeModal, moviesSub, setMoviesSub };

  return (
    <AppContext.Provider value={ctx}>
      {hasKey && (
        <header id="topbar" className="topbar">
          <div className="brand">Telly<span>Log</span></div>
        </header>
      )}

      <main id="view" className="view" aria-live="polite">
        {!hasKey ? <Onboarding /> : (
          tab === 'shows' ? <ShowsTab /> :
          tab === 'upcoming' ? <UpcomingTab /> :
          tab === 'movies' ? <MoviesTab /> :
          tab === 'explore' ? <ExploreTab /> :
          <ProfileTab />
        )}
      </main>

      {hasKey && (
        <nav id="tabs" className="tabs" aria-label="Sections">
          {TAB_META.map(([t, icon, label]) => (
            <button key={t} className={'tab' + (tab === t ? ' tab--on' : '')} onClick={() => go(t)}>
              <span className="tab__icon">{icon}</span><span>{label}</span>
            </button>
          ))}
        </nav>
      )}

      {modal && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className={'modal ' + (modal.type === 'show' ? 'modal--show' : 'modal--import')} role="dialog" aria-modal="true">
            {modal.type === 'show' && <ShowModal id={modal.id} />}
            {modal.type === 'settings' && <SettingsModal />}
            {modal.type === 'import' && <ImportWizard />}
          </div>
        </div>
      )}

      <div id="toast" className={'toast' + (toastOn ? ' toast--show' : '')}>{toastMsg}</div>
    </AppContext.Provider>
  );
}
