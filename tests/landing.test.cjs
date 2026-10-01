const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseUTC, countdownParts, createCountdown, createMotion, createBackgroundVideo, initLanding } = require('../js/landing.js');

function node() {
  const events = new Map();
  const attrs = new Map();
  return {
    hidden: true, disabled: false, textContent: '',
    addEventListener: (type, fn) => events.set(type, fn),
    removeEventListener: type => events.delete(type),
    dispatch: type => events.get(type)?.(),
    setAttribute: (key, value) => attrs.set(key, value),
    getAttribute: key => attrs.get(key),
    events,
  };
}

function fixture({ reduced = false, target = '20261120T003000Z' } = {}) {
  const nodes = Object.fromEntries(['countdown', 'countdown-values', 'countdown-caption', 'landing-status', 'cd-days', 'cd-hours', 'cd-mins', 'cd-secs', 'motion-toggle', 'share-landing', 'rsvp-landing', 'calendar-wedding', 'calendar-reception'].map(id => [id, node()]));
  const styles = new Map();
  const doc = { ...node(), hidden: false, getElementById: id => nodes[id], documentElement: { style: { setProperty: (key, value) => styles.set(key, value) } } };
  const media = { ...node(), matches: reduced };
  const timers = new Map();
  let id = 0;
  const win = { ...node(), matchMedia: () => media, setInterval: fn => { timers.set(++id, fn); return id; }, clearInterval: key => timers.delete(key) };
  const clock = { value: Date.UTC(2026, 10, 19, 0, 30) };
  return { nodes, styles, doc, win, media, timers, clock, target, now: () => clock.value, tick: () => [...timers.values()].forEach(fn => fn()) };
}

test('UTC parser accepts calendar timestamps and rejects malformed or rolled-over dates', () => {
  assert.equal(parseUTC('20261120T003000Z'), Date.UTC(2026, 10, 20, 0, 30));
  for (const value of [null, '', '2026-11-20', '20260230T003000Z', '20261320T003000Z', '20261120T253000Z']) {
    assert.ok(Number.isNaN(parseUTC(value)));
  }
});

test('countdown uses absolute elapsed time and clamps past events', () => {
  assert.deepEqual(countdownParts(90061000, 0), { days: '1', hours: '01', minutes: '01', seconds: '01' });
  assert.deepEqual(countdownParts(0, 1), { days: '0', hours: '00', minutes: '00', seconds: '00' });
});

test('countdown exposes real values, refreshes, and announces completion only once', () => {
  const f = fixture();
  const cleanup = createCountdown(f);
  assert.equal(f.nodes.countdown.hidden, false);
  assert.equal(f.nodes['cd-days'].textContent, '1');
  f.clock.value += 1000;
  f.tick();
  assert.equal(f.nodes['cd-hours'].textContent, '23');
  assert.equal(f.nodes['cd-secs'].textContent, '59');
  f.clock.value = parseUTC(f.target);
  f.tick();
  assert.equal(f.nodes['countdown-values'].hidden, true);
  assert.equal(f.nodes['countdown-caption'].textContent, 'With love, always');
  assert.match(f.nodes['landing-status'].textContent, /wedding day has arrived/i);
  assert.equal(f.timers.size, 0);
  f.nodes['landing-status'].textContent = 'unchanged';
  f.doc.dispatch('visibilitychange');
  assert.equal(f.nodes['landing-status'].textContent, 'unchanged');
  cleanup();
  assert.equal(f.doc.events.size, 0);
});

test('countdown handles invalid and already-past targets without scheduling timers', () => {
  for (const target of ['invalid', '20250101T000000Z']) {
    const f = fixture({ target });
    const cleanup = createCountdown(f);
    assert.equal(f.timers.size, 0);
    assert.equal(f.nodes.countdown.hidden, target === 'invalid');
    cleanup();
  }
});

test('countdown suspends in hidden pages and catches up on restoration', () => {
  const f = fixture();
  const cleanup = createCountdown(f);
  f.doc.hidden = true;
  f.doc.dispatch('visibilitychange');
  assert.equal(f.timers.size, 0);
  f.clock.value += 3600000;
  f.doc.hidden = false;
  f.doc.dispatch('visibilitychange');
  assert.equal(f.nodes['cd-hours'].textContent, '23');
  assert.equal(f.timers.size, 1);
  f.win.dispatch('pagehide');
  assert.equal(f.timers.size, 0);
  f.win.dispatch('pageshow');
  assert.equal(f.timers.size, 1);
  cleanup();
  assert.equal(f.timers.size, 0);
  assert.equal(f.win.events.size, 0);
});

test('motion pauses every CSS effect and retains user preference across visibility changes', () => {
  const f = fixture();
  const cleanup = createMotion(f);
  const button = f.nodes['motion-toggle'];
  assert.equal(button.hidden, false);
  assert.equal(f.styles.get('--motion-state'), 'running');
  button.dispatch('click');
  assert.equal(f.styles.get('--motion-state'), 'paused');
  assert.equal(button.getAttribute('aria-pressed'), 'true');
  assert.equal(button.textContent, 'Resume motion');
  f.doc.hidden = true;
  f.doc.dispatch('visibilitychange');
  f.doc.hidden = false;
  f.doc.dispatch('visibilitychange');
  assert.equal(f.styles.get('--motion-state'), 'paused');
  button.dispatch('click');
  assert.equal(f.styles.get('--motion-state'), 'running');
  f.win.dispatch('pagehide');
  f.media.dispatch('change');
  assert.equal(f.styles.get('--motion-state'), 'paused');
  f.win.dispatch('pageshow');
  assert.equal(f.styles.get('--motion-state'), 'running');
  f.doc.hidden = true;
  f.doc.dispatch('visibilitychange');
  assert.equal(f.styles.get('--motion-state'), 'paused');
  cleanup();
  assert.equal(button.events.size + f.media.events.size + f.doc.events.size + f.win.events.size, 0);
});

