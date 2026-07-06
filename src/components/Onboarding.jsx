/* First-run screen: TMDB key entry. Mirrors renderOnboarding + save-key. */
import React, { useState } from 'react';
import * as Store from '../lib/store.js';
import * as TMDB from '../lib/tmdb.js';
import { useApp } from '../context.js';

export default function Onboarding() {
  const { go, toast } = useApp();
  const [key, setKey] = useState('');
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
      go('shows');
      toast('Key saved. You are in.');
    }, () => {
      setBusy(false);
      toast('Could not reach TMDB to check the key.');
    });
  }

  return (
    <div className="onboard">
      <div className="brand brand--big">Telly<span>Log</span></div>
      <p className="onboard__lede">Your own TV tracker. Runs in your browser, keeps your data local and imports your TV Time history.</p>
      <ol className="onboard__steps">
        <li>Create a free account at <a href="https://www.themoviedb.org/signup" target="_blank" rel="noopener noreferrer">themoviedb.org</a></li>
        <li>Go to Settings → API and request a key (choose "Developer")</li>
        <li>Paste the "API Key" (v3 auth) below</li>
      </ol>
      <div className="onboard__form">
        <input className="input" type="text" placeholder="TMDB API key" autoComplete="off" spellCheck="false"
          value={key} onChange={(e) => setKey(e.target.value)} />
        <button className="btn btn--primary" onClick={save} disabled={busy}>Save and start</button>
      </div>
      <p className="fineprint">The key is stored only in this browser's local storage. It never appears in the code or leaves your device except in calls to TMDB.</p>
    </div>
  );
}
