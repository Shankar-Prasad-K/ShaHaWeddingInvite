const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createAnalytics, classifyAction, scrollMilestones } = require('../js/analytics.js');

function fixture(saved = null) {
  const calls = [], events = [], preferences = [];
  const tracker = createAnalytics({
    storage: { getItem: () => saved, setItem: (_, value) => preferences.push(value) },
    load: () => calls.push('load'), revoke: () => calls.push('revoke'),
    send: (name, params) => events.push({ name, params })
  });
  return { tracker, calls, events, preferences };
}
test('no collection before consent; accepting sends only the current page', () => {
  const f = fixture();
  f.tracker.page('index.html'); f.tracker.event('share_click'); f.tracker.page('wedding.html');
  assert.deepEqual(f.calls, []); assert.deepEqual(f.events, []);
  f.tracker.consent(true);
  assert.deepEqual(f.calls, ['load']);
  assert.deepEqual(f.events, [{ name: 'page_view', params: { invitation_page: 'wedding' } }]);
  f.tracker.consent(true); assert.equal(f.events.length, 1);
});
test('saved consent tracks navigation once and history revisits again', () => {
  const f = fixture('accepted');
  for (const page of ['index.html','index.html','wedding.html','index.html']) f.tracker.page(page);
  assert.equal(f.events.length, 3);
  f.tracker.event('music_toggle', { action: 'off', email: 'private@example.test' });
  assert.deepEqual(f.events.at(-1).params, { invitation_page: 'landing', action: 'off' });
});
test('declining and withdrawing block all later collection', () => {
  const f = fixture('declined'); f.tracker.page('index.html');
  assert.equal(f.events.length, 0);
  f.tracker.consent(true); f.tracker.consent(false);
  const count = f.events.length;
  f.tracker.page('reception.html'); f.tracker.event('share_click');
  assert.equal(f.events.length, count);
  assert.deepEqual(f.calls, ['load', 'revoke']);
  assert.deepEqual(f.preferences, ['accepted', 'declined']);
});
test('storage failures do not prevent consent or break invitations', () => {
  const tracker = createAnalytics({ storage: { getItem() { throw Error(); }, setItem() { throw Error(); } }, load() {}, send() {}, revoke() {} });
  assert.equal(tracker.choice(), null); tracker.consent(true); tracker.consent(false);
});
test('unknown pages, event names and arbitrary parameters are discarded', () => {
  const f = fixture('accepted');
  f.tracker.page('private@example.test'); f.tracker.event('share_click');
  assert.equal(f.events.length, 0);
  f.tracker.page('index.html'); f.tracker.event('private_event', {});
  f.tracker.event('scroll_depth', { percent_scrolled: 42, action: 'private', destination: 'https://private.test' });
  assert.deepEqual(f.events.at(-1).params, { invitation_page: 'landing' });
});
test('actions are classified by fixed IDs and allowed destinations only', () => {
  const base = 'https://example.test/invite/';
  for (const [id, name] of [['share-landing','share_click'],['calendar-wedding','calendar_click'],['calendar-reception','calendar_click'],['motion-toggle','motion_toggle'],['wedding-video-toggle','motion_toggle']]) {
    assert.equal(classifyAction({ id }, base).name, name);
  }
  assert.equal(classifyAction({ href: 'wedding.html' }, base).params.destination, 'wedding');
  assert.equal(classifyAction({ href: 'https://share.google/5LpDdYQeVHZ9qTApS' }, base).name, 'map_click');
  assert.equal(classifyAction({ href: 'https://share.google/MLjErDc9WtHHSo3wP' }, base).params.destination, 'reception');
  for (const href of ['https://evil.test/wedding.html','../wedding.html','wedding.html?email=private','javascript:alert(1)','http://[']) assert.equal(classifyAction({ href }, base), null);
  assert.equal(classifyAction({}, base), null);
});
test('scroll milestones are emitted once and only for scrollable pages', () => {
  const seen = new Set();
  assert.deepEqual(scrollMilestones(0, 500, 500, seen), []);
  assert.deepEqual(scrollMilestones(300, 500, 1000, seen), [25,50]);
  assert.deepEqual(scrollMilestones(500, 500, 1000, seen), [75,90]);
  assert.deepEqual(scrollMilestones(500, 500, 1000, seen), []);
});