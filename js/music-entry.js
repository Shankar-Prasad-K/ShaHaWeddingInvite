/* Static/no-JS pages remain usable. HTTP hosting enables a same-origin music shell. */
(function () {
  'use strict';
  if (!/^https?:$/.test(location.protocol) || window !== window.top ||
      new URLSearchParams(location.search).has('standalone')) return;
  const page = location.pathname.split('/').pop() || 'index.html';
  if (!['index.html', 'wedding.html', 'reception.html'].includes(page)) return;
  const shell = new URL('invite.html', location.href);
  shell.searchParams.set('page', page);
  if (location.hash) shell.searchParams.set('anchor', location.hash);
  location.replace(shell.href);
})();