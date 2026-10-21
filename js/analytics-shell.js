(function () {
  'use strict';
  const { createAnalytics, classifyAction, scrollMilestones, preferenceKey } = window.InvitationAnalytics;
  const measurementId = 'G-78D63NNW7R';
  const base = new URL('./', location.href);
  const frame = document.getElementById('invitation-frame');
  const panel = document.getElementById('analytics-consent');
  const settings = document.getElementById('analytics-settings');
  const titles = { landing: 'Invitation — Welcome', wedding: 'Invitation — Wedding', reception: 'Invitation — Reception' };
  const files = { landing: 'index.html', wedding: 'wedding.html', reception: 'reception.html' };
  let storage, cleanup = () => {};
  try { storage = window.localStorage; } catch { /* Preferences can remain in memory. */ }
  function tag() { window.dataLayer.push(arguments); }
  function revoke() {
    window['ga-disable-' + measurementId] = true;
    if (window.dataLayer) tag('consent', 'update', { analytics_storage: 'denied' });
    // Remove only this integration's cookies, not preferences or other applications' cookies.
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.trim().split('=')[0];
      if (name !== '_ga' && name !== '_ga_78D63NNW7R') continue;
      for (const path of ['/', base.pathname]) for (const domain of ['', location.hostname, '.' + location.hostname]) {
        document.cookie = `${name}=; Max-Age=0; Path=${path}${domain ? '; Domain=' + domain : ''}; SameSite=Lax; Secure`;
      }
    }
  }
  const tracker = createAnalytics({ storage, revoke,
    load() {
      window['ga-disable-' + measurementId] = false;
      window.dataLayer = window.dataLayer || [];
      tag('consent', document.getElementById('invitation-google-tag') ? 'update' : 'default', {
        analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'
      });
      tag('js', new Date());
      let referrer = '';
      try { referrer = document.referrer ? new URL(document.referrer).origin : ''; } catch { /* No referrer. */ }
      tag('config', measurementId, {
        send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false,
        cookie_domain: location.hostname, cookie_path: base.pathname, cookie_expires: 60 * 60 * 24 * 90,
        page_location: new URL('index.html', base).href, page_title: titles.landing, page_referrer: referrer
      });
      if (!document.getElementById('invitation-google-tag')) {
        const script = document.createElement('script');
        script.id = 'invitation-google-tag';
        script.async = true; script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
        document.head.appendChild(script);
      }
    },
    send(name, params) {
      const context = { page_location: new URL(files[params.invitation_page], base).href, page_title: titles[params.invitation_page] };
      // Keep automatic engagement events on the current logical page, too.
      if (name === 'page_view') tag('set', context);
      tag('event', name, { ...context, ...params, send_to: measurementId });
    }
  });
  function choose(accept) {
    const wasEnabled = tracker.choice() !== 'declined';
    tracker.consent(accept);
    panel.hidden = true; settings.focus();
    // Only reload if the opt-out was saved; otherwise retain the in-memory disable flag.
    if (wasEnabled && !accept) {
      try { if (storage?.getItem(preferenceKey) === 'declined') location.reload(); } catch { /* Session-only opt-out. */ }
    }
  }
  settings.addEventListener('click', () => {
    const enabled = tracker.choice() !== 'declined';
    document.getElementById('analytics-status').textContent = enabled ? 'Visit analytics is on.' : 'Visit analytics is off.';
    panel.hidden = false;
    document.getElementById(enabled ? 'analytics-decline' : 'analytics-accept').focus();
  });
  document.getElementById('analytics-accept').addEventListener('click', () => choose(true));
  document.getElementById('analytics-decline').addEventListener('click', () => choose(false));
  document.getElementById('analytics-close').addEventListener('click', () => { panel.hidden = true; settings.focus(); });
  window.addEventListener('storage', event => {
    if (event.key === preferenceKey && event.newValue !== tracker.choice()) {
      if (event.newValue !== 'accepted') revoke();
      location.reload();
    }
  });
  panel.hidden = true;

  function attach() {
    const doc = frame.contentDocument;
    if (!doc || doc.location.href === 'about:blank') return;
    cleanup();
    tracker.page(doc.location.pathname.split('/').pop() || 'index.html');
    const seen = new Set();
    const click = event => {
      if (!event.isTrusted) return;
      const target = event.target.closest?.('a,button');
      if (!target) return;
      const action = classifyAction({ id: target.id, href: target.getAttribute('href') }, base.href);
      if (action) tracker.event(action.name, action.params);
    };
    const scroll = () => {
      if (tracker.choice() === 'declined') return;
      const el = doc.scrollingElement;
      for (const percent of scrollMilestones(el.scrollTop, el.clientHeight, el.scrollHeight, seen)) tracker.event('scroll_depth', { percent_scrolled: percent });
    };
    doc.addEventListener('click', click, true);
    doc.addEventListener('scroll', scroll, { passive: true });
    const trigger = doc.querySelector('#tie-cord, #open-invitation');
    let expanded = trigger?.getAttribute('aria-expanded');
    const observer = new MutationObserver(() => {
      const next = trigger.getAttribute('aria-expanded');
      if (next !== expanded) { tracker.event(next === 'true' ? 'invitation_open' : 'invitation_close'); expanded = next; }
    });
    if (trigger) observer.observe(trigger, { attributes: true, attributeFilter: ['aria-expanded'] });
    cleanup = () => { doc.removeEventListener('click', click, true); doc.removeEventListener('scroll', scroll); observer.disconnect(); };
  }
  frame.addEventListener('load', attach);
  if (frame.contentDocument?.readyState === 'complete') attach();
  document.getElementById('music-toggle').addEventListener('click', () => {
    tracker.event('music_toggle', { action: document.getElementById('music-toggle').getAttribute('aria-pressed') === 'true' ? 'off' : 'on' });
  }, true);
})();