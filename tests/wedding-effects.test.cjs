const { test } = require('node:test');
const assert = require('node:assert/strict');
const { initWeddingEffects } = require('../js/wedding-effects.js');
const api = require('../js/wedding-scroll.js');

class Element {
  constructor() {
    this.events = new Map(); this.attributes = {}; this.children = []; this.classes = new Set();
    this.style = { setProperty(key, value) { this[key] = value; } };
    this.classList = {
      add: (...names) => names.forEach(name => this.classes.add(name)),
      remove: (...names) => names.forEach(name => this.classes.delete(name)),
      toggle: (name, active) => active ? this.classes.add(name) : this.classes.delete(name)
    };
    this.loops = [{ style:{} }, { style:{} }];
  }
  addEventListener(name, callback) { this.events.set(name, callback); }
  emit(name, event = {}) { this.events.get(name)?.(event); }
  setAttribute(name, value) { this.attributes[name] = value; }
  querySelectorAll() { return this.loops; }
  appendChild(child) { this.children.push(child); child.parent = this; return child; }
  remove() { this.parent.children = this.parent.children.filter(child => child !== this); }
  setPointerCapture(pointer) { this.captured = pointer; }
  focus(options) { this.focused = options; }
  scrollIntoView(options) { this.scrolled = options; }
}

function fixture(reduced = false) {
  const elements = Object.fromEntries(['tie-cord', 'scroll-body', 'scroll-roll', 'enter-prompt-w', 'wedding-heading'].map(id => [id, new Element()]));
  const body = new Element(), root = new Element(), motion = new Element(), win = new Element();
  motion.matches = reduced;
  const timers = new Map(); let sequence = 0;
  Object.assign(win, {
    innerWidth:390, innerHeight:844,
    setTimeout(fn) { timers.set(++sequence, fn); return sequence; },
    clearTimeout(id) { timers.delete(id); }, matchMedia:() => motion
  });
  const document = {
    body, documentElement:root,
    getElementById:id => elements[id] || body.children.find(child => child.id === id),
    createElement:() => new Element()
  };
  // Inject deterministic randomness through the pure petal generator.
  initWeddingEffects(document, win, { ...api, petalSpecs:(w, h) => api.petalSpecs(w, h, () => .5) });
  const tick = () => { const jobs = [...timers.values()]; timers.clear(); jobs.forEach(fn => fn()); };
  return { elements, body, root, motion, win, timers, tick, cord:elements['tie-cord'], panel:elements['scroll-body'] };
}
const point = (y, pointerId = 1) => ({ clientY:y, pointerId, button:0 });

test('adapter creates braided artwork, enhances closed panel and supports native tap', () => {
  const f = fixture();
  assert.match(f.cord.innerHTML, /braid-bronze/); assert.equal(f.panel.inert, true);
  assert.match(f.cord.innerHTML, /var\(--cord-highlight\)/);
  assert.ok(!f.cord.innerHTML.includes('#ffeeb7'), 'Old yellow-gold thread palette is removed');
  for (const letter of ['H', 'S']) {
    assert.match(f.cord.innerHTML, new RegExp(`id="charm-face-${letter}"`));
    assert.match(f.cord.innerHTML, new RegExp(`clip-path="url\\(#charm-face-${letter}\\)"`));
  }
  assert.equal((f.cord.innerHTML.match(/class="charm-shine"/g) || []).length, 2);
  assert.equal((f.cord.innerHTML.match(/class="charm-initial"/g) || []).length, 2);
  assert.ok(f.root.classes.has('scroll-enhanced')); assert.ok(!f.root.classes.has('scroll-initializing'));
  f.cord.emit('pointerdown', point(100)); assert.equal(f.cord.captured, 1);
  f.cord.emit('pointerup', point(100)); f.cord.emit('click', { detail:1 });
  assert.ok(f.cord.classes.has('releasing')); assert.equal(f.cord.disabled, true);
  f.tick(); assert.equal(f.panel.inert, false); f.tick();
  assert.deepEqual(f.elements['wedding-heading'].focused, { preventScroll:true });
  assert.deepEqual(f.panel.scrolled, { block:'start', behavior:'instant' });
  assert.equal(f.body.children.length, 1); assert.equal(f.body.children[0].children.length, 24);
  f.tick(); assert.equal(f.body.children.length, 0);
});

test('cylinder turns only during the unfurl and shares the controller duration', () => {
  const f = fixture(), roll = f.elements['scroll-roll'];
  assert.equal(f.root.style['--unfurl-duration'], '2800ms');
  assert.ok(!roll.classes.has('unfurling'));
  f.cord.emit('click', { detail:0 });
  assert.ok(!roll.classes.has('unfurling'));
  f.tick(); assert.ok(roll.classes.has('unfurling'));
  f.tick(); assert.ok(!roll.classes.has('unfurling'));
  const g = fixture(); g.cord.emit('click', { detail:0 }); g.tick();
  g.motion.matches = true; g.motion.emit('change');
  assert.ok(!g.elements['scroll-roll'].classes.has('unfurling'));
});

test('adapter ignores unrelated pointers and suppresses click after short or cancelled drags', () => {
  const f = fixture();
  f.cord.emit('pointerdown', { ...point(0), button:2 });
  assert.equal(f.cord.captured, undefined);
  f.cord.emit('pointerdown', point(0)); f.cord.emit('pointerdown', point(0, 2));
  f.cord.emit('pointermove', point(100, 2)); f.cord.emit('pointerup', point(100, 2));
  assert.equal(f.cord.style['--pull'], undefined);
  f.cord.emit('pointermove', point(20)); f.cord.emit('pointerup', point(20));
  f.cord.emit('click', { detail:1 }); assert.equal(f.cord.disabled, false);
  f.cord.emit('pointerdown', point(0)); f.cord.emit('pointermove', point(70));
  assert.ok(parseFloat(f.cord.style['--pull']) > 25);
  f.cord.emit('pointercancel'); f.cord.emit('lostpointercapture');
  f.cord.emit('click', { detail:1 }); assert.equal(f.cord.disabled, false);
  assert.equal(f.cord.style['--pull'], '0px');
  f.cord.emit('click', { detail:0 }); assert.equal(f.cord.disabled, true);
});

test('long drag releases once and lifecycle suspension finishes without particles', () => {
  const f = fixture();
  f.cord.emit('pointerdown', point(0)); f.cord.emit('pointermove', point(80)); f.cord.emit('pointerup', point(80));
  assert.ok(f.cord.loops.every(loop => loop.style.transform === ''));
  f.cord.emit('pointerdown', point(0)); f.cord.emit('click', { detail:1 });
  f.win.emit('pagehide'); assert.equal(f.panel.inert, false);
  assert.equal(f.body.children.length, 0); assert.equal(f.timers.size, 0);
});

test('reduced motion and live changes stop gestures and remove an active cascade', () => {
  const reduced = fixture(true); reduced.cord.emit('click', { detail:0 });
  assert.equal(reduced.panel.inert, false); assert.equal(reduced.timers.size, 0);
  const f = fixture(); f.motion.emit('change'); assert.equal(f.panel.inert, true);
  f.cord.emit('click', { detail:0 }); f.tick(); f.tick();
  assert.equal(f.body.children.length, 1);
  f.motion.matches = true; f.motion.emit('change');
  assert.equal(f.body.children.length, 0); assert.equal(f.timers.size, 0);
  const g = fixture(); g.cord.emit('pointerdown', point(0)); g.cord.emit('pointermove', point(20));
  g.motion.matches = true; g.motion.emit('change');
  assert.equal(g.cord.style['--pull'], '0px');
});