const test = require('node:test');
const assert = require('node:assert/strict');
const { buildCalendar, shareWithFallback, showToast, revealShareLink, hydrateConfig, addWeddingToCalendar, addReceptionToCalendar, shareInvite } = require('../js/features.js');

const event = { uid:'wedding-shankar-haripriya@invitation', title:'Wedding', description:'With love', location:'Coimbatore', startUTC:'20261120T003000Z', endUTC:'20261120T020000Z' };
const stamp = '20261001T120000Z';

test('calendar uses stable event identity, UTC times and the actual export timestamp', () => {
  const first = buildCalendar(event, stamp);
  const second = buildCalendar(event, '20261002T120000Z');
  assert.equal(first.match(/UID:.*/)[0], second.match(/UID:.*/)[0]);
  assert.ok(first.includes(`DTSTAMP:${stamp}\r\n`));
  assert.ok(first.includes(`DTSTART:${event.startUTC}\r\n`));
  assert.ok(first.includes(`DTEND:${event.endUTC}\r\n`));
  assert.ok(first.endsWith('END:VCALENDAR\r\n'));
});

test('calendar escapes text and folds UTF-8 lines at 75 octets without splitting characters', () => {
  const title = 'திருமணம் 🌸 '.repeat(20);
  const ics = buildCalendar({ ...event, title, description:'One, two; three\\four\r\nEND:VEVENT\nFive', location:'A, B; C' }, stamp);
  for (const line of ics.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75);
  const unfolded = ics.replace(/\r\n /g, '');
  assert.ok(unfolded.includes(`SUMMARY:${title}`));
  assert.ok(unfolded.includes('DESCRIPTION:One\\, two\\; three\\\\four\\nEND:VEVENT\\nFive'));
  assert.ok(unfolded.includes('LOCATION:A\\, B\\; C'));
  assert.equal(ics.split('\r\n').filter(line => line === 'END:VEVENT').length, 1);
});

test('calendar rejects invalid dates, ordering and unsafe identifiers', () => {
  for (const overrides of [{startUTC:'bad'}, {startUTC:'20260230T003000Z'}, {endUTC:event.startUTC}, {endUTC:'20251120T020000Z'}, {uid:'bad\r\nSUMMARY:x'}]) {
    assert.throws(() => buildCalendar({...event,...overrides}, stamp));
  }
  assert.throws(() => buildCalendar(event, 'invalid'));
});

function shareFixture(nav = {}) {
  const calls = [];
  return { nav, data:{title:'Invitation',text:'Join us',url:'https://example.com/invite/'}, notify:message => calls.push(['notify',message]), showLink:url => calls.push(['link',url]), calls };
}
test('native sharing succeeds without copying or showing a fallback', async () => {
  let payload;
  const f = shareFixture({share:async data => { payload = data; }});
  assert.equal(await shareWithFallback(f), 'shared');
  assert.equal(payload, f.data);
  assert.deepEqual(f.calls, []);
});
test('cancelling native sharing is silent', async () => {
  const f = shareFixture({share:async () => { throw {name:'AbortError'}; }});
  assert.equal(await shareWithFallback(f), 'cancelled');
  assert.deepEqual(f.calls, []);
});
test('unavailable or failed native sharing falls back to copying', async () => {
  for (const share of [undefined, () => { throw Error('unavailable'); }]) {
    let copied;
    const f = shareFixture({share,clipboard:{writeText:async url => { copied = url; }}});
    assert.equal(await shareWithFallback(f), 'copied');
    assert.equal(copied, f.data.url);
    assert.deepEqual(f.calls, [['notify','Invitation link copied.']]);
  }
});
test('blocked or unavailable clipboard offers a persistent manual-copy link', async () => {
  for (const clipboard of [undefined, {writeText:async () => { throw Error('denied'); }}]) {
    const f = shareFixture({clipboard});
    assert.equal(await shareWithFallback(f), 'manual');
    assert.deepEqual(f.calls, [['link',f.data.url]]);
  }
});
test('sharing rejects unsafe link schemes without invoking platform APIs', async () => {
  const f = shareFixture();
  f.data.url = 'javascript:alert(1)';
  await assert.rejects(shareWithFallback(f));
  assert.deepEqual(f.calls, []);
});

