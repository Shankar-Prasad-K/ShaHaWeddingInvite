const { test } = require('node:test');
const assert = require('node:assert/strict');
const { initWeddingBackdrop } = require('../js/wedding-backdrop.js');

function fixture(reduced = false) {
  const target = () => ({
    events:new Map(), attributes:{},
    addEventListener(name, fn) { this.events.set(name, fn); },
    removeEventListener(name) { this.events.delete(name); },
    emit(name) { this.events.get(name)?.(); },
    setAttribute(name, value) { this.attributes[name] = value; }
  });
  const button = target(), video = {}, doc = target(), win = target(), motion = target();
  motion.matches = reduced; doc.hidden = false;
  doc.getElementById = id => id === 'wedding-video-toggle' ? button : video;
  win.matchMedia = () => motion;
  const calls = []; let destroyed = false;
  const cleanup = initWeddingBackdrop(doc, win, element => {
    assert.equal(element, video);
    return { update:(...args) => calls.push(args), destroy:() => { destroyed = true; } };
  });
  return { button, doc, win, motion, calls, cleanup, destroyed:() => destroyed };
}

test('backdrop starts playback, toggles pause and retains choice across visibility', () => {
  const f = fixture();
  assert.deepEqual(f.calls.at(-1), [false, false]);
  assert.equal(f.button.hidden, false);
  f.button.emit('click'); assert.deepEqual(f.calls.at(-1), [true, false]);
  assert.equal(f.button.textContent, 'Resume background');
  assert.equal(f.button.attributes['aria-pressed'], 'true');
  f.doc.hidden = true; f.doc.emit('visibilitychange');
  f.doc.hidden = false; f.doc.emit('visibilitychange');
  assert.deepEqual(f.calls.at(-1), [true, false]);
  f.button.emit('click'); assert.deepEqual(f.calls.at(-1), [false, false]);
});

test('reduced motion uses poster initially and on live changes', () => {
  const f = fixture(true);
  assert.deepEqual(f.calls.at(-1), [true, true]);
  assert.equal(f.button.disabled, true);
  f.button.emit('click');
  f.motion.matches = false; f.motion.emit('change');
  assert.deepEqual(f.calls.at(-1), [false, false]);
  assert.equal(f.button.disabled, false);
  f.motion.matches = true; f.motion.emit('change');
  assert.deepEqual(f.calls.at(-1), [true, true]);
});

test('page suspension pauses playback, restoration resumes, cleanup removes listeners', () => {
  const f = fixture();
  f.win.emit('pagehide'); assert.deepEqual(f.calls.at(-1), [true, false]);
  f.win.emit('pageshow'); assert.deepEqual(f.calls.at(-1), [false, false]);
  f.doc.hidden = true; f.doc.emit('visibilitychange'); assert.deepEqual(f.calls.at(-1), [true, false]);
  f.cleanup();
  assert.equal(f.destroyed(), true);
  for (const element of [f.doc, f.win, f.motion, f.button]) assert.equal(element.events.size, 0);
});