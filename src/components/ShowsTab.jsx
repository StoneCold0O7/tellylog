/* Shows tab, Phase 1 layout:
   [nudge banner] -> [Tonight card] -> [Up next queue] ->
   [Still watching? keep/drop] -> [history].
   Empty store shows the search-led FirstRun instead. */
import React, { useState, useEffect, useRef } from 'react';
import * as Store from '../lib/store.js';
import * as U from '../lib/util.js';
import { useApp } from '../context.js';
import { EpRow, SectionLabel, EmptyState, Poster, useEpisodeName } from './shared.jsx';
import TonightCard from './TonightCard.jsx';
import FirstRun from './FirstRun.jsx';

/* Nudge dismissal lasts for the page session only, by design. */
let nudgeDismissed = false;

function NextRow({ entry }) {
  const sh = entry.show;
  const s = entry.next.s;
  const e = entry.next.e;
  const epName = useEpisodeName(sh.id, s, e);
  return (
    <EpRow
      show={sh} s={s} e={e} remaining={entry.remaining}
      epName={epName}
      checked={false}
      onToggle={() => Store.markEpisode(sh.id, s, e, true)}
    />
  );
}

function StaleCard({ entry }) {
  const { openShow, toast } = useApp();
  const sh = entry.show;
  const last = Math.max(sh.lastWatchedAt || 0, sh.keptAt || 0) || sh.added;
  const days = Math.max(1, Math.round((Date.now() - last) / U.DAY_MS));
  return (
    <article className="stale-card">
      <button className="ep-row__poster" onClick={() => openShow(sh.id)}>
        <Poster path={sh.poster} alt={sh.name} />
      </button>
      <div className="stale-card__body">
        <button className="stale-card__name" onClick={() => openShow(sh.id)}>{sh.name}</button>
        <div className="stale-card__meta">Last watched {days} days ago · {entry.remaining} left</div>
      </div>
      <div className="stale-card__actions">
        <button className="btn btn--tiny btn--primary" onClick={() => { Store.keepShow(sh.id); toast('Kept. Back in your queue.'); }}>Keep</button>
        <button className="btn btn--tiny btn--ghost" onClick={() => { Store.setArchived(sh.id, true); toast('Dropped. Your stats keep it.'); }}>Drop</button>
      </div>
    </article>
  );
}

