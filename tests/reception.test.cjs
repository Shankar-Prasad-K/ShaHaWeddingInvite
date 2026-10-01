const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createReveal, createFireflies, initReception } = require('../js/reception.js');

function element() {
  const events = new Map();
  const attrs = new Map();
  const classes = new Set();
  return {
    hidden: false, disabled: false, textContent: '', focusCount: 0,
    classList: { add: value => classes.add(value), remove: value => classes.delete(value), contains: value => classes.has(value) },
    setAttribute: (key, value) => attrs.set(key, String(value)),
    getAttribute: key => attrs.get(key),
    addEventListener: (type, listener) => events.set(type, listener),
    removeEventListener: type => events.delete(type),
    dispatch(type) { events.get(type)?.(); },
    focus() { this.focusCount++; },
  };
}

function revealFixture(reducedMotion = false) {
  const nodes = Object.fromEntries(['trigger', 'invitation', 'stage', 'heading', 'replay', 'status'].map(key => [key, element()]));
  const pending = new Map();
  let nextId = 0;
  const controller = createReveal({
    ...nodes, reducedMotion: () => reducedMotion,
    schedule: fn => { pending.set(++nextId, fn); return nextId; },
    cancel: id => pending.delete(id),
  });
  return { ...nodes, controller, pending, flush() { for (const fn of pending.values()) fn(); pending.clear(); } };
}

test('enhancement begins with a closed letter and an accessible open button', () => {
  const f = revealFixture();
  assert.equal(f.invitation.hidden, true);
  assert.equal(f.trigger.hidden, false);
  assert.equal(f.trigger.getAttribute('aria-expanded'), 'false');
  assert.equal(f.stage.classList.contains('is-enhanced'), true);
});

