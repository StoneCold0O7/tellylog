/* v2.6.0: ask your stats by voice or text, on the Profile page.
   Deterministic by ruling: every answer is computed locally from the
   store (insightsQA.js), the LLM is never consulted, so this costs
   nothing per use and works offline. The mic is the same Web Speech
   plumbing search and the ask box already use; because answering is
   free here, a voice transcript answers immediately instead of only
   filling the field (the ask box holds back because ITS submits spend
   API money; this one does not). */
import React, { useState } from 'react';
import { answerInsight, HELP_LINE } from '../lib/insightsQA.js';
import { SectionLabel } from './shared.jsx';
import MicButton from './MicButton.jsx';

export default function StatsAsk() {
  const [q, setQ] = useState('');
  const [answer, setAnswer] = useState('');
  const [help, setHelp] = useState(false);

  function run(text) {
    const query = String(text == null ? q : text).trim();
    if (!query) return;
    if (text != null) setQ(text);
    const a = answerInsight(query);
    setAnswer(a || '');
    setHelp(!a);
  }

  return (
    <div className="statsask">
      <SectionLabel>ASK YOUR STATS</SectionLabel>
      <div className="askbox__row">
        <div className="micwrap">
          <input
            className="search search--mic" type="text" autoComplete="off"
            placeholder="Busiest month? Most watched show?"
            value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') run(); }}
          />
          <MicButton onText={(t) => run(t)} label="Ask by voice" />
        </div>
        <button className="btn btn--primary askbox__go" onClick={() => run()} disabled={!q.trim()}>Ask</button>
      </div>
      {answer ? <p className="statsask__answer">{answer}</p> : null}
      {help ? <p className="statsask__help">That one is not in my list yet. {HELP_LINE}</p> : null}
      <div className="fineprint">Answered instantly from the data in this browser. No AI call, no cost, works offline.</div>
    </div>
  );
}
