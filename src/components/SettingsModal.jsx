/* TMDB key editor, mirrors the open-settings modal. */
import React, { useState, useEffect } from 'react';
import * as Store from '../lib/store.js';
import * as TMDB from '../lib/tmdb.js';
import { useApp } from '../context.js';

export default function SettingsModal() {
  const { toast, closeModal, go } = useApp();
  const [key, setKey] = useState(Store.apiKey());
  const [busy, setBusy] = useState(false);
  const [proxied, setProxied] = useState(false);

  useEffect(() => {
    let alive = true;
    TMDB.ready().then((m) => { if (alive) setProxied(m === 'proxy'); });
    return () => { alive = false; };
  }, []);

  function save() {
    const k = key.trim();
    if (!k) { toast('Paste your TMDB API key first.'); return; }
    setBusy(true);
    TMDB.validateKey(k).then((ok) => {
      setBusy(false);
      if (!ok) { toast('TMDB rejected that key. Check for typos.'); return; }
      Store.setApiKey(k);
      TMDB.clearCache();
      closeModal();
      go('shows');
      toast('Key saved. You are in.');
    }, () => {
      setBusy(false);
      toast('Could not reach TMDB to check the key.');
    });
  }

  return (
    <>
      <button className="modal__close" onClick={closeModal} aria-label="Close">✕</button>
      <h2 className="import__title">TMDB API key</h2>
      {proxied && (
        <p className="fineprint">This site already has a built-in TMDB connection, so a personal key is optional. One saved here is only used if the built-in connection is ever unavailable.</p>
      )}
      <div className="onboard__form">
        <input className="input" type="text" spellCheck="false" value={key} onChange={(e) => setKey(e.target.value)} />
        <button className="btn btn--primary" onClick={save} disabled={busy}>Save</button>
      </div>
    </>
  );
}