test('opening reveals the content once, then moves focus to the invitation', () => {
  const f = revealFixture();
  f.trigger.dispatch('click');
  f.controller.open();
  assert.equal(f.pending.size, 1);
  assert.equal(f.invitation.hidden, false);
  assert.equal(f.trigger.disabled, true);
  assert.equal(f.trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(f.stage.classList.contains('is-open'), true);
  assert.equal(f.heading.focusCount, 0);
  f.flush();
  assert.equal(f.trigger.hidden, true);
  assert.equal(f.heading.focusCount, 1);
  assert.match(f.status.textContent, /open/i);
});

test('close restores focus and allows replay', () => {
  const f = revealFixture();
  f.controller.open();
  f.flush();
  f.replay.dispatch('click');
  assert.equal(f.invitation.hidden, true);
  assert.equal(f.trigger.hidden, false);
  assert.equal(f.trigger.disabled, false);
  assert.equal(f.trigger.focusCount, 1);
  assert.equal(f.trigger.getAttribute('aria-expanded'), 'false');
  assert.equal(f.stage.classList.contains('is-open'), false);
  f.controller.open();
  f.flush();
  assert.equal(f.heading.focusCount, 2);
});

test('closing during opening cancels delayed focus', () => {
  const f = revealFixture();
  f.controller.open();
  f.controller.close();
  f.flush();
  assert.equal(f.heading.focusCount, 0);
  assert.equal(f.invitation.hidden, true);
});

test('reduced motion reveals immediately without a timer', () => {
  const f = revealFixture(true);
  f.controller.open();
  assert.equal(f.pending.size, 0);
  assert.equal(f.heading.focusCount, 1);
  assert.equal(f.trigger.hidden, true);
});

function animationFixture({ reduced = false, noContext = false } = {}) {
  const frames = new Map();
  let nextId = 0;
  const context = {
    clears: 0, arcs: 0, paints: [], gradients: [],
    setTransform() {}, clearRect() { this.clears++; }, beginPath() {}, arc() { this.arcs++; },
    fill() { this.paints.push(this.fillStyle); },
    createRadialGradient(...bounds) {
      const gradient = { bounds, stops: [], addColorStop(offset, color) { this.stops.push([offset, color]); } };
      this.gradients.push(gradient);
      return gradient;
    },
  };
  const canvas = { ...element(), style: {}, getContext: () => noContext ? null : context };
  const button = element();
  const media = { ...element(), matches: reduced };
  const doc = { ...element(), hidden: false };
  const win = {
    ...element(), innerWidth: 1024, innerHeight: 768, devicePixelRatio: 3,
    requestAnimationFrame: fn => { frames.set(++nextId, fn); return nextId; },
    cancelAnimationFrame: id => frames.delete(id),
  };
  const motionStates = [];
  const cleanup = createFireflies({ canvas, button, doc, win, media, random: () => 0.5, onMotionChange: paused => motionStates.push(paused) });
  return { frames, context, canvas, button, media, doc, win, cleanup, motionStates,
    frame(time = 1000) { const [id, fn] = frames.entries().next().value; frames.delete(id); fn(time); },
  };
}

test('fireflies size the canvas with capped pixel density and draw frames', () => {
  const f = animationFixture();
  assert.equal(f.canvas.width, 1536);
  assert.equal(f.canvas.height, 1152);
  assert.equal(f.button.hidden, false);
  assert.equal(f.frames.size, 1);
  f.frame();
  assert.ok(f.context.arcs > 0);
  assert.equal(f.frames.size, 1);
  f.win.innerWidth = 390;
  f.win.devicePixelRatio = undefined;
  f.win.dispatch('resize');
  assert.equal(f.canvas.width, 390);
  f.cleanup();
  assert.equal(f.frames.size, 0);
});

test('fireflies have visible warm cores and softly fading halos without harsh white light', () => {
  const f = animationFixture();
  f.frame();
  const corePaints = f.context.paints.filter(paint => typeof paint === 'string');
  assert.ok(corePaints.length > 0);
  for (const paint of corePaints) {
    assert.match(paint, /^rgba\(230, 182, 100, /);
    const alpha = Number(paint.match(/, ([\d.]+)\)$/)[1]);
    assert.ok(alpha >= 0.36 && alpha <= 0.8);
  }
  assert.ok(f.context.gradients.length > 0);
  for (const gradient of f.context.gradients) {
    assert.ok(gradient.bounds[5] >= 4 && gradient.bounds[5] <= 11);
    assert.deepEqual(gradient.stops.at(-1), [1, 'rgba(218, 165, 85, 0)']);
  }
  f.cleanup();
});

test('motion toggle pauses and resumes; hidden tabs stop rendering', () => {
  const f = animationFixture();
  assert.equal(f.motionStates.at(-1), false);
  f.button.dispatch('click');
  assert.equal(f.motionStates.at(-1), true);
  assert.equal(f.button.textContent, 'Resume garden motion');
  assert.equal(f.frames.size, 0);
  assert.equal(f.button.getAttribute('aria-pressed'), 'true');
  f.button.dispatch('click');
  assert.equal(f.frames.size, 1);
  f.doc.hidden = true;
  f.doc.dispatch('visibilitychange');
  assert.equal(f.frames.size, 0);
  assert.equal(f.motionStates.at(-1), true);
  f.doc.hidden = false;
  f.doc.dispatch('visibilitychange');
  assert.equal(f.frames.size, 1);
  f.win.dispatch('pagehide');
  assert.equal(f.frames.size, 0);
  assert.equal(f.motionStates.at(-1), true);
  f.win.dispatch('pageshow');
  assert.equal(f.frames.size, 1);
  f.cleanup();
});

test('firefly positions remain continuous across every pause and resume path', () => {
  const f = animationFixture();
  const position = () => f.context.gradients.at(-1).bounds.slice(0, 2);
  f.frame(1000);
  f.frame(2000);
  const before = position();
  f.win.dispatch('resize');
  assert.deepEqual(position(), before);
  const pauses = [
    [() => f.button.dispatch('click'), () => f.button.dispatch('click')],
    [() => { f.doc.hidden = true; f.doc.dispatch('visibilitychange'); },
      () => { f.doc.hidden = false; f.doc.dispatch('visibilitychange'); }],
    [() => f.win.dispatch('pagehide'), () => f.win.dispatch('pageshow')],
    [() => { f.media.matches = true; f.media.dispatch('change'); },
      () => { f.media.matches = false; f.media.dispatch('change'); }],
  ];
  for (const [pause, resume] of pauses) {
    pause();
    assert.equal(f.frames.size, 0);
    assert.deepEqual(position(), before);
    resume();
    f.frame(50000);
    assert.deepEqual(position(), before);
  }
  f.frame(51000);
  assert.notDeepEqual(position(), before);
  f.cleanup();
});

test('reduced motion is respected initially and when changed at runtime', () => {
  const f = animationFixture({ reduced: true });
  assert.equal(f.motionStates.at(-1), true);
  assert.equal(f.frames.size, 0);
  assert.equal(f.button.disabled, true);
  f.media.matches = false;
  f.media.dispatch('change');
  assert.equal(f.frames.size, 1);
  assert.equal(f.button.disabled, false);
  f.media.matches = true;
  f.media.dispatch('change');
  assert.equal(f.frames.size, 0);
  f.cleanup();
});

test('unavailable canvas still permits pausing the CSS flower animation', () => {
  const f = animationFixture({ noContext: true });
  assert.equal(f.frames.size, 0);
  assert.equal(f.button.hidden, false);
  assert.equal(f.motionStates.at(-1), false);
  f.button.dispatch('click');
  assert.equal(f.motionStates.at(-1), true);
  f.cleanup();
});

test('initialization hydrates content and shares motion control with the background video', async () => {
  const ids = ['open-invitation', 'invitation', 'letter-stage', 'invitation-heading', 'close-invitation', 'reception-status', 'rsvp-btn-r', 'calendar-reception', 'share-reception', 'fireflies', 'motion-toggle'];
  const nodes = Object.fromEntries(ids.map(id => [id, element()]));
  nodes.fireflies.getContext = () => null;
  const video = { ...element(), hidden: true, src: '', dataset: { src: 'assets/landing-garden.mp4' }, paused: true,
    play() { this.paused = false; return Promise.resolve(); },
    pause() { this.paused = true; },
  };
  nodes['reception-video'] = video;
  const styles = new Map();
  const doc = { ...element(), documentElement: { style: { setProperty: (key, value) => styles.set(key, value) } }, getElementById: id => nodes[id] };
  const media = { ...element(), matches: true };
  const win = { ...element(), matchMedia: () => media, setTimeout, clearTimeout };
  const calls = [];
  initReception({ doc, win,
    config: { couple: { groom: { name: 'Test Groom' }, bride: { name: 'Test Bride' } } },
    hydrate: root => calls.push(root), calendar: () => calls.push('calendar'),
    share: () => calls.push('share'), rsvp: () => 'https://wa.me/example',
  });
  assert.equal(calls[0], doc);
  assert.match(doc.title, /Test Groom.*Test Bride/);
  assert.equal(nodes['rsvp-btn-r'].href, 'https://wa.me/example');
  assert.equal(nodes['calendar-reception'].hidden, false);
  assert.equal(nodes['share-reception'].hidden, false);
  assert.equal(styles.get('--garden-play-state'), 'paused');
  nodes['open-invitation'].dispatch('click');
  assert.equal(nodes['invitation'].hidden, false);
  assert.equal(nodes['invitation-heading'].focusCount, 1);
  nodes['calendar-reception'].dispatch('click');
  nodes['share-reception'].dispatch('click');
  assert.deepEqual(calls.slice(1), ['calendar', 'share']);
  assert.equal(video.src, '', 'initial reduced motion does not load video');
  media.matches = false;
  media.dispatch('change');
  await Promise.resolve();
  assert.equal(video.src, video.dataset.src);
  assert.equal(video.muted, true);
  assert.equal(video.hidden, false);
  assert.equal(video.paused, false);
  nodes['motion-toggle'].dispatch('click');
  assert.equal(video.paused, true);
  assert.equal(video.hidden, false, 'manual pause retains the frame');
  nodes['motion-toggle'].dispatch('click');
  await Promise.resolve();
  win.dispatch('pagehide');
  media.dispatch('change');
  assert.equal(video.paused, true, 'suspended page cannot restart on preference changes');
  win.dispatch('pageshow');
  await Promise.resolve();
  assert.equal(video.paused, false);
  doc.hidden = true;
  doc.dispatch('visibilitychange');
  assert.equal(video.paused, true);
  doc.hidden = false;
  doc.dispatch('visibilitychange');
  await Promise.resolve();
  media.matches = true;
  media.dispatch('change');
  assert.equal(video.paused, true);
  assert.equal(video.hidden, true, 'reduced motion restores poster');
});