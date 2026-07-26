/* v2.8.0 swipe-to-tick. This is the one feature that cannot be verified
   for the owner from here, because real thumb behaviour on a phone is the
   only true test, so the gesture's decision logic is pinned down here
   instead: axis locking, the commit threshold and direction meaning. */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { SwipeRow } from '../src/components/shared.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function mount(node) {
  const el = document.createElement('div');
  document.body.appendChild(el);
  const root = createRoot(el);
  act(() => { root.render(node); });
  return el;
}

/* jsdom has no real touch support, so build the minimal shape React reads
   off the native event: a touches list with clientX/clientY. */
function touch(el, type, x, y) {
  const ev = new Event(type, { bubbles: true, cancelable: true });
  const list = [{ clientX: x, clientY: y }];
  ev.touches = list;
  ev.targetTouches = list;
  ev.changedTouches = list;
  act(() => { el.dispatchEvent(ev); });
}

function surfaceOf(el) { return el.querySelector('.swipe__surface'); }

function drag(el, from, to, steps) {
  const s = surfaceOf(el);
  touch(s, 'touchstart', from.x, from.y);
  const n = steps || 3;
  for (let i = 1; i <= n; i++) {
    touch(s, 'touchmove', from.x + ((to.x - from.x) * i) / n, from.y + ((to.y - from.y) * i) / n);
  }
  touch(s, 'touchend', to.x, to.y);
}

describe('SwipeRow', () => {
  it('renders its row and does not interfere with the normal tap path', () => {
    const onToggle = vi.fn();
    const el = mount(<SwipeRow checked={false} onToggle={onToggle}><article className="ep-row">Row</article></SwipeRow>);
    expect(el.textContent).toContain('Row');
    expect(el.querySelector('.ep-row')).toBeTruthy();
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('an unwatched row commits on a rightward swipe past the threshold', () => {
    const onToggle = vi.fn();
    const el = mount(<SwipeRow checked={false} onToggle={onToggle}><article>Row</article></SwipeRow>);
    drag(el, { x: 40, y: 100 }, { x: 160, y: 104 });
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('ignores a short swipe that never reaches the commit threshold', () => {
    const onToggle = vi.fn();
    const el = mount(<SwipeRow checked={false} onToggle={onToggle}><article>Row</article></SwipeRow>);
    drag(el, { x: 40, y: 100 }, { x: 80, y: 102 });   // 40px, under the 72px commit
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('ignores a vertical drag, so scrolling never ticks an episode', () => {
    const onToggle = vi.fn();
    const el = mount(<SwipeRow checked={false} onToggle={onToggle}><article>Row</article></SwipeRow>);
    drag(el, { x: 40, y: 100 }, { x: 52, y: 260 });   // mostly vertical
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('ignores a wrong-direction swipe: an unwatched row is not toggled by swiping left', () => {
    const onToggle = vi.fn();
    const el = mount(<SwipeRow checked={false} onToggle={onToggle}><article>Row</article></SwipeRow>);
    drag(el, { x: 200, y: 100 }, { x: 40, y: 104 });
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('a watched row undoes on a leftward swipe, the mirror of completing', () => {
    const onToggle = vi.fn();
    const el = mount(<SwipeRow checked onToggle={onToggle}><article>Row</article></SwipeRow>);
    drag(el, { x: 200, y: 100 }, { x: 40, y: 104 });
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('labels the revealed action by what the swipe will do', () => {
    const done = mount(<SwipeRow checked={false} onToggle={() => {}}><article>A</article></SwipeRow>);
    expect(done.querySelector('.swipe__action').textContent).toContain('Watched');
    const undo = mount(<SwipeRow checked onToggle={() => {}}><article>B</article></SwipeRow>);
    expect(undo.querySelector('.swipe__action').textContent).toContain('Undo');
  });
});
