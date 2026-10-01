'use strict';

/** Shared, lazy video playback for decorative backgrounds on both invitations. */
function createBackgroundVideo(video) {
  if (!video) return { update() {}, destroy() {} };
  let request = 0;
  let failed = false;
  let destroyed = false;
  function fail() {
    failed = true;
    request++;
    video.pause();
    video.hidden = true;
  }
  video.addEventListener('error', fail);
  return {
    update(still, poster = false) {
      const current = ++request;
      if (destroyed || failed || still) {
        video.pause();
        if (poster || failed || destroyed) video.hidden = true;
        return;
      }
      video.muted = true;
      if (!video.src) video.src = video.dataset.src;
      video.play().then(() => {
        if (current === request) video.hidden = false;
      }, () => {
        if (current === request) video.hidden = true;
      });
    },
    destroy() {
      destroyed = true;
      request++;
      video.pause();
      video.hidden = true;
      video.removeEventListener('error', fail);
    },
  };
}

if (typeof module !== 'undefined' && module.exports) module.exports = { createBackgroundVideo };