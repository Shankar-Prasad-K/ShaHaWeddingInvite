/* One audio element belongs to the outer invitation, never to its changing pages. */
(function (root) {
  'use strict';
  function invitationRoute(href, base) {
    try {
      const url = new URL(href, base);
      const directory = new URL('./', base);
      const file = url.pathname.slice(directory.pathname.length) || 'index.html';
      return url.origin === directory.origin && url.pathname.startsWith(directory.pathname) &&
        !url.search && !url.hash && ['index.html', 'wedding.html', 'reception.html'].includes(file) ? file : null;
    } catch { return null; }
  }

  function createMusic({ audio, storage, render }) {
    let disabled = false, pending = false, failed = false;
    try { disabled = storage?.getItem('invitation-music') === 'off'; } catch { /* Storage is optional. */ }
    audio.loop = true;
    audio.volume = .3;
    const update = () => render(failed ? 'unavailable' : disabled ? 'off' : audio.paused ? 'ready' : 'playing');
    const remember = () => { try { storage?.setItem('invitation-music', disabled ? 'off' : 'on'); } catch { /* Private browsing. */ } };
    const onError = () => { failed = true; update(); };
    audio.addEventListener('play', update);
    audio.addEventListener('pause', update);
    audio.addEventListener('error', onError);
    // Only one open tab of the invitation should ever be audible at a time.
    const tabId = Math.random().toString(36).slice(2);
    const claim = () => { try { storage?.setItem('invitation-music-owner', tabId); } catch { /* Storage is optional. */ } };
    const onStorage = event => {
      if (event.key === 'invitation-music-owner' && event.newValue !== tabId && !audio.paused) audio.pause();
    };
    if (typeof root.addEventListener === 'function') root.addEventListener('storage', onStorage);
    update();
    async function start() {
      if (disabled || failed || pending || !audio.paused) return;
      pending = true;
      try {
        await audio.play();
        if (disabled) audio.pause();
        else claim();
      } catch { /* Autoplay denial is expected; the next gesture can retry. */ }
      finally { pending = false; update(); }
    }
    async function toggle() {
      if (failed) return;
      disabled = !disabled && (!audio.paused || pending);
      remember();
      if (disabled) { audio.pause(); update(); }
      else await start();
    }
    return { start, toggle, destroy() {
      audio.removeEventListener('play', update);
      audio.removeEventListener('pause', update);
      audio.removeEventListener('error', onError);
      if (typeof root.removeEventListener === 'function') root.removeEventListener('storage', onStorage);
    } };
  }
  const api = { createMusic, invitationRoute };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.InvitationAudio = api;
})(typeof window === 'undefined' ? globalThis : window);