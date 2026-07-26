/* Shows tab, Phase 1 layout:
   [nudge banner] -> [Tonight card] -> [Up next queue] ->
   [Still watching? keep/drop] -> [history].
   Empty store shows the search-led FirstRun instead. */
import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
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

/* A scroll that would not move anything is not performed. That keeps the
   panel from cancelling a reader's own momentum for no reason, and it
   keeps jsdom (which has no scrolling and complains about being asked)
   quiet in the component tests. */
function scrollToY(top) {
  if (Math.abs(top - window.scrollY) < 1) return;
  window.scrollTo({ top: top, behavior: 'auto' });
}

/* The pull means different things at different points, so it says which
   one out loud rather than leaving the reader to guess. */
function pullLabel(mode, armed) {
  if (mode === 'more') return armed ? 'Release for older episodes' : 'Pull for older episodes';
  return armed ? 'Release for your history' : 'Pull for your history';
}

/* v2.8.2: the history reads one page at a time. Fifteen is the owner's
   number, chosen to be a screenful or so on a phone. */
const HIST_PAGE = 15;
const PULL_COMMIT = 60;   // px of travel that counts as a decision
const PULL_MAX = 110;     // visual travel cap
/* v2.8.2: was 0.5, which meant a 120px finger drag to earn a 60px
   commit. Part of why the gesture read as sluggish. */
const PULL_DAMP = 0.75;

