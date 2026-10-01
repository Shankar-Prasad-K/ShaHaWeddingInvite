/* Original braided cord artwork and DOM adapter for the tested scroll controller. */
function initWeddingEffects(document, window, WeddingScroll) {
  'use strict';
  const setTimeout = window.setTimeout.bind(window);
  const clearTimeout = window.clearTimeout.bind(window);
  const cord = document.getElementById('tie-cord');
  const panel = document.getElementById('scroll-body');
  const roll = document.getElementById('scroll-roll');
  const prompt = document.getElementById('enter-prompt-w');
  const heading = document.getElementById('wedding-heading');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const { createPullGesture, createReveal, petalSpecs, UNFURL_DURATION } = WeddingScroll;
  document.documentElement.style.setProperty('--unfurl-duration', `${UNFURL_DURATION}ms`);

  function thread(d, className) {
    return `<g class="${className}" fill="none" stroke-linecap="round">
      <path d="${d}" stroke="#3a210d" stroke-width="6"/>
      <path d="${d}" stroke="url(#braid-bronze)" stroke-width="4"/>
      <path d="${d}" stroke="var(--cord-highlight)" stroke-width="1" stroke-dasharray="1 3" opacity=".65"/>
    </g>`;
  }
  function charm(x, y, letter) {
    return `<g class="cord-charm"><g transform="translate(${x} ${y})">
      <defs><clipPath id="charm-face-${letter}"><path d="M0 -16 Q18 -13 14 3 Q11 16 0 20 Q-11 16 -14 3 Q-18 -13 0 -16Z"/></clipPath></defs>
      <circle cy="-19" r="3" fill="none" stroke="#be8b60" stroke-width="2"/>
      <path d="M0 -16 Q18 -13 14 3 Q11 16 0 20 Q-11 16 -14 3 Q-18 -13 0 -16Z" fill="url(#charm-foil)" stroke="#8d651e"/>
      <path d="M0 -12 Q13 -9 10 3 Q8 12 0 15 Q-8 12 -10 3 Q-13 -9 0 -12Z" fill="#501323" stroke="#fff0b3" stroke-width=".7"/>
      <path d="M-8 -9L-5 -11M5 -11L8 -9M-8 9L-5 12M5 12L8 9" stroke="#f4d384" stroke-width=".7"/>
      <text class="charm-initial" y="7" text-anchor="middle" font-family="Cinzel,serif" font-size="19" fill="url(#initial-foil)">${letter}</text>
      <g clip-path="url(#charm-face-${letter})"><path class="charm-shine" d="M-17 -22H-5L17 24H5Z" fill="url(#charm-light)"/></g>
    </g></g>`;
  }
  cord.innerHTML = `<svg viewBox="0 0 240 232" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="braid-bronze" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#8e5635"/><stop offset=".32" stop-color="#eed2b6"/><stop offset=".55" stop-color="#be8b60"/><stop offset=".8" stop-color="#e6bc91"/><stop offset="1" stop-color="#603b29"/></linearGradient>
      <radialGradient id="charm-foil" cx=".3" cy=".2"><stop stop-color="#eed2b6"/><stop offset=".6" stop-color="#be8b60"/><stop offset="1" stop-color="#8e5635"/></radialGradient>
      <linearGradient id="initial-foil" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff1df"/><stop offset=".45" stop-color="#eed2b6"/><stop offset=".6" stop-color="#be8b60"/><stop offset="1" stop-color="#f5ddc4"/></linearGradient>
      <linearGradient id="charm-light"><stop stop-color="#fff9dc" stop-opacity="0"/><stop offset=".5" stop-color="#fff9dc" stop-opacity=".95"/><stop offset="1" stop-color="#fff9dc" stop-opacity="0"/></linearGradient>
    </defs>
    ${thread('M114 0 C105 20 111 67 119 90 M125 0 C133 27 126 70 121 91', 'cord-wrap')}
    ${thread('M120 92 C104 58 59 47 67 73 C74 93 103 101 120 92', 'cord-loop left')}
    ${thread('M120 92 C141 58 181 54 172 77 C161 97 140 97 120 92', 'cord-loop right')}
    <g class="cord-tail">
      ${thread('M119 94 C101 117 104 142 96 162 M123 94 C144 115 134 151 148 174', 'cord-strand')}
      ${charm(96, 182, 'H')}${charm(148, 194, 'S')}
    </g>
    <ellipse cx="121" cy="92" rx="10" ry="6" fill="url(#braid-bronze)" stroke="#603b29"/>
    <path d="M116 88 L125 96 M120 87 L129 94" stroke="#eed2b6" stroke-width="1" opacity=".7"/>
  </svg>`;

  let cleanupTimer;
  function clearPetals() {
    clearTimeout(cleanupTimer);
    document.getElementById('petal-layer')?.remove();
  }
  function celebrate() {
    clearPetals();
    const layer = document.createElement('div');
    layer.id = 'petal-layer'; layer.setAttribute('aria-hidden', 'true');
    for (const p of petalSpecs(window.innerWidth, window.innerHeight)) {
      const petal = document.createElement('span');
      petal.className = `petal depth-${p.depth}`;
      petal.style.left = `${p.x}px`;
      petal.style.width = `${p.size}px`; petal.style.height = `${p.size * 1.35}px`;
      for (const [key, value] of Object.entries({ fall: `${p.fall}px`, drift: `${p.drift}px`, spin: `${p.spin}deg`, duration: `${p.duration}s`, delay: `${p.delay}s` })) {
        petal.style.setProperty(`--${key}`, value);
      }
      petal.appendChild(document.createElement('i')); layer.appendChild(petal);
    }
    document.body.appendChild(layer);
    cleanupTimer = setTimeout(clearPetals, 5000);
  }
  let phase = 'closed';
  const reveal = createReveal({
    schedule:setTimeout, cancel:clearTimeout,
    still: () => motion.matches,
    render(value) {
      phase = value;
      const visible = value === 'opening' || value === 'open';
      panel.classList.toggle('open', visible); roll.classList.toggle('open', visible);
      roll.classList.toggle('unfurling', value === 'opening');
      panel.inert = !visible; panel.setAttribute('aria-hidden', String(!visible));
      cord.setAttribute('aria-expanded', String(visible));
      cord.classList.toggle('releasing', value !== 'closed');
      cord.classList.toggle('gone', visible); cord.disabled = value !== 'closed';
      prompt.style.visibility = value === 'closed' ? 'visible' : 'hidden';
    },
    focus() { heading.focus({ preventScroll:true }); panel.scrollIntoView({ block:'start', behavior:'instant' }); },
    celebrate
  });
  const pull = createPullGesture(progress => {
    cord.style.setProperty('--pull', `${progress * 34}px`);
    cord.style.setProperty('--tension', String(progress));
    cord.querySelectorAll('.cord-loop').forEach(loop => {
      loop.style.transform = progress ? `scale(${1 - progress * .24},${1 - progress * .3})` : '';
    });
  }, () => {
    cord.querySelectorAll('.cord-loop').forEach(loop => { loop.style.transform = ''; });
    reveal.open();
  });
  let pointer = null, suppressClick = false;
  cord.addEventListener('pointerdown', event => {
    if (phase !== 'closed' || pointer !== null || event.button !== 0) return;
    pointer = event.pointerId; suppressClick = false; pull.start(event.clientY);
    cord.setPointerCapture(pointer); cord.classList.add('dragging');
  });
  cord.addEventListener('pointermove', event => { if (event.pointerId === pointer) pull.move(event.clientY); });
  cord.addEventListener('pointerup', event => {
    if (event.pointerId !== pointer) return;
    suppressClick = pull.end(); pointer = null; cord.classList.remove('dragging');
  });
  function cancelPull() {
    if (pointer === null) return;
    pointer = null; suppressClick = true; pull.cancel(); cord.classList.remove('dragging');
  }
  cord.addEventListener('pointercancel', cancelPull);
  cord.addEventListener('lostpointercapture', cancelPull);
  cord.addEventListener('click', event => {
    if (event.detail === 0 || !suppressClick) reveal.open();
    suppressClick = false;
  });
  motion.addEventListener('change', () => {
    if (motion.matches) { cancelPull(); reveal.finish(); clearPetals(); }
  });
  window.addEventListener('pagehide', () => { cancelPull(); reveal.finish(); clearPetals(); });
  document.documentElement.classList.add('scroll-initializing', 'scroll-enhanced');
  // Commit the closed layout before enabling transitions; no opening flash on load.
  void panel.offsetHeight;
  document.documentElement.classList.remove('scroll-initializing');
}
if (typeof module !== 'undefined' && module.exports) module.exports = { initWeddingEffects };
else initWeddingEffects(document, window, WeddingScroll);