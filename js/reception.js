'use strict';

const receptionVideoFactory = typeof module !== 'undefined' && module.exports
  ? require('./background-video.js').createBackgroundVideo : createBackgroundVideo;

/** The real letter is visible until this enhancement successfully initializes. */
function createReveal({ trigger, invitation, stage, heading, replay, status, reducedMotion, schedule, cancel }) {
  let opened = false;
  let timer = null;

  function finish() {
    timer = null;
    trigger.hidden = true;
    heading.focus({ preventScroll: true });
    status.textContent = 'Your reception invitation is open.';
  }

  function open() {
    if (opened) return;
    opened = true;
    trigger.disabled = true;
    trigger.setAttribute('aria-expanded', 'true');
    invitation.hidden = false;
    stage.classList.add('is-open');
    if (reducedMotion()) finish();
    else timer = schedule(finish, 1100);
  }

  function close() {
    if (timer !== null) cancel(timer);
    timer = null;
    opened = false;
    invitation.hidden = true;
    stage.classList.remove('is-open');
    trigger.hidden = false;
    trigger.disabled = false;
    trigger.setAttribute('aria-expanded', 'false');
    status.textContent = 'Invitation folded. You can open it again.';
    trigger.focus({ preventScroll: true });
  }

  trigger.addEventListener('click', open);
  replay.addEventListener('click', close);
  stage.classList.add('is-enhanced');
  invitation.hidden = true;
  trigger.hidden = false;
  trigger.setAttribute('aria-expanded', 'false');
  replay.hidden = false;
  return { open, close };
}

/** One motion control for ambient light, video and the CSS botanical breeze. */
function createFireflies({ canvas, button, doc, win, media, random = Math.random, onMotionChange = () => {} }) {
  const ctx = canvas.getContext('2d');

  const lights = Array.from({ length: 44 }, () => ({
    x: random(), y: random(), radius: .85 + random() * 1.2,
    speed: .006 + random() * .008, phase: random() * Math.PI * 2,
  }));
  let width = 0;
  let height = 0;
  let frame = null;
  let paused = false;
  let away = false;
  let elapsed = 0;
  let previousTime = null;

  function draw(time) {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    const seconds = time / 1000;
    for (const light of lights) {
      const x = (light.x + Math.sin(seconds * .15 + light.phase) * .025) * width;
      const y = ((light.y - seconds * light.speed) % 1 + 1) % 1 * height;
      const alpha = .36 + (.5 + .5 * Math.sin(seconds * .7 + light.phase)) * .44;
      const halo = ctx.createRadialGradient(x, y, 0, x, y, light.radius * 5);
      halo.addColorStop(0, `rgba(218, 165, 85, ${alpha * .45})`);
      halo.addColorStop(.4, `rgba(218, 165, 85, ${alpha * .16})`);
      halo.addColorStop(1, 'rgba(218, 165, 85, 0)');
      ctx.beginPath();
      ctx.arc(x, y, light.radius * 5, 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, light.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(230, 182, 100, ${alpha})`;
      ctx.fill();
    }
  }

  function tick(time) {
    // Count only active frames so a pause never resets or fast-forwards the garden.
    if (previousTime !== null) elapsed += time - previousTime;
    previousTime = time;
    draw(elapsed);
    frame = win.requestAnimationFrame(tick);
  }

  function stop() {
    if (frame !== null) win.cancelAnimationFrame(frame);
    frame = null;
    previousTime = null;
  }

  function update() {
    stop();
    const still = paused || media.matches;
    button.disabled = media.matches;
    button.setAttribute('aria-pressed', String(still));
    button.textContent = media.matches ? 'Reduced motion enabled' : paused ? 'Resume garden motion' : 'Pause garden motion';
    onMotionChange(still || doc.hidden || away, media.matches);
    if (ctx && !still && !doc.hidden && !away) frame = win.requestAnimationFrame(tick);
    else draw(elapsed);
  }

  function resize() {
    if (!ctx) return;
    width = win.innerWidth;
    height = win.innerHeight;
    const ratio = Math.min(win.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw(elapsed);
  }

  function toggle() {
    if (!media.matches) paused = !paused;
    update();
  }

  const listeners = [
    [win, 'resize', resize],
    [win, 'pagehide', () => { away = true; update(); }],
    [win, 'pageshow', () => { away = false; update(); }],
    [doc, 'visibilitychange', update], [media, 'change', update], [button, 'click', toggle],
  ];
  for (const [target, type, handler] of listeners) target.addEventListener(type, handler);
  button.hidden = false;
  resize();
  update();

  return function cleanup() {
    stop();
    onMotionChange(true, true);
    for (const [target, type, handler] of listeners) target.removeEventListener(type, handler);
  };
}

function initReception({ doc, win, config, hydrate }) {
  hydrate(doc);
  doc.title = `Reception — ${config.couple.groom.name} & ${config.couple.bride.name}`;

  const media = win.matchMedia('(prefers-reduced-motion: reduce)');
  createReveal({
    trigger: doc.getElementById('open-invitation'), invitation: doc.getElementById('invitation'),
    stage: doc.getElementById('letter-stage'), heading: doc.getElementById('invitation-heading'),
    replay: doc.getElementById('close-invitation'), status: doc.getElementById('reception-status'),
    reducedMotion: () => media.matches,
    schedule: (fn, delay) => win.setTimeout(fn, delay), cancel: id => win.clearTimeout(id),
  });
  const video = receptionVideoFactory(doc.getElementById('reception-video'));
  createFireflies({
    canvas: doc.getElementById('fireflies'), button: doc.getElementById('motion-toggle'), doc, win, media,
    onMotionChange: (paused, poster) => {
      doc.documentElement.style.setProperty('--garden-play-state', paused ? 'paused' : 'running');
      video.update(paused, poster);
    },
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createReveal, createFireflies, initReception };
} else {
  initReception({
    doc: document, win: window, config: WEDDING_CONFIG, hydrate: hydrateConfig,
  });
}