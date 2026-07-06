/* Phase 2 voice input: the mic exists only where the browser has
   SpeechRecognition, and hands the transcript to onText. */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import MicButton, { speechSupported } from '../src/components/MicButton.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let created = [];
class FakeRecognition {
  constructor() {
    this.started = false;
    created.push(this);
  }
  start() { this.started = true; }
  stop() { if (this.onend) this.onend(); }
  abort() {}
}

function mount(node) {
  const el = document.createElement('div');
  document.body.appendChild(el);
  const root = createRoot(el);
  act(() => { root.render(node); });
  return el;
}

beforeEach(() => {
  created = [];
  document.body.innerHTML = '';
  delete window.SpeechRecognition;
  delete window.webkitSpeechRecognition;
});

afterEach(() => {
  delete window.SpeechRecognition;
  delete window.webkitSpeechRecognition;
});

describe('MicButton', () => {
  it('renders nothing where the browser has no SpeechRecognition', () => {
    expect(speechSupported()).toBe(false);
    const el = mount(<MicButton onText={() => {}} />);
    expect(el.querySelector('.mic')).toBeNull();
  });

  it('starts listening on tap and delivers the transcript to onText', () => {
    window.SpeechRecognition = FakeRecognition;
    const got = vi.fn();
    const el = mount(<MicButton onText={got} />);
    const btn = el.querySelector('.mic');
    expect(btn).toBeTruthy();

    act(() => { btn.click(); });
    expect(created.length).toBe(1);
    const rec = created[0];
    expect(rec.started).toBe(true);
    expect(rec.lang).toBe('en-GB');
    expect(btn.className).toContain('mic--on');

    act(() => {
      rec.onresult({ results: [[{ transcript: 'slow horses' }]] });
      rec.onend();
    });
    expect(got).toHaveBeenCalledWith('slow horses');
    expect(btn.className).not.toContain('mic--on');
  });

  it('a second tap while listening stops instead of starting again', () => {
    window.SpeechRecognition = FakeRecognition;
    const el = mount(<MicButton onText={() => {}} />);
    const btn = el.querySelector('.mic');
    act(() => { btn.click(); });
    act(() => { btn.click(); });
    expect(created.length).toBe(1);
    expect(btn.className).not.toContain('mic--on');
  });
});
