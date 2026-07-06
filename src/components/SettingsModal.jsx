/* TMDB key editor, mirrors the open-settings modal. */
import React, { useState } from 'react';
import * as Store from '../lib/store.js';
import * as TMDB from '../lib/tmdb.js';
import { useApp } from '../context.js';

export default function SettingsModal() {
  const { toast, closeModal, go } = useApp();
  const [key, setKey] = useState(Store.apiKey());
  const [busy, setBusy] = useState(false);

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
      <div className="onboard__form">
        <input className="input" type="text" spellCheck="false" value={key} onChange={(e) => setKey(e.target.value)} />
        <button className="btn btn--primary" onClick={save} disabled={busy}>Save</button>
      </div>
    </>
  );
}
