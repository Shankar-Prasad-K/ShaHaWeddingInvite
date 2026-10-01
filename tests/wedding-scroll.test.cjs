const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createPullGesture, createReveal, petalSpecs } = require('../js/wedding-scroll.js');

test('pull follows downward movement, clamps tension, and releases only beyond threshold', () => {
  const values = []; let releases = 0;
  const pull = createPullGesture(value => values.push(value), () => releases++);
  pull.move(200); pull.end();
  assert.deepEqual(values, []);
  pull.start(100); pull.move(80); assert.equal(values.at(-1), 0);
  pull.move(130); pull.end(); assert.equal(releases, 0); assert.equal(values.at(-1), 0);
  pull.start(100); pull.move(400); assert.equal(values.at(-1), 1);
  pull.end(); assert.equal(releases, 1);
});

test('cancelled gestures never open and tap is distinguished from an incomplete drag', () => {
  let releases = 0;
  const pull = createPullGesture(() => {}, () => releases++);
  pull.start(0); pull.move(60); pull.cancel(); pull.end();
  assert.equal(releases, 0);
  pull.start(0); assert.equal(pull.end(), false);
  pull.start(0); pull.move(20); assert.equal(pull.end(), true);
});

function fixture(reduced = false) {
  const timers = new Map(); const phases = [], delays = []; let id = 0, focused = 0, petals = 0;
  const reveal = createReveal({
    render: phase => phases.push(phase), focus: () => focused++, celebrate: () => petals++,
    still: () => reduced,
    schedule: (fn, delay) => { delays.push(delay); timers.set(++id, fn); return id; },
    cancel: key => timers.delete(key)
  });
  const tick = () => { const jobs = [...timers.values()]; timers.clear(); jobs.forEach(fn => fn()); };
  return { reveal, phases, timers, delays, tick, counts: () => ({ focused, petals }) };
}

test('cord releases before unrolling, focuses at completion and showers only once', () => {
  const f = fixture();
  f.reveal.open(); f.reveal.open(); assert.deepEqual(f.phases, ['closed', 'releasing']);
  f.tick(); assert.equal(f.phases.at(-1), 'opening');
  assert.deepEqual(f.delays, [650, 2800], 'A deliberate downward unfurl follows the knot release');
  assert.equal(f.counts().petals, 0);
  f.tick(); assert.equal(f.phases.at(-1), 'open');
  assert.deepEqual(f.counts(), { focused: 1, petals: 1 });
  f.reveal.open(); f.reveal.finish(); assert.equal(f.counts().petals, 1);
});

test('reduced motion opens immediately without petals or timers', () => {
  const f = fixture(true); f.reveal.open();
  assert.equal(f.phases.at(-1), 'open'); assert.equal(f.timers.size, 0);
  assert.deepEqual(f.counts(), { focused: 1, petals: 0 });
});

test('live reduced motion completes opening and destroy cancels pending work', () => {
  const f = fixture(); f.reveal.finish(); assert.equal(f.phases.at(-1), 'closed');
  f.reveal.open(); f.reveal.finish(); assert.equal(f.timers.size, 0);
  assert.deepEqual(f.counts(), { focused: 1, petals: 0 });
  const g = fixture(); g.reveal.open(); g.reveal.destroy(); g.tick(); g.reveal.open();
  assert.deepEqual(g.counts(), { focused: 0, petals: 0 });
});

test('petals have bounded size, staggered depth and viewport-relative fall distances', () => {
  for (const random of [() => 0, () => 0.5, () => 0.999]) {
    const specs = petalSpecs(390, 844, random);
    assert.equal(specs.length, 24);
    for (const p of specs) {
      assert.ok(p.x >= 0 && p.x <= 390);
      assert.ok(p.size >= 8 && p.size <= 20);
      assert.ok(p.duration >= 3.2 && p.duration <= 4.2);
      assert.ok(p.delay + p.duration <= 5);
      assert.ok(p.fall > 844);
    }
    assert.notEqual(specs[0].delay, specs[1].delay);
  }
  assert.equal(petalSpecs(1440, 900, () => 0.5).length, 36);
});