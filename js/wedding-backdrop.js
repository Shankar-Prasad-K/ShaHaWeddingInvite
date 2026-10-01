'use strict';

/** Page-specific controls; shared video adapter handles loading and failures. */
function initWeddingBackdrop(doc, win, videoFactory) {
  const video = videoFactory(doc.getElementById('wedding-background-video'));
  const button = doc.getElementById('wedding-video-toggle');
  const motion = win.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = false, suspended = false;
  function update() {
    video.update(paused || motion.matches || doc.hidden || suspended, motion.matches);
    button.disabled = motion.matches;
    button.setAttribute('aria-pressed', String(paused || motion.matches));
    button.textContent = motion.matches ? 'Still background' : paused ? 'Resume background' : 'Pause background';
  }
  function toggle() { if (!motion.matches) { paused = !paused; update(); } }
  function hide() { suspended = true; update(); }
  function show() { suspended = false; update(); }
  const listeners = [
    [button, 'click', toggle], [motion, 'change', update],
    [doc, 'visibilitychange', update], [win, 'pagehide', hide], [win, 'pageshow', show]
  ];
  listeners.forEach(([target, name, handler]) => target.addEventListener(name, handler));
  button.hidden = false;
  update();
  return () => {
    listeners.forEach(([target, name, handler]) => target.removeEventListener(name, handler));
    video.destroy();
  };
}
if (typeof module !== 'undefined' && module.exports) module.exports = { initWeddingBackdrop };
else initWeddingBackdrop(document, window, createBackgroundVideo);