/* Consent-gated analytics with an explicit, non-personal event vocabulary. */
(function (root) {
  'use strict';
  const pages = { 'index.html': 'landing', 'wedding.html': 'wedding', 'reception.html': 'reception' };
  const events = new Set(['navigation_click','map_click','calendar_click','share_click','invitation_open','invitation_close','scroll_depth','music_toggle','motion_toggle']);
  const preferenceKey = 'invitation-analytics-consent-v1';

  function createAnalytics({ storage, load, send, revoke }) {
    let choice = null, current = null, last = null, loaded = false;
    try { choice = storage?.getItem(preferenceKey); } catch { /* Optional storage. */ }
    if (!['accepted','declined'].includes(choice)) choice = null;
    function pageView() {
      if (choice !== 'accepted' || !current || current === last) return;
      if (!loaded) { load(); loaded = true; }
      send('page_view', { invitation_page: current }); last = current;
    }
    return {
      choice: () => choice,
      consent(accept) {
        const previous = choice;
        choice = accept ? 'accepted' : 'declined';
        try { storage?.setItem(preferenceKey, choice); } catch { /* Session-only consent. */ }
        if (!accept) { last = null; if (previous === 'accepted') revoke(); }
        else pageView();
      },
      page(file) { current = Object.hasOwn(pages, file) ? pages[file] : null; pageView(); },
      event(name, params = {}) {
        if (choice !== 'accepted' || !current || !events.has(name)) return;
        const safe = { invitation_page: current };
        if (['landing','wedding','reception'].includes(params.destination)) safe.destination = params.destination;
        if (['on','off','toggle'].includes(params.action)) safe.action = params.action;
        if ([25,50,75,90].includes(params.percent_scrolled)) safe.percent_scrolled = params.percent_scrolled;
        send(name, safe);
      }
    };
  }
  function classifyAction({ id, href }, base) {
    if (id === 'share-landing') return { name: 'share_click', params: {} };
    if (['calendar-wedding','calendar-reception'].includes(id)) return { name: 'calendar_click', params: { destination: id.slice(9) } };
    if (['motion-toggle','wedding-video-toggle'].includes(id)) return { name: 'motion_toggle', params: { action: 'toggle' } };
    if (!href) return null;
    try {
      const url = new URL(href, base), directory = new URL('./', base);
      const maps = { 'https://share.google/5LpDdYQeVHZ9qTApS': 'wedding', 'https://share.google/MLjErDc9WtHHSo3wP': 'reception' };
      if (Object.hasOwn(maps, url.href)) return { name: 'map_click', params: { destination: maps[url.href] } };
      const file = url.pathname.slice(directory.pathname.length) || 'index.html';
      if (url.origin === directory.origin && url.pathname.startsWith(directory.pathname) && !url.search && !url.hash && Object.hasOwn(pages, file)) {
        return { name: 'navigation_click', params: { destination: pages[file] } };
      }
    } catch { /* Ignore malformed URLs and non-invitation actions. */ }
    return null;
  }
  function scrollMilestones(top, height, total, seen) {
    if (total <= height) return [];
    const percent = 100 * top / (total - height);
    return [25,50,75,90].filter(value => {
      if (percent < value || seen.has(value)) return false;
      seen.add(value); return true;
    });
  }
  const api = { createAnalytics, classifyAction, scrollMilestones, preferenceKey };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.InvitationAnalytics = api;
})(typeof window === 'undefined' ? globalThis : window);