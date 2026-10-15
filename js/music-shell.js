(function () {
  'use strict';
  const { createMusic, invitationRoute } = window.InvitationAudio;
  const base = new URL('./', location.href).href;
  const frame = document.getElementById('invitation-frame');
  const audio = document.getElementById('invitation-music');
  const button = document.getElementById('music-toggle');
  const status = document.getElementById('music-status');
  const printLink = document.getElementById('print-invitation');
  let storage;
  try { storage = window.localStorage; } catch { /* Optional preference storage. */ }
  const music = createMusic({ audio, storage, render(state) {
    const playing = state === 'playing';
    button.textContent = playing ? 'Turn music off' : state === 'unavailable' ? 'Music unavailable' : 'Play music';
    button.setAttribute('aria-pressed', String(playing));
    button.disabled = state === 'unavailable';
    status.textContent = ({ playing:'Music is playing', off:'Music is off', ready:'Tap to start the music', unavailable:'You can still enjoy the invitation without music' })[state];
  } });
  button.addEventListener('click', () => music.toggle());
  const params = new URLSearchParams(location.search);
  let current = invitationRoute(params.get('page') || 'index.html', base) || 'index.html';
  const anchor = params.get('anchor') || '';
  const first = new URL(current, base);
  if (anchor.startsWith('#')) first.hash = anchor;
  history.replaceState({ invitation:true }, '', first.href);

  function navigate(route, push = true) {
    if (route === current) return;
    current = route;
    const url = new URL(route, base).href;
    if (push) history.pushState({ invitation:true }, '', url);
    frame.contentWindow.location.replace(url);
  }
  frame.addEventListener('load', () => {
    const doc = frame.contentDocument;
    if (!doc || doc.location.href === 'about:blank') return;
    document.title = doc.title;
    frame.title = doc.title;
    printLink.href = new URL(current + '?standalone=1', base).href;
    // Same-origin frame gestures call play synchronously to retain user activation.
    doc.addEventListener('click', event => {
      if (event.isTrusted) music.start();
      const link = event.target.closest?.('a[href]');
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
          event.shiftKey || event.altKey || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
      const route = invitationRoute(link.href, base);
      if (!route) return;
      event.preventDefault();
      navigate(route);
    });
    doc.addEventListener('keydown', event => {
      if (event.isTrusted && ['Enter', ' '].includes(event.key)) music.start();
    });
  });
  window.addEventListener('popstate', () => {
    const route = invitationRoute(location.href, base);
    if (route) navigate(route, false);
  });
  frame.src = first.href;
  frame.hidden = false;
  document.querySelector('.music-bar').hidden = false;
  music.start();
})();