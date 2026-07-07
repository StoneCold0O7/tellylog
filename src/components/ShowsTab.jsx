/* Shows tab, Phase 1 layout:
   [nudge banner] -> [Tonight card] -> [Up next queue] ->
   [Still watching? keep/drop] -> [history].
   Empty store shows the search-led FirstRun instead. */
import React, { useState } from 'react';
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

/* v2.5.0: saved-for-later shows, the TV twin of the film watchlist.
   Collapsible like ARCHIVED. Start moves the show into the queue and
   opens the tracker; watching any episode does the same implicitly. */
function WatchlistSection() {
  const { openShow, toast } = useApp();
  const [open, setOpen] = useState(true);
  const list = Store.watchlistShows();
  if (list.length === 0) return null;
  return (
    <div className="arch">
      <button className="arch__toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
        WATCHLIST ({list.length}) <span className={'arch__chev' + (open ? ' arch__chev--open' : '')}>▾</span>
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
            <div className="ep-row__meta">Saved to watch later</div>
          </div>
          <div className="ep-row__actions">
            <button className="btn btn--tiny btn--primary" onClick={() => { Store.setShowWatchlist(sh.id, false); openShow(sh.id); toast('In your queue. Enjoy.'); }}>Start</button>
            <button className="icon-btn" onClick={() => { Store.removeShow(sh.id); toast('Removed.'); }} aria-label="Remove show">✕</button>
          </div>
        </article>
      ))}
    </div>
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
  const { openShow, go } = useApp();
  const [, setTick] = useState(0);
  const lists = Store.watchNextList();
  const hist = Store.history(20);
  const showCount = Object.keys(Store.get().shows).length;

  if (showCount === 0 && hist.length === 0) return <FirstRun />;

  const tonight = lists.next.length > 0 ? lists.next[0] : null;
  const queue = lists.next.slice(1);
  const nudge = !nudgeDismissed ? Store.nudgePick(tonight ? tonight.show.id : null) : null;

  return (
    <>
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

      {hist.length > 0 && (
        <>
          <SectionLabel>WATCHED HISTORY</SectionLabel>
          {hist.map((h, i) => (
            <EpRow
              key={h.show.id + '-' + h.s + '-' + h.e + '-' + i}
              show={h.show} s={h.s} e={h.e} checked
              onToggle={() => Store.markEpisode(h.show.id, h.s, h.e, false)}
            />
          ))}
        </>
      )}

      <WatchlistSection />
      <ArchivedSection />
    </>
  );
}
