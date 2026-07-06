/* Upcoming tab: future episodes grouped by day, with the 6-hourly
   stale-details refresh from the original app.js. */
import React, { useEffect } from 'react';
import * as Store from '../lib/store.js';
import * as TMDB from '../lib/tmdb.js';
import * as U from '../lib/util.js';
import { useApp } from '../context.js';
import { Poster, CheckBtn, SectionLabel, EmptyState } from './shared.jsx';

const DETAILS_TTL = 6 * 60 * 60 * 1000;
let refreshing = false;

function refreshStaleDetails() {
  if (refreshing) return;
  const state = Store.get();
  const stale = Object.keys(state.shows).filter((id) => {
    const sh = state.shows[id];
    return !sh.archived && (Date.now() - (sh.detailsFetchedAt || 0) > DETAILS_TTL);
  });
  if (stale.length === 0) return;
  refreshing = true;
  Promise.all(stale.map((id) =>
    TMDB.tvDetails(id).then((d) => Store.refreshShowCache(Number(id), d)).catch(() => {})
  )).then(() => { refreshing = false; });
}

export default function UpcomingTab() {
  const { openShow } = useApp();
  useEffect(() => { refreshStaleDetails(); }, []);

  const items = Store.upcoming();
  if (items.length === 0) {
    return <EmptyState title="No upcoming episodes" sub="When a tracked show announces a new episode it lands here." />;
  }

  let lastLabel = null;
  return (
    <>
      {items.map((it, idx) => {
        const sh = it.show;
        const watched = Store.isWatched(sh, it.ep.s, it.ep.e);
        const label = it.group.label !== lastLabel ? it.group.label : null;
        lastLabel = it.group.label;

        let right;
        if (it.group.daysAway != null && it.group.daysAway > 6) {
          right = <div className="up-days"><strong>{it.group.daysAway}</strong><span>DAYS</span></div>;
        } else if (it.aired) {
          right = <CheckBtn checked={watched} onClick={() => Store.markEpisode(sh.id, it.ep.s, it.ep.e, !watched)} />;
        } else {
          right = <div className="up-net">{sh.network || ''}</div>;
        }

        return (
          <React.Fragment key={sh.id + '-' + it.ep.s + '-' + it.ep.e + '-' + idx}>
            {label && <SectionLabel>{label}</SectionLabel>}
            <article className="ep-row">
              <button className="ep-row__poster" onClick={() => openShow(sh.id)}><Poster path={sh.poster} alt={sh.name} /></button>
              <div className="ep-row__body">
                <button className="show-pill" onClick={() => openShow(sh.id)}>{sh.name.toUpperCase()} <span className="show-pill__chev">›</span></button>
                <div className="ep-row__se">{U.seLabel(it.ep.s, it.ep.e)}</div>
                <div className="ep-row__name">{it.ep.name || 'TBA'}</div>
                {it.aired && it.group.label === 'YESTERDAY' ? <span className="badge badge--new">NEW</span> : null}
              </div>
              {right}
            </article>
          </React.Fragment>
        );
      })}
    </>
  );
}
