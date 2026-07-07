/* v2.6.0: "Because you watched X" rails on Explore, below trending.
   Anchors are chosen LOCALLY from real watch data (Store.railAnchors),
   the LLM only fills picks under them, so a hallucinating model can
   produce a weak pick but never a fake premise. ONE serverless call
   returns every rail as JSON; the result, INCLUDING the TMDB-resolved
   cards, is cached in tellylog:rails:v1 OUTSIDE the tellylog:v1 schema
   (derived data does not belong in backups), keyed on a hash of the
   library summary plus the anchors, so both the LLM and TMDB are hit
   only when the library actually changes. Every pick opens the
   existing TitleModal preview; nothing enters the library without an
   explicit tap. Thin-library honesty is structural: the server returns
   a note plus a per-rail basis and this component renders them. */
import React, { useEffect, useState } from 'react';
import * as Store from '../lib/store.js';
import * as TMDB from '../lib/tmdb.js';
import * as AI from '../lib/ai.js';
import { SectionLabel, Notice, SkeletonCards } from './shared.jsx';
import ResultCard from './ResultCard.jsx';

const RAILS_KEY = 'tellylog:rails:v1';

/* djb2, same idea as the taste cache: detect "library changed" */
function hash(str) {
  var h = 5381;
  for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return String(h);
}

export default function RailsSection({ onAdded }) {
  const [llm, setLlm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [rails, setRails] = useState(null); // null | [{anchor, kind, basis, cards:[{item, reason}]}]

  useEffect(() => {
    let alive = true;
    AI.checkHealth().then((h) => { if (alive && h && h.llm) setLlm(true); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!llm) return;
    const anchors = Store.railAnchors();
    if (anchors.length === 0) return; // nothing watched yet: no rails, no fake ones either
    const lib = Store.librarySummary();
    const h = hash(lib + '|' + anchors.map((a) => a.kind + ':' + a.title).join('|'));
    try {
      const cached = JSON.parse(localStorage.getItem(RAILS_KEY) || 'null');
      if (cached && cached.h === h && Array.isArray(cached.rails) && cached.rails.length) {
        setRails(cached.rails);
        setNote(cached.note || '');
        return;
      }
    } catch (e) { /* fall through to fetch */ }

    let alive = true;
    setBusy(true); setErr('');
    AI.rails(lib, anchors).then((res) => {
      /* Resolve each pick against TMDB so cards carry real ids and
         posters. Unresolvable picks are dropped, not faked. */
      return Promise.all(res.rails.map((r) => {
        return Promise.all(r.picks.map((p) => {
          const search = p.mediaType === 'movie' ? TMDB.searchMovie(p.title, p.year || undefined) : TMDB.searchTV(p.title);
          return search.then((out) => {
            const hit = (out.results || [])[0];
            if (!hit) return null;
            hit.media_type = p.mediaType;
            return { item: hit, reason: p.reason };
          }).catch(() => null);
        })).then((cards) => ({
          anchor: r.anchor, kind: r.kind, basis: r.basis,
          cards: cards.filter(Boolean)
        }));
      })).then((resolved) => ({ resolved: resolved.filter((r) => r.cards.length), note: res.note }));
    }).then((out) => {
      if (!alive) return;
      setRails(out.resolved);
      setNote(out.note);
      setBusy(false);
      /* Cache only a non-empty result so a one-off bad answer is
         retried instead of pinned until the next library change. */
      if (out.resolved.length) {
        try { localStorage.setItem(RAILS_KEY, JSON.stringify({ h: h, rails: out.resolved, note: out.note, ts: Date.now() })); } catch (e) { /* cache only */ }
      }
    }).catch((e) => {
      if (!alive) return;
      setErr(e.message || 'Could not fetch recommendations.');
      setBusy(false);
    });
    return () => { alive = false; };
  }, [llm]);

  if (!llm) return null;
  if (!busy && !err && (!rails || rails.length === 0) && !note) return null;

  return (
    <div className="rails">
      {err ? <Notice>{err}</Notice> : null}
      {note ? <div className="rails__note">{note}</div> : null}
      {busy ? (
        <>
          <SectionLabel>BECAUSE YOU WATCHED…</SectionLabel>
          <SkeletonCards n={4} />
        </>
      ) : null}
      {(rails || []).map((r) => (
        <div className="rail" key={r.kind + '-' + r.anchor}>
          <SectionLabel>{'BECAUSE YOU WATCHED ' + r.anchor.toUpperCase()}</SectionLabel>
          {r.basis ? <div className="rail__basis">{r.basis}</div> : null}
          <div className="grid">
            {r.cards.map((c) => <ResultCard key={c.item.media_type + '-' + c.item.id} item={c.item} onAdded={onAdded} />)}
          </div>
        </div>
      ))}
      {rails && rails.length > 0 ? (
        <div className="fineprint">Grounded in your own watch history via Claude, refreshed only when your library changes. Posters and metadata from TMDB. Tap any card to preview before adding.</div>
      ) : null}
    </div>
  );
}