function ArchivedSection() {
  const { openShow, toast } = useApp();
  const [open, setOpen] = useState(false);
  const list = Store.archivedShows();
  if (list.length === 0) return null;
  return (
    <div className="arch">
      <button className="arch__toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
        ARCHIVED ({list.length}) <span className={'arch__chev' + (open ? ' arch__chev--open' : '')}>▾</span>
      </button>
      {open && list.map((sh) => (
        <article className="ep-row" key={sh.id}>
          <button className="ep-row__poster" onClick={() => openShow(sh.id)}>
            <Poster path={sh.poster} alt={sh.name} />
          </button>
          <div className="ep-row__body">
            <button className="ep-row__title title-link" onClick={() => openShow(sh.id)}>
              {sh.name}<span className="title-link__chev" aria-hidden="true">›</span>
            </button>
            <div className="ep-row__meta">{Store.remainingCount(sh)} left · still counts in your stats</div>
          </div>
          <div className="ep-row__actions">
            <button className="btn btn--tiny" onClick={() => { Store.setArchived(sh.id, false); toast('Back in your queue.'); }}>Unarchive</button>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function ShowsTab() {
  const { openShow, go, openModal } = useApp();
  const [, setTick] = useState(0);
  const [histView, setHistView] = useState('episodes'); // 'episodes' | 'byshow' (v2.7.2)
  const lists = Store.watchNextList();
  const hist = Store.history(20);
  const showCount = Object.keys(Store.get().shows).length;

  /* v2.8.1, owner correction: v2.8.0 made the pull SCROLL DOWN to the
     history where it sat at the bottom of the tab. That was the wrong
     reading of the request. The history now physically lives at the TOP
     and the pull reveals it in place, so it comes down from above the
     content instead of throwing you to the end of the page.

     It stays collapsed by default, which is what keeps the Tonight-first
     layout from Phase 1 intact: the default view is unchanged, the
     history is one gesture away rather than one long scroll away.

     The handle above is a real button, not decoration. A gesture must
     never be the only route to a feature, or the app becomes unusable
     for anyone on a desktop, a keyboard or a screen reader.

     Listeners live on window rather than a wrapper element so the tab's
     layout is untouched, and they are passive because the gesture never
     needs to cancel a scroll; Android's own pull-to-refresh is held off
     by overscroll-behavior in CSS, not by preventDefault. */
  const [histOpen, setHistOpen] = useState(false);
  const [pull, setPull] = useState(0);
  const PULL_COMMIT = 60;
  /* Travel is mirrored into a ref for the same reason the swipe row keeps
     one: React batches rapid touchmoves, so the release handler cannot
     trust state to be current. It also keeps scrollIntoView OUT of a
     state updater, where a side effect does not belong and can be
     deferred or double-invoked. */
  const pullRef = useRef(0);

  useEffect(() => {
    if (hist.length === 0) return undefined;
    let startY = null;
    const setPullBoth = (v) => { pullRef.current = v; setPull(v); };
    const ts = (ev) => { startY = window.scrollY <= 4 ? ev.touches[0].clientY : null; };
    const tm = (ev) => {
      if (startY == null) return;
      const dy = ev.touches[0].clientY - startY;
      setPullBoth(dy > 0 ? Math.min(110, dy * 0.5) : 0);
    };
    const te = () => {
      if (pullRef.current >= PULL_COMMIT) setHistOpen(true);
      setPullBoth(0);
      startY = null;
    };
    window.addEventListener('touchstart', ts, { passive: true });
    window.addEventListener('touchmove', tm, { passive: true });
    window.addEventListener('touchend', te, { passive: true });
    window.addEventListener('touchcancel', te, { passive: true });
    return () => {
      window.removeEventListener('touchstart', ts);
      window.removeEventListener('touchmove', tm);
      window.removeEventListener('touchend', te);
      window.removeEventListener('touchcancel', te);
    };
  }, [hist.length]);

  if (showCount === 0 && hist.length === 0) return <FirstRun />;

  /* v2.7.1: the watchlist moved from the bottom of this tab (where a
     long watch history buried it beyond reach) to a button at the top
     opening a modal, on the owner's ruling. Always visible once the
     tab has content, so a new user learns the feature exists. */
  const wl = Store.watchlistShows();

  const tonight = lists.next.length > 0 ? lists.next[0] : null;
  const queue = lists.next.slice(1);
  const nudge = !nudgeDismissed ? Store.nudgePick(tonight ? tonight.show.id : null) : null;

  const historyPanel = (
    <>
      {/* v2.7.2: the history gains a second lens. Episodes is the
          existing as-watched stream; By show aggregates one row per
          series with the accent progress bar, distinct episodes
          ticked and completion percent (rewatches never inflate
          it). Same seg pattern as the Profile toggles. */}
      <div className="section-row">
        <SectionLabel>WATCHED HISTORY</SectionLabel>
        <div className="seg seg--mini" role="group" aria-label="History view">
          <button className={'seg__opt' + (histView === 'episodes' ? ' seg__opt--on' : '')} onClick={() => setHistView('episodes')}>Episodes</button>
          <button className={'seg__opt' + (histView === 'byshow' ? ' seg__opt--on' : '')} onClick={() => setHistView('byshow')}>By show</button>
        </div>
      </div>
      {histView === 'episodes' ? hist.map((h, i) => (
        <EpRow
          key={h.show.id + '-' + h.s + '-' + h.e + '-' + i}
          show={h.show} s={h.s} e={h.e} checked
          onToggle={() => Store.markEpisode(h.show.id, h.s, h.e, false)}
        />
      )) : Store.showProgressList().map((p) => (
        <article className="ep-row" key={'agg-' + p.show.id}>
          <button className="ep-row__poster" onClick={() => openShow(p.show.id)}>
            <Poster path={p.show.poster} alt={p.show.name} />
          </button>
          <div className="ep-row__body">
            <button className="ep-row__title title-link" onClick={() => openShow(p.show.id)}>
              {p.show.name}<span className="title-link__chev" aria-hidden="true">›</span>
            </button>
            <div className="progress progress--row"><div className="progress__bar" style={{ width: p.pct + '%' }}></div></div>
            <div className="ep-row__meta">{p.seen} of {p.total || '?'} episodes · {p.pct}% complete{p.show.archived ? ' · archived' : ''}</div>
          </div>
        </article>
      ))}
    </>
  );

  return (
    <>
      {hist.length > 0 && (
        <>
          <div className="pullhint" style={{ height: pull }} aria-hidden="true">
            <span className={'pullhint__label' + (pull >= PULL_COMMIT ? ' pullhint__label--armed' : '')}>
              {pull >= PULL_COMMIT ? 'Release for your history' : 'Pull for your history'}
            </span>
          </div>

          <div className="histtop">
            <button className="histtop__handle" onClick={() => setHistOpen(!histOpen)} aria-expanded={histOpen}>
              <span className={'histtop__chev' + (histOpen ? ' histtop__chev--open' : '')} aria-hidden="true">▾</span>
              {histOpen ? 'Hide history' : 'Watched history'}
            </button>
          </div>

          {histOpen && <div className="histtop__panel">{historyPanel}</div>}
        </>
      )}

      <div className="install-tagrow">
        <button className="install-tag" onClick={() => go('profile', 'install')}>
          📱 How to add this app to your phone
        </button>
      </div>

      <div className="shows-topbar">
        <button className="btn btn--tiny" onClick={() => openModal({ type: 'watchlist' })}>🔖 Watchlist ({wl.length})</button>
      </div>

      {nudge && (
        <div className="nudge">
          <button className="nudge__text" onClick={() => openShow(nudge.show.id)}>
            <strong>{nudge.remaining === 1 ? '1 episode' : nudge.remaining + ' episodes'}</strong>
            {' '}from finishing {nudge.show.name}
          </button>
          <button className="nudge__x" aria-label="Dismiss" onClick={() => { nudgeDismissed = true; setTick((n) => n + 1); }}>✕</button>
        </div>
      )}

      {tonight ? <TonightCard entry={tonight} /> : (
        <EmptyState title="All caught up" sub="Nothing left in your queue. Find something new in Explore.">
          <div className="empty__actions">
            <button className="btn btn--primary" onClick={() => go('explore')}>Browse shows</button>
          </div>
        </EmptyState>
      )}

      {queue.length > 0 && (
        <>
          <SectionLabel>UP NEXT</SectionLabel>
          {queue.map((en) => <NextRow key={en.show.id} entry={en} />)}
        </>
      )}

      {lists.stale.length > 0 && (
        <>
          <SectionLabel>STILL WATCHING?</SectionLabel>
          {lists.stale.map((en) => <StaleCard key={en.show.id} entry={en} />)}
        </>
      )}

      {/* v2.8.1: the watched history used to sit here, at the bottom.
          It now lives at the TOP behind the pull handle, so it is never
          buried under a long keep/drop pile again. */}

      <ArchivedSection />
    </>
  );
}