test('motion respects initial and live reduced-motion preferences', () => {
  const f = fixture({ reduced: true });
  const cleanup = createMotion(f);
  const button = f.nodes['motion-toggle'];
  assert.equal(button.disabled, true);
  assert.equal(button.textContent, 'Reduced motion enabled');
  button.dispatch('click');
  assert.equal(f.styles.get('--motion-state'), 'paused');
  f.media.matches = false;
  f.media.dispatch('change');
  assert.equal(button.disabled, false);
  assert.equal(f.styles.get('--motion-state'), 'running');
  f.media.matches = true;
  f.media.dispatch('change');
  assert.equal(f.styles.get('--motion-state'), 'paused');
  cleanup();
});

test('initialization hydrates configured content, wires sharing, and cleans up', () => {
  const f = fixture();
  const calls = [];
  const cleanup = initLanding({ ...f, config: { site: { title: 'Test wedding' }, wedding: { icsStartUTC: f.target } }, hydrate: doc => calls.push(doc), share: () => calls.push('share'), rsvp: () => 'https://wa.me/test', weddingCalendar: () => calls.push('wedding'), receptionCalendar: () => calls.push('reception') });
  assert.equal(f.doc.title, 'Test wedding');
  assert.equal(calls[0], f.doc);
  assert.equal(f.nodes['share-landing'].hidden, false);
  f.nodes['share-landing'].dispatch('click');
  assert.equal(calls[1], 'share');
  assert.equal(f.nodes['rsvp-landing'].href, 'https://wa.me/test');
  for (const event of ['wedding', 'reception']) {
    assert.equal(f.nodes[`calendar-${event}`].hidden, false);
    f.nodes[`calendar-${event}`].dispatch('click');
  }
  assert.deepEqual(calls.slice(1), ['share', 'wedding', 'reception']);
  cleanup();
  assert.equal(f.nodes['share-landing'].events.size, 0);
  assert.equal(f.nodes['calendar-wedding'].events.size, 0);
  assert.equal(f.nodes['calendar-reception'].events.size, 0);
  assert.equal(f.timers.size, 0);
});

function videoFixture() {
  const video = { ...node(), dataset: { src: 'assets/landing-garden.mp4' }, src: '', paused: true, plays: 0,
    play() { this.plays++; this.paused = false; return Promise.resolve(); },
    pause() { this.paused = true; },
  };
  return video;
}

test('video loads lazily, plays muted, freezes on pause and shows poster for reduced motion', async () => {
  const video = videoFixture();
  const controller = createBackgroundVideo(video);
  controller.update(true, true);
  assert.equal(video.src, '');
  assert.equal(video.plays, 0);
  controller.update(false);
  await Promise.resolve();
  assert.equal(video.src, video.dataset.src);
  assert.equal(video.muted, true);
  assert.equal(video.hidden, false);
  controller.update(true);
  assert.equal(video.paused, true);
  assert.equal(video.hidden, false);
  controller.update(true, true);
  assert.equal(video.hidden, true);
  controller.update(false);
  await Promise.resolve();
  assert.equal(video.hidden, false);
  controller.destroy();
  assert.equal(video.paused, true);
  assert.equal(video.hidden, true);
  assert.equal(video.events.size, 0);
});

test('blocked autoplay and media errors keep the still fallback visible', async () => {
  const video = videoFixture();
  video.play = () => Promise.reject(new Error('Autoplay blocked'));
  const controller = createBackgroundVideo(video);
  controller.update(false);
  await Promise.resolve();
  assert.equal(video.hidden, true);
  video.play = () => Promise.resolve();
  controller.update(false);
  await Promise.resolve();
  assert.equal(video.hidden, false);
  video.dispatch('error');
  assert.equal(video.hidden, true);
  assert.equal(video.paused, true);
  controller.update(false);
  assert.equal(video.hidden, true);
  controller.destroy();
});

test('pending playback cannot override reduced motion or cleanup', async () => {
  for (const dispose of [false, true]) {
    const video = videoFixture();
    let resolve;
    video.play = () => new Promise(done => { resolve = done; });
    const controller = createBackgroundVideo(video);
    controller.update(false);
    if (dispose) controller.destroy();
    else controller.update(true, true);
    resolve();
    await Promise.resolve();
    assert.equal(video.hidden, true);
    assert.equal(video.paused, true);
    controller.destroy();
  }
  const absent = createBackgroundVideo(null);
  absent.update(false);
  absent.destroy();
});

test('unified motion notifies video about visibility, preferences and cleanup', () => {
  const f = fixture();
  const states = [];
  const cleanup = createMotion({ ...f, onChange: (...state) => states.push(state) });
  assert.deepEqual(states.at(-1), [false, false]);
  f.doc.hidden = true;
  f.doc.dispatch('visibilitychange');
  assert.deepEqual(states.at(-1), [true, false]);
  f.media.matches = true;
  f.media.dispatch('change');
  assert.deepEqual(states.at(-1), [true, true]);
  cleanup();
  assert.deepEqual(states.at(-1), [true, true]);
});