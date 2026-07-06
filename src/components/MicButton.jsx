/* Voice input (Phase 2). Uses the browser's built-in Web Speech API,
   so there is no server, no cost and no new dependency. Feature-
   detected: the button simply does not exist in browsers without
   SpeechRecognition (Firefox, some webviews), so nothing else changes.
   One tap starts a single en-GB utterance; the transcript is handed to
   onText and the parent decides what to do with it (search runs it,
   the ask box only fills the field so a misheard question never spends
   an API call). Recognition audio is processed by the browser vendor's
   speech service; the transcript never touches TellyLog's own API. */
import React, { useEffect, useRef, useState } from 'react';
import { IconMic } from './Icons.jsx';

function getRecognition() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function speechSupported() {
  return !!getRecognition();
}

export default function MicButton({ onText, label }) {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  useEffect(() => () => {
    /* Unmount while listening: stop cleanly. */
    if (recRef.current) { try { recRef.current.abort(); } catch (e) { /* noop */ } }
  }, []);

  const Ctor = getRecognition();
  if (!Ctor) return null;

  function stop() {
    if (recRef.current) { try { recRef.current.stop(); } catch (e) { /* noop */ } }
    setListening(false);
  }

  function start() {
    if (listening) { stop(); return; }
    const rec = new Ctor();
    recRef.current = rec;
    rec.lang = 'en-GB';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (ev) => {
      const t = ev.results && ev.results[0] && ev.results[0][0]
        ? ev.results[0][0].transcript : '';
      if (t) onText(t);
    };
    rec.onend = () => { setListening(false); recRef.current = null; };
    rec.onerror = () => { setListening(false); recRef.current = null; };
    try {
      rec.start();
      setListening(true);
    } catch (e) {
      setListening(false);
    }
  }

  return (
    <button
      type="button"
      className={'mic' + (listening ? ' mic--on' : '')}
      onClick={start}
      aria-label={listening ? 'Stop listening' : (label || 'Search by voice')}
      aria-pressed={listening}
      title={listening ? 'Listening… tap to stop' : (label || 'Search by voice')}
    >
      <IconMic />
    </button>
  );
}
