/* v2.6.0: the YOUR DATA actions moved off the Profile into this modal
   on the owner's ruling, matching the stats pattern (Profile stays
   scannable, depth is opt-in behind one button). Side benefit noted in
   the audit: "Delete everything" no longer sits permanently exposed on
   the Profile page. */
import React from 'react';
import * as Store from '../lib/store.js';
import { useApp } from '../context.js';

export default function DataModal() {
  const { openModal, closeModal, toast } = useApp();

  function exportBackup() {
    const blob = new Blob([Store.exportJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tellylog-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function clearAll() {
    if (confirm('Delete every show, film and stat stored in this browser? Download a backup first if in doubt.')) {
      Store.clearAll();
      toast('All data deleted.');
      closeModal();
    }
  }

  return (
    <>
      <button className="modal__close" onClick={closeModal} aria-label="Close">✕</button>
      <h2 className="import__title">Your data</h2>
      <p className="import__sub">Everything lives in this browser only. Backups are how it survives a device change.</p>
      <div className="data-actions data-actions--stack">
        <button className="btn btn--primary" onClick={() => openModal({ type: 'import' })}>Import watch history</button>
        <button className="btn btn--ghost" onClick={exportBackup}>Download backup (JSON)</button>
        <button className="btn btn--ghost" onClick={() => openModal({ type: 'import' })}>Restore backup</button>
        <button className="btn btn--ghost" onClick={() => openModal({ type: 'settings' })}>TMDB API key</button>
        <button className="btn btn--danger" onClick={clearAll}>Delete everything</button>
      </div>
      <p className="fineprint">Import accepts TV Time, Netflix, Letterboxd and IMDb exports plus TellyLog backups. Your watch history is stored in this browser only and is never uploaded. TellyLog counts anonymous visits with cookie-free analytics; nothing personal is collected. Metadata comes from TMDB.</p>
    </>
  );
}
