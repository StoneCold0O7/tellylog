/* Shows tab: Watch Next, stale bucket, watched history.
   Mirrors renderShows including lazy episode-name fetching. */
import React, { useEffect, useState } from 'react';
import * as Store from '../lib/store.js';
import * as TMDB from '../lib/tmdb.js';
import { useApp } from '../context.js';
import { EpRow, SectionLabel, EmptyState } from './shared.jsx';

/* Module-level episode-name cache, like the original epNameCache. */
const epNameCache = {};

function NextRow({ entry }) {
  const sh = entry.show;
  const s = entry.next.s;
  const e = entry.next.e;
  const key = sh.id + '-' + s + '-' + e;
  const [, force] = useState(0);

  useEffect(() => {
    if (epNameCache[key] != null) return;
    let alive = true;
    TMDB.tvSeason(sh.id, s).then((season) => {
      (season.episodes || []).forEach((ep) => {
        epNameCache[sh.id + '-' + s + '-' + ep.episode_number] = ep.name || '';
      });
      if (alive) force((n) => n + 1);
    }).catch(() => {});
    return () => { alive = false; };
  }, [key, sh.id, s]);

  return (
    <EpRow
      show={sh} s={s} e={e} remaining={entry.remaining}
      epName={epNameCache[key] != null ? epNameCache[key] : '…'}
      checked={false}
      onToggle={() => Store.markEpisode(sh.id, s, e, true)}
    />
  );
}

export default function ShowsTab() {
  const { go, openModal } = useApp();
  const lists = Store.watchNextList();
  const hist = Store.history(30);

  if (lists.next.length === 0 && lists.stale.length === 0 && hist.length === 0) {
    return (
      <EmptyState title="Nothing tracked yet" sub="Find a show in Explore or import your TV Time history from Profile.">
        <div className="empty__actions">
          <button className="btn btn--primary" onClick={() => go('explore')}>Browse shows</button>
          <button className="btn btn--ghost" onClick={() => openModal({ type: 'import' })}>Import TV Time data</button>
        </div>
      </EmptyState>
    );
  }

  return (
    <>
      {lists.next.length > 0 && (
        <>
          <SectionLabel>WATCH NEXT</SectionLabel>
          {lists.next.map((en) => <NextRow key={en.show.id} entry={en} />)}
        </>
      )}
      {lists.stale.length > 0 && (
        <>
          <SectionLabel>HAVEN'T WATCHED FOR A WHILE</SectionLabel>
          {lists.stale.map((en) => <NextRow key={en.show.id} entry={en} />)}
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
    </>
  );
}
