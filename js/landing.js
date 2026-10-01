'use strict';

const landingVideoFactory = typeof module !== 'undefined' && module.exports
  ? require('./background-video.js').createBackgroundVideo : createBackgroundVideo;

function parseUTC(value) {
  if (typeof value !== 'string' || !/^\d{8}T\d{6}Z$/.test(value)) return NaN;
  const iso = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(9, 11)}:${value.slice(11, 13)}:${value.slice(13, 15)}.000Z`;
  const time = Date.parse(iso);
  return Number.isFinite(time) && new Date(time).toISOString() === iso ? time : NaN;
}

function countdownParts(target, now) {
  const seconds = Math.max(0, Math.floor((target - now) / 1000));
  const pad = value => String(value).padStart(2, '0');
  return {
    days: String(Math.floor(seconds / 86400)), hours: pad(Math.floor(seconds % 86400 / 3600)),
    minutes: pad(Math.floor(seconds % 3600 / 60)), seconds: pad(seconds % 60),
  };
}

function listen(bindings) {
  for (const [target, event, handler] of bindings) target.addEventListener(event, handler);
  return () => {
    for (const [target, event, handler] of bindings) target.removeEventListener(event, handler);
  };
}

function createCountdown({ doc, win, target, now = Date.now }) {
  const timestamp = parseUTC(target);
  const container = doc.getElementById('countdown');
  if (!Number.isFinite(timestamp)) {
    container.hidden = true;
    return () => {};
  }
  const fields = Object.fromEntries([['days', 'cd-days'], ['hours', 'cd-hours'], ['minutes', 'cd-mins'], ['seconds', 'cd-secs']].map(([part, id]) => [part, doc.getElementById(id)]));
  let timer = null;
  let complete = false;
  let away = false;

  function stop() {
    if (timer !== null) win.clearInterval(timer);
    timer = null;
  }
  function tick() {
    const current = now();
    if (current >= timestamp) {
      if (!complete) {
        doc.getElementById('countdown-values').hidden = true;
        doc.getElementById('countdown-caption').textContent = 'With love, always';
        doc.getElementById('landing-status').textContent = 'Our wedding day has arrived. Explore the wedding and reception invitations below.';
        complete = true;
      }
      stop();
      return;
    }
    for (const [key, value] of Object.entries(countdownParts(timestamp, current))) fields[key].textContent = value;
  }
  function update() {
    stop();
    if (doc.hidden || away) return;
    tick();
    if (!complete) timer = win.setInterval(tick, 1000);
  }
  const unlisten = listen([
    [doc, 'visibilitychange', update],
    [win, 'pagehide', () => { away = true; stop(); }],
    [win, 'pageshow', () => { away = false; update(); }],
  ]);
  tick();
  container.hidden = false;
  update();
  return () => { stop(); unlisten(); };
}

/** CSS timelines and video retain their position when paused. */
function createMotion({ doc, win, media = win.matchMedia('(prefers-reduced-motion: reduce)'), onChange = () => {} }) {
  const button = doc.getElementById('motion-toggle');
  let paused = false;
  let away = false;
  const setState = (still, poster = media.matches) => {
    doc.documentElement.style.setProperty('--motion-state', still ? 'paused' : 'running');
    onChange(still, poster);
  };
  function update() {
    const still = paused || media.matches;
    setState(still || doc.hidden || away);
    button.disabled = media.matches;
    button.setAttribute('aria-pressed', String(still));
    button.textContent = media.matches ? 'Reduced motion enabled' : paused ? 'Resume motion' : 'Pause motion';
  }
  const unlisten = listen([
    [button, 'click', () => { if (!media.matches) paused = !paused; update(); }],
    [media, 'change', update], [doc, 'visibilitychange', update],
    [win, 'pagehide', () => { away = true; update(); }],
    [win, 'pageshow', () => { away = false; update(); }],
  ]);
  update();
  button.hidden = false;
  return () => { setState(true, true); unlisten(); };
}

function initLanding({ doc, win, config, hydrate, share, now = Date.now }) {
  hydrate(doc);
  doc.title = config.site.title;
  const shareButton = doc.getElementById('share-landing');
  shareButton.addEventListener('click', share);
  shareButton.hidden = false;
  const countdown = createCountdown({ doc, win, target: config.wedding.icsStartUTC, now });
  const video = landingVideoFactory(doc.getElementById('background-video'));
  const motion = createMotion({ doc, win, onChange: video.update });
  return () => { countdown(); motion(); video.destroy(); shareButton.removeEventListener('click', share); };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parseUTC, countdownParts, createCountdown, createBackgroundVideo: landingVideoFactory, createMotion, initLanding };
} else {
  initLanding({ doc: document, win: window, config: WEDDING_CONFIG, hydrate: hydrateConfig, share: shareInvite });
}