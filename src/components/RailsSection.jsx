/* v2.7.0: genre rails on Explore, replacing the v2.6.0 title-anchored
   rails on the owner's ruling (Netflix-style: one row per dominant
   genre, "Because you watch DRAMA"). Grounding is unchanged in kind
   and stronger in degree: anchors come from Store.genreRailAnchors()
   (rewatch-weighted watched minutes, local, deterministic) and the
   basis line under each rail is now built CLIENT-SIDE from the real
   titles that earned the genre, so neither the premise nor the
   evidence can be hallucinated. The LLM only fills picks. Still ONE
   serverless call (mode:'rails', shared limiter), strict JSON
   sanitised on both sides, results cached WITH their TMDB-resolved
   cards in tellylog:rails:v1, empty results never cached.

   v2.7.0 also adds the refresh gate (refreshGate.js): a changed
   library no longer regenerates on sight. The cached rails are served
   stale until 5+ days AND 6+ signal units have passed, so API spend
   tracks real taste change. First generation is immediate. */
import React, { useEffect, useState } from 'react';
import * as Store from '../lib/store.js';
import * as TMDB from '../lib/tmdb.js';
import * as AI from '../lib/ai.js';
import { refreshDecision, policyLine, validRailsCache, RAILS_CACHE_V } from '../lib/refreshGate.js';
import { SectionLabel, Notice, SkeletonCards } from './shared.jsx';
import ResultCard from './ResultCard.jsx';

const RAILS_KEY = 'tellylog:rails:v1';

/* djb2, same idea as the taste cache: detect "library changed" */
function hash(str) {
  var h = 5381;
  for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return String(h);
}

function basisLine(anchor) {
  if (!anchor.examples || !anchor.examples.length) return '';
  var t = anchor.examples;
  var names = t.length === 1 ? t[0] : t.slice(0, -1).join(', ') + ' and ' + t[t.length - 1];
  return 'Built on ' + names + ' from your library.';
}

/* v2.7.3: recommendations must never include titles already in the
   library, in any state (tracking, watchlisted, archived). The model
   is told this but cannot enforce it past the librarySummary cap;
   this deterministic filter can. Rails emptied by it are dropped,
   except during generation (keepEmpty), where the backfill below gets
   a chance to top them up from TMDB first. */
function stripOwned(rails, keepEmpty) {
  var out = (rails || []).map(function (r) {
    return Object.assign({}, r, {
      cards: (r.cards || []).filter(function (c) {
        return c && c.item && !Store.ownsTitle(c.item.media_type, c.item.id);
      })
    });
  });
  return keepEmpty ? out : out.filter(function (r) { return r.cards.length > 0; });
}

/* The rail displays up to this many cards. */
var DISPLAY_CAP = 5;

/* Deterministic TMDB backfill (Option A). A large library owns most of
   the model's obvious genre picks, so after the owned-filter a rail can
   render only one or two cards. When a rail is short, top it up to
   DISPLAY_CAP from TMDB's popular-in-genre list: popularity-ranked,
   owned and duplicate titles excluded, ZERO extra LLM cost. Backfilled
   cards carry fill:true and the rail carries filled:true so the caption
   can disclose it; silently mixing popularity picks into a taste-
   grounded rail would break the honesty rule the rails rest on. Any
   failure returns the rail unchanged. */
function backfillRail(rail, anchor) {
  if (!anchor || rail.cards.length >= DISPLAY_CAP) return Promise.resolve(rail);
  var isMovie = anchor.kind === 'movie';
  var gid = isMovie ? TMDB.movieGenreId(anchor.genre) : TMDB.tvGenreId(anchor.genre);
  if (!gid) return Promise.resolve(rail);
  var call = isMovie ? TMDB.discoverMovie(gid) : TMDB.discoverTV(gid);
  return call.then(function (out) {
    var mt = isMovie ? 'movie' : 'tv';
    var have = {};
    rail.cards.forEach(function (c) { have[c.item.media_type + '-' + c.item.id] = true; });
    var extra = (out.results || []).filter(function (it) {
      return it && it.id && !have[mt + '-' + it.id] && !Store.ownsTitle(mt, it.id);
    }).slice(0, DISPLAY_CAP - rail.cards.length).map(function (it) {
      it.media_type = mt;
      return { item: it, reason: '', fill: true };
    });
    if (extra.length) return Object.assign({}, rail, { cards: rail.cards.concat(extra), filled: true });
    return rail;
  }).catch(function () { return rail; });
}

export default function RailsSection({ onAdded }) {
  const [llm, setLlm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [rails, setRails] = useState(null); // null | [{genre, basis, cards:[{item, reason}]}]

  useEffect(() => {
    let alive = true;
    AI.checkHealth().then((h) => { if (alive && h && h.llm) setLlm(true); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!llm) return;
    const anchors = Store.genreRailAnchors();
    if (anchors.length === 0) return; // no genre has 2+ watched titles yet: no rails, no fake ones either
    const lib = Store.librarySummary();
    const h = hash(lib + '|' + anchors.map((a) => a.kind + ':' + a.genre).join('|'));
    const units = Store.signalUnits();

    let cached = null;
    try { cached = JSON.parse(localStorage.getItem(RAILS_KEY) || 'null'); } catch (e) { cached = null; }
    /* v2.7.1: shape check BEFORE the gate. A pre-2.7.0 cache is the
       wrong shape (no genre field); serving it stale rendered
       "BECAUSE YOU WATCH UNDEFINED" on the live site. Wrong shape is
       treated as no cache at all, so it regenerates immediately. */
    const usable = validRailsCache(cached) ? cached : null;
    const decision = refreshDecision(usable, h, units);
    if (decision !== 'generate' && usable) {
      /* v2.7.3: strip owned titles ON SERVE, not just on generate. A
         cache written before a big import (or before yesterday's add)
         legally serves stale under the gate; without this filter it
         recommends titles the user now owns until the gate reopens. */
      setRails(stripOwned(usable.rails));
      setNote(usable.note || '');
      return;
    }

    let alive = true;
    setBusy(true); setErr('');
    AI.rails(lib, anchors).then((res) => {
      /* Resolve each pick against TMDB so cards carry real ids and
         posters. Unresolvable picks are dropped, not faked. */
      return Promise.all(res.rails.map((r, i) => {
        return Promise.all(r.picks.map((p) => {
          const search = p.mediaType === 'movie' ? TMDB.searchMovie(p.title, p.year || undefined) : TMDB.searchTV(p.title);
          return search.then((out) => {
            const hit = (out.results || [])[0];
            if (!hit) return null;
            hit.media_type = p.mediaType;
            return { item: hit, reason: p.reason };
          }).catch(() => null);
        })).then((cards) => ({
          genre: r.anchor,
          basis: anchors[i] ? basisLine(anchors[i]) : '',
          cards: cards.filter(Boolean)
        }));
      })).then((resolved) => {
        /* Strip owned but keep emptied rails alive long enough for the
           backfill to rescue them, then drop whatever is still empty
           (e.g. a genre whose TMDB discover returned nothing usable). */
        const stripped = stripOwned(resolved, true);
        return Promise.all(stripped.map((r) => {
          const anchor = anchors.find((a) => a.genre === r.genre) || null;
          return backfillRail(r, anchor);
        })).then((filled) => ({
          resolved: filled.filter((r) => r.cards.length > 0),
          note: res.note
        }));
      });
    }).then((out) => {
      if (!alive) return;
      setRails(out.resolved);
      setNote(out.note);
      setBusy(false);
      /* Cache only a non-empty result so a one-off bad answer is
         retried instead of pinned until the gate next opens. */
      if (out.resolved.length) {
        try { localStorage.setItem(RAILS_KEY, JSON.stringify({ v: RAILS_CACHE_V, h: h, u: units, rails: out.resolved, note: out.note, ts: Date.now() })); } catch (e) { /* cache only */ }
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
          <SectionLabel>BECAUSE YOU WATCH…</SectionLabel>
          <SkeletonCards n={4} />
        </>
      ) : null}
      {(rails || []).map((r) => (
        <div className="rail" key={'genre-' + r.genre}>
          <SectionLabel>{'BECAUSE YOU WATCH ' + String(r.genre).toUpperCase()}</SectionLabel>
          {r.basis || r.filled ? (
            <div className="rail__basis">
              {r.basis}
              {r.filled ? (r.basis ? ' ' : '') + 'Rounded out with popular ' + r.genre + ' you have not logged yet.' : ''}
            </div>
          ) : null}
          <div className="grid">
            {r.cards.slice(0, DISPLAY_CAP).map((c) => <ResultCard key={c.item.media_type + '-' + c.item.id} item={c.item} onAdded={onAdded} />)}
          </div>
        </div>
      ))}
      {rails && rails.length > 0 ? (
        <div className="fineprint">Grounded in your own watch history via Claude. {policyLine()} Posters and metadata from TMDB. Tap any card to preview before adding.</div>
      ) : null}
    </div>
  );
}
