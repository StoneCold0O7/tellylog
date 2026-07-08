/* v2.7.0: the colophon, a dedicated page at #/colophon (owner ruling:
   dedicated page AND a README section; this is the in-app half). It
   names the method explicitly per the standing ruling: this product
   was directed by a person and built by Claude; the interesting
   artefact is the decision record, not the code. Static content, no
   data access, linked from the Profile fineprint. */
import React from 'react';
import { SectionLabel } from './shared.jsx';

export default function ColophonPage() {
  return (
    <div className="colophon">
      <h2 className="colophon__title">How TellyLog was made</h2>

      <SectionLabel>THE METHOD</SectionLabel>
      <p>TellyLog was designed and directed by Anmol and built with Claude (Anthropic). Every line of code was written by the model; every decision about what to build, what to refuse and what to reverse was made by a person. The working contract was audit-first: each session opened with Claude stress-testing the brief and the weakest idea in it, before anything was built. Several owner proposals were rejected on the record and several Claude recommendations were overruled on the record. Both directions of pushback are in the public session logs.</p>

      <SectionLabel>WHAT THAT PRODUCED</SectionLabel>
      <p>A tracker where the AI is deliberately small. Exact questions about your stats are answered locally with zero model calls, because arithmetic does not need a language model. Recommendations are anchored in genres and titles chosen deterministically from your real watch history, so the model can produce a weak pick but never a fake premise. AI outputs refresh on a documented cost gate, not on every tap. The full reasoning, including everything that was scoped out, lives in the repo.</p>

      <SectionLabel>THE RECORD</SectionLabel>
      <p>The decision log, the session logs and every reversal are public at <a className="credit-link" href="https://github.com/StoneCold0O7/tellylog" target="_blank" rel="noreferrer">github.com/StoneCold0O7/tellylog</a>. Start with the README: it is the portfolio piece, the app is the evidence.</p>

      <p className="fineprint">Metadata and posters from TMDB. Watch-provider data via JustWatch. Recommendations and taste summaries by Claude. Your data never leaves this browser.</p>
      <p><a className="credit-link" href="#/profile">← Back to profile</a></p>
    </div>
  );
}
