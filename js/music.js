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
    update();
    async function start() {
      if (disabled || failed || pending || !audio.paused) return;
      pending = true;
      try {
        await audio.play();
        if (disabled) audio.pause();
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
    } };
  }
  const api = { createMusic, invitationRoute };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.InvitationAudio = api;
})(typeof window === 'undefined' ? globalThis : window);