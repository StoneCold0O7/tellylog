/* v2.7.1: the TV watchlist moved off the bottom of the Shows tab into
   this modal, opened from a button at the TOP of the tab, on the
   owner's ruling. The old placement buried the list under the queue,
   keep/drop and the full watch history; with a few hundred logged
   episodes it was effectively unreachable and invisible to a new
   user. Same opt-in-behind-one-button pattern as stats and data.
   The rows and their behaviour are unchanged: Start clears the flag
   and opens the tracker, watching any episode does it implicitly. */
import React from 'react';
import * as Store from '../lib/store.js';
import { useApp } from '../context.js';
import { Poster } from './shared.jsx';

export default function WatchlistModal() {
  const { openShow, closeModal, toast } = useApp();
  const list = Store.watchlistShows();

  return (
    <>
      <button className="modal__close" onClick={closeModal} aria-label="Close">✕</button>
      <h2 className="import__title">Your watchlist</h2>
      <p className="import__sub">Saved to watch later. Nothing here touches your queue until you start it.</p>
      <div className="watchlist-body">
        {list.length === 0 ? (
          <p className="fineprint">Nothing saved yet. On any show preview, tap Save for later and it lands here without touching your queue.</p>
        ) : list.map((sh) => (
          <article className="ep-row" key={sh.id}>
            <button className="ep-row__poster" onClick={() => { closeModal(); openShow(sh.id); }}>
              <Poster path={sh.poster} alt={sh.name} />
            </button>
            <div className="ep-row__body">
              <button className="ep-row__title title-link" onClick={() => { closeModal(); openShow(sh.id); }}>
                {sh.name}<span className="title-link__chev" aria-hidden="true">›</span>
              </button>
              <div className="ep-row__meta">Saved to watch later</div>
            </div>
            <div className="ep-row__actions">
              <button className="btn btn--tiny btn--primary" onClick={() => { Store.setShowWatchlist(sh.id, false); closeModal(); openShow(sh.id); toast('In your queue. Enjoy.'); }}>Start</button>
              <button className="icon-btn" onClick={() => { Store.removeShow(sh.id); toast('Removed.'); }} aria-label="Remove show">✕</button>
            </div>
          </article>
        ))}
        {list.length > 0 ? <p className="fineprint">Watching the first episode of a saved show moves it into your queue automatically.</p> : null}
      </div>
    </>
  );
}