export default function ShowsTab() {
  const { openShow, go, openModal } = useApp();
  const [, setTick] = useState(0);
  const [histView, setHistView] = useState('episodes'); // 'episodes' | 'byshow' (v2.7.2)

  /* v2.8.2 performance. These selectors are not cheap on a real library:
     history() sorts the whole log (10.5k entries after the TV Time
     import) and watchNextList/showProgressList walk 300 shows. They used
     to run on EVERY render, and the pull gesture re-rendered this
     component on every touchmove, so they were running around sixty
     times a second while a thumb moved. That, not the animation, is what
     made the pull feel sluggish. App subscribes to the store, so a
     mutation still re-renders this tree; keying the memo on the store
     revision means the work happens when the data changed and not when a
     local piece of UI state did. */
  const rev = Store.getRev();
  const lists = useMemo(() => Store.watchNextList(), [rev]);
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
  const [histPages, setHistPages] = useState(1);

  /* One extra row is requested so "is there more" is an exact answer
     rather than a guess: history() drops entries whose show has been
     removed, so a short result does not by itself mean the end. */
  const histWindow = useMemo(
    () => Store.history(histPages * HIST_PAGE + 1),
    [rev, histPages]
  );
  const histMore = histWindow.length > histPages * HIST_PAGE;
  const hist = histMore ? histWindow.slice(0, histPages * HIST_PAGE) : histWindow;
  /* v2.8.2, owner request: newest at the BOTTOM. The panel hangs above
     the page, so the newest episode ends up nearest the content and is
     the first thing the pull reveals; scrolling up walks backwards in
     time. history() returns newest first, so display order is reversed. */
  const histRows = useMemo(() => hist.slice().reverse(), [hist]);
  const byShow = useMemo(
    () => (histOpen && histView === 'byshow' ? Store.showProgressList() : []),
    [rev, histOpen, histView]
  );

  const zoneRef = useRef(null);     // the whole tab, translated during a pull
  const hintRef = useRef(null);
  const labelRef = useRef(null);
  const panelRef = useRef(null);
  const pullRef = useRef(0);        // travel; a ref because React batches touchmoves
  const modeRef = useRef(null);     // 'open' | 'more' | null, decided at touchstart
  const openAtEnd = useRef(false);  // land on the newest row after an open
  const growFrom = useRef(0);       // panel height before older rows are prepended
  const collapseTo = useRef(-1);    // scroll position to restore after an auto-condense

  const canPullMore = histOpen && histView === 'episodes' && histMore;

  /* The gesture writes transform and opacity STRAIGHT to the DOM instead
     of going through state. Both are compositor properties, so a pull is
     a repaint rather than a relayout (the old version animated `height`,
     which reflowed the page every frame), and React is not asked to
     re-render sixty times a second. Nothing else writes these two
     properties, and the handler always clears them on release, so the
     direct writes cannot fight the renderer. */
  useEffect(() => {
    if (hist.length === 0) return undefined;
    let startY = null;
    const paint = (v) => {
      pullRef.current = v;
      const zone = zoneRef.current;
      const hint = hintRef.current;
      if (zone) zone.style.transform = v ? 'translateY(' + v + 'px)' : '';
      if (hint) hint.style.opacity = v ? String(Math.min(1, v / 40)) : '0';
      if (labelRef.current) {
        labelRef.current.classList.toggle('pullhint__label--armed', v >= PULL_COMMIT);
        labelRef.current.textContent = pullLabel(modeRef.current, v >= PULL_COMMIT);
      }
    };
    const settle = (on) => {
      if (zoneRef.current) zoneRef.current.classList.toggle('pullzone--settle', on);
    };
    const ts = (ev) => {
      /* Both pulls start from the very top. Above the collapsed handle it
         means "show me the history"; above the OLDEST row of an open
         panel it means "show me fifteen older". */
      modeRef.current = window.scrollY <= 4 ? (histOpen ? (canPullMore ? 'more' : null) : 'open') : null;
      startY = modeRef.current ? ev.touches[0].clientY : null;
    };
    const tm = (ev) => {
      if (startY == null) return;
      const dy = ev.touches[0].clientY - startY;
      settle(false);
      paint(dy > 0 ? Math.min(PULL_MAX, dy * PULL_DAMP) : 0);
    };
    const te = () => {
      const committed = pullRef.current >= PULL_COMMIT;
      const mode = modeRef.current;
      /* Snap the transform away with NO transition on a commit, because
         the layout effect below measures the panel immediately after and
         a mid-flight transform would poison getBoundingClientRect. An
         abandoned pull keeps the eased settle, which is the only case
         where the rubber band needs to be seen coming back. */
      settle(!committed);
      paint(0);
      if (committed && mode === 'open') { openAtEnd.current = true; setHistOpen(true); }
      if (committed && mode === 'more') loadOlder();
      startY = null;
      modeRef.current = null;
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
  }); /* no dep array: the handlers close over histOpen and canPullMore,
         and re-binding four passive listeners per render is far cheaper
         than the store reads this change just removed. */

  function loadOlder() {
    growFrom.current = panelRef.current ? panelRef.current.offsetHeight : 0;
    setHistPages((p) => p + 1);
  }

  /* Opening lands on the NEWEST row, the way a chat window opens on the
     newest message. The panel sits above the page, so that means
     scrolling to its far end and leaving a strip of the tab visible
     underneath, which is also the cue that there is more below. */
  useLayoutEffect(() => {
    if (!histOpen || !openAtEnd.current || !panelRef.current) return;
    openAtEnd.current = false;
    const bottom = panelRef.current.getBoundingClientRect().bottom + window.scrollY;
    /* auto, not smooth: smooth scrollTo is a silent no-op in some
       embedded browsers, the lesson from v2.7.7. */
    scrollToY(Math.max(0, bottom - window.innerHeight + 96));
  }, [histOpen]);

  /* Older rows are prepended, so the page grows UPWARD. No scroll
     compensation here on purpose: the pull was a deliberate ask for
     older episodes at the top of the list, so staying at the top and
     landing on the newly revealed block is the answer to it. Compensating
     would leave the screen looking as though nothing had happened. */
  useLayoutEffect(() => {
    if (growFrom.current) growFrom.current = 0;
  }, [histPages]);

  /* Auto-condense, the owner's "when I reach the titles it packs itself
     away". Removing content ABOVE the viewport shrinks the page under
     the reader, so the scroll position has to lose exactly what the
     layout lost or everything on screen jumps upward by the height of
     the panel. Two deliberate choices guard that: the collapse waits
     until scrolling has STOPPED, so the correction never fights iOS
     momentum, and overflow-anchor is off on the panel so the browser's
     own anchoring cannot apply a second correction on top of this one. */
  useEffect(() => {
    if (!histOpen) return undefined;
    let idle = 0;
    const onScroll = () => {
      clearTimeout(idle);
      idle = setTimeout(() => {
        const el = panelRef.current;
        if (!el) return;
        if (el.getBoundingClientRect().bottom < -40) {
          /* The TARGET is worked out here, before the collapse, not
             afterwards. Verified in a real browser: the moment the panel
             leaves the document the page gets shorter, the browser
             clamps the scroll position to the new maximum on the spot,
             and a layout effect reading scrollY afterwards is already
             reading the clamped value. Subtracting the panel height from
             that overshoots by however much was clamped away, which threw
             the reader to the top of the page. */
          collapseTo.current = Math.max(0, window.scrollY - el.offsetHeight);
          setHistOpen(false);
          setHistPages(1);
        }
      }, 140);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); clearTimeout(idle); };
  }, [histOpen]);

  useLayoutEffect(() => {
    if (!histOpen && collapseTo.current >= 0) {
      const to = collapseTo.current;
      collapseTo.current = -1;
      scrollToY(to);
    }
  }, [histOpen]);

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
      {/* v2.8.2: an explicit route to the older page, because the pull
          must never be the only way in. It sits at the OLD end of the
          list, which is where the pull for it also lives. */}
      {canPullMore && (
        <div className="histtop__morerow">
          <button className="histtop__more" onClick={loadOlder}>▲ Older episodes</button>
        </div>
      )}
      {histView === 'episodes' ? histRows.map((h, i) => (
        <EpRow
          key={h.show.id + '-' + h.s + '-' + h.e + '-' + i}
          show={h.show} s={h.s} e={h.e} checked
          onToggle={() => Store.markEpisode(h.show.id, h.s, h.e, false)}
        />
      )) : byShow.map((p) => (
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
      {/* v2.7.2: the history gains a second lens. Episodes is the
          existing as-watched stream; By show aggregates one row per
          series with the accent progress bar, distinct episodes
          ticked and completion percent (rewatches never inflate
          it). Same seg pattern as the Profile toggles.
          v2.8.2: this header moved from the top of the panel to the
          bottom. With the newest episode at the bottom, the top of the
          panel is now the far end of the list, and a control stranded
          thirty rows above where you are reading is a control you do not
          use. Paging and reverse order are an Episodes idea only: By
          show is an aggregate with no chronology, so it stays whole. */}
      <div className="section-row section-row--histfoot">
        <SectionLabel>WATCHED HISTORY</SectionLabel>
        <div className="seg seg--mini" role="group" aria-label="History view">
          <button className={'seg__opt' + (histView === 'episodes' ? ' seg__opt--on' : '')} onClick={() => setHistView('episodes')}>Episodes</button>
          <button className={'seg__opt' + (histView === 'byshow' ? ' seg__opt--on' : '')} onClick={() => setHistView('byshow')}>By show</button>
        </div>
      </div>
    </>
  );

  return (
    <div className="pullzone" ref={zoneRef}>
      {hist.length > 0 && (
        <>
          {/* Parked just above the tab and invisible at rest. The pull
              translates the whole tab down, which slides this into the
              gap it opens. */}
          <div className="pullhint" ref={hintRef} aria-hidden="true">
            <span className="pullhint__label" ref={labelRef}>Pull for your history</span>
          </div>

          {/* The panel is rendered BEFORE the handle so the handle sits
              at the newest end, next to the row you are meant to read
              first and next to the view toggle. */}
          {histOpen && <div className="histtop__panel" ref={panelRef}>{historyPanel}</div>}

          <div className="histtop">
            <button
              className="histtop__handle"
              onClick={() => {
                if (histOpen) { setHistOpen(false); setHistPages(1); }
                else { openAtEnd.current = true; setHistOpen(true); }
              }}
              aria-expanded={histOpen}
            >
              <span className={'histtop__chev' + (histOpen ? ' histtop__chev--open' : '')} aria-hidden="true">▾</span>
              {histOpen ? 'Hide history' : 'Watched history'}
            </button>
          </div>
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
    </div>
  );
}