function fakeDocument() {
  const nodes = new Map();
  const make = () => ({style:{}, attributes:{}, setAttribute(key,value){this.attributes[key]=value;}, focus(){this.focused=true;}, select(){this.selected=true;}});
  return { nodes, getElementById:id => nodes.get(id), createElement:make, body:{appendChild(el){nodes.set(el.id,el);}} };
}
test('toast reuses one live region and replaces its dismissal timer', () => {
  const doc = fakeDocument();
  const timers = new Map();
  let id = 0;
  const options = {doc,frame:fn => fn(),schedule:fn => {timers.set(++id,fn);return id;},cancel:key => timers.delete(key)};
  showToast('First', options);
  showToast('Second', options);
  assert.equal(doc.nodes.size,1);
  const toast = doc.getElementById('wed-toast');
  assert.equal(toast.attributes.role,'status');
  assert.equal(toast.attributes['aria-live'],'polite');
  assert.equal(toast.textContent,'Second');
  assert.equal(timers.size,1);
  [...timers.values()][0]();
  assert.equal(toast.style.opacity,'0');
});
test('manual-copy field is revealed, focused and selected without opening a window', () => {
  const doc = fakeDocument();
  for (const id of ['share-link-panel','share-link-value']) doc.nodes.set(id,doc.createElement());
  revealShareLink('https://example.com/',doc);
  const field = doc.getElementById('share-link-value');
  assert.equal(doc.getElementById('share-link-panel').hidden,false);
  assert.equal(field.value,'https://example.com/');
  assert.ok(field.focused && field.selected);
});
test('hydration safely handles text, links, missing values and zero', () => {
  const nodes = [['SPAN','name'],['A','map'],['SPAN','missing'],['SPAN','count']].map(([tagName,key]) => ({tagName,getAttribute:() => key}));
  hydrateConfig({querySelectorAll:() => nodes},{name:'A & B',map:'https://example.com',count:0});
  assert.equal(nodes[0].textContent,'A & B');
  assert.equal(nodes[1].href,'https://example.com');
  assert.equal(nodes[2].textContent,undefined);
  assert.equal(nodes[3].textContent,0);
});

test('browser adapters prepare both downloads, revoke URLs and share configured content with isolated platform fakes', async t => {
  const doc = fakeDocument();
  const downloads = [], blobs = [], timers = [], revoked = [];
  const create = doc.createElement;
  doc.createElement = () => ({...create(),click(){downloads.push(this);}});
  doc.body.removeChild = () => {};
  const platform = {
    document:doc, requestAnimationFrame:fn => fn(),
    setTimeout:fn => {timers.push(fn);return timers.length;}, clearTimeout:() => {},
    URL:class extends URL { static createObjectURL(blob){blobs.push(blob);return 'blob:test';} static revokeObjectURL(url){revoked.push(url);} },
    Date:class extends Date { constructor(...args){super(...(args.length ? args : ['2026-10-01T12:00:00Z']));} },
    navigator:{share:async data => {platform.payload = data;}},
    WEDDING_CONFIG:{site:{title:'Our invitation',url:'https://example.com/'},couple:{groom:{name:'Groom'},bride:{name:'Bride'}},closing:'With love',
      wedding:{label:'Ceremony',dateDisplay:'20 November 2026',venueName:'Temple',venueAddress:'City',icsStartUTC:event.startUTC,icsEndUTC:event.endUTC},
      reception:{venueName:'Hall',venueAddress:'City',icsStartUTC:'20261120T130000Z',icsEndUTC:'20261120T153000Z'}}
  };
  for (const [key,value] of Object.entries(platform)) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis,key);
    Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
    t.after(() => {if(descriptor) Object.defineProperty(globalThis,key,descriptor); else delete globalThis[key];});
  }
  addWeddingToCalendar(); addReceptionToCalendar();
  assert.equal(downloads.length,2);
  assert.match(downloads[0].download,/Wedding\.ics$/);
  assert.match(downloads[1].download,/Reception\.ics$/);
  const contents = await Promise.all(blobs.map(blob => blob.text()));
  assert.ok(contents.every(content => content.includes(`DTSTAMP:${stamp}`)));
  assert.notEqual(contents[0].match(/UID:.*/)[0],contents[1].match(/UID:.*/)[0]);
  timers.forEach(fn => fn());
  assert.deepEqual(revoked,['blob:test','blob:test']);
  await shareInvite();
  assert.equal(platform.payload.url,'https://example.com/');
  assert.match(platform.payload.text,/Groom & Bride/);
  platform.WEDDING_CONFIG.site.url = 'http://unsafe.example/';
  await shareInvite();
  assert.match(doc.getElementById('wed-toast').textContent,/unavailable/);
});