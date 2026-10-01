/* Pure interaction/timing primitives; browser wiring stays in the wedding page. */
(function (root) {
  'use strict';
  const UNFURL_DURATION = 2800;
  function createPullGesture(tension, release) {
    let origin = null, progress = 0, moved = false;
    return {
      start(y) { origin = y; progress = 0; moved = false; },
      move(y) {
        if (origin === null) return;
        moved = moved || Math.abs(y - origin) > 6;
        progress = Math.min(1, Math.max(0, (y - origin) / 72));
        tension(progress);
      },
      end() {
        if (origin === null) return false;
        origin = null;
        if (progress >= 0.72) release();
        else tension(0);
        return moved;
      },
      cancel() { origin = null; progress = 0; tension(0); }
    };
  }

  function createReveal({ render, focus, celebrate, still, schedule = setTimeout, cancel = clearTimeout }) {
    let phase = 'closed', timer = null, destroyed = false;
    const setPhase = value => { phase = value; render(value); };
    const clear = () => { if (timer !== null) cancel(timer); timer = null; };
    function complete(petals) {
      clear(); setPhase('open'); focus();
      if (petals && !still()) celebrate();
    }
    setPhase('closed');
    return {
      open() {
        if (destroyed || phase !== 'closed') return;
        if (still()) { complete(false); return; }
        setPhase('releasing');
        timer = schedule(() => {
          setPhase('opening');
          timer = schedule(() => complete(true), UNFURL_DURATION);
        }, 650);
      },
      finish() {
        if (!destroyed && (phase === 'releasing' || phase === 'opening')) complete(false);
      },
      destroy() { destroyed = true; clear(); }
    };
  }

  function petalSpecs(width, height, random = Math.random) {
    const count = width < 600 ? 24 : 36;
    return Array.from({ length: count }, (_, i) => ({
      x: width * ((i + random()) / count),
      size: 8 + random() * 12,
      fall: height + 60 + random() * 100,
      drift: (random() - 0.5) * Math.min(width * 0.35, 240),
      spin: (i % 2 ? -1 : 1) * (80 + random() * 150),
      duration: 3.2 + random(),
      delay: (i % 8) * 0.1,
      depth: i % 3
    }));
  }
  const api = { createPullGesture, createReveal, petalSpecs, UNFURL_DURATION };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.WeddingScroll = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);