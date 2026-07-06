/* Tonight card: the single most-likely next episode, one big log button.
   The two-second action: open app, tap Mark watched, done. The card
   advances in place because marking bumps the store rev. */
import React from 'react';
import * as Store from '../lib/store.js';
import * as TMDB from '../lib/tmdb.js';
import * as U from '../lib/util.js';
import { useApp } from '../context.js';
import { useEpisodeName } from './shared.jsx';
import { IconCheck } from './Icons.jsx';

export default function TonightCard({ entry }) {
  const { openShow, toast } = useApp();
  const sh = entry.show;
  const s = entry.next.s;
  const e = entry.next.e;
  const epName = useEpisodeName(sh.id, s, e);
  const bgPath = sh.backdrop || sh.poster;
  const bg = bgPath ? TMDB.img(bgPath, 'w780') : '';

  function logIt() {
    Store.markEpisode(sh.id, s, e, true);
    toast('Logged ' + U.seLabel(s, e).replace(' | ', ' ') + ' of ' + sh.name);
  }

  return (
    <section
      className="tonight"
      style={bg ? { backgroundImage: "url('" + bg + "')" } : undefined}
    >
      <div className="tonight__body">
        <div className="tonight__eyebrow">TONIGHT</div>
        <button className="tonight__show" onClick={() => openShow(sh.id)}>{sh.name}</button>
        <div className="tonight__ep">
          <span className="tonight__se">{U.seLabel(s, e)}</span>
          {epName ? <span>{epName}</span> : null}
        </div>
        <div className="tonight__row">
          <button className="tonight__btn" onClick={logIt}>
            <IconCheck /> Mark watched
          </button>
          <span className="tonight__left">{entry.remaining} left</span>
        </div>
      </div>
    </section>
  );
}
