const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createMusic, invitationRoute } = require('../js/music.js');

function fixture(saved = null, blocked = false) {
  const events = new Map();
  const audio = {
    paused:true, calls:0,
    addEventListener(type, fn) { events.set(type, fn); },
    removeEventListener(type) { events.delete(type); },
    async play() { this.calls++; if (blocked) throw Error('Blocked'); this.paused = false; events.get('play')?.(); },
    pause() { this.paused = true; events.get('pause')?.(); }
  };
  const states = [];
  const storage = { getItem:() => saved, setItem:(key, value) => { saved = value; } };
  const music = createMusic({ audio, storage, render:state => states.push(state) });
  return { audio, events, states, music, saved:() => saved };
}

test('one looping player starts once and repeated navigation interactions do not restart it', async () => {
  const f = fixture();
  assert.equal(f.audio.loop, true);
  assert.equal(f.audio.volume, .3);
  await f.music.start(); await f.music.start();
  assert.equal(f.audio.calls, 1);
  assert.equal(f.states.at(-1), 'playing');
  f.music.destroy(); assert.equal(f.events.size, 0);
});
test('mute preference prevents gesture autoplay and explicit enable resumes', async () => {
  const f = fixture('off');
  await f.music.start(); assert.equal(f.audio.calls, 0);
  await f.music.toggle(); assert.equal(f.states.at(-1), 'playing');
  await f.music.toggle(); assert.equal(f.audio.paused, true); assert.equal(f.saved(), 'off');
  await f.music.start(); assert.equal(f.audio.calls, 1);
});
test('blocked autoplay stays off and can retry, without unhandled errors', async () => {
  const f = fixture(null, true);
  await f.music.start(); assert.equal(f.states.at(-1), 'ready');
  await f.music.start(); assert.equal(f.audio.calls, 2);
});
test('pending play is not duplicated and disabling wins over a delayed resolution', async () => {
  const f = fixture(); let finish;
  f.audio.play = () => { f.audio.calls++; return new Promise(resolve => { finish = () => { f.audio.paused = false; resolve(); }; }); };
  const pending = f.music.start(); await f.music.start();
  assert.equal(f.audio.calls, 1);
  await f.music.toggle(); finish(); await pending;
  assert.equal(f.audio.paused, true); assert.equal(f.states.at(-1), 'off');
});
test('missing audio disables controls and inaccessible storage does not break playback', async () => {
  const f = fixture(); f.events.get('error')(); await f.music.start(); await f.music.toggle();
  assert.equal(f.audio.calls, 0); assert.equal(f.states.at(-1), 'unavailable');
  const storage = { getItem() { throw Error(); }, setItem() { throw Error(); } };
  const music = createMusic({ audio:fixture().audio, storage, render() {} });
  await music.toggle(); await music.toggle(); music.destroy();
});
test('only same-directory invitation routes can navigate the persistent frame', () => {
  const base = 'https://example.test/invite/';
  for (const file of ['index.html', 'wedding.html', 'reception.html']) {
    assert.equal(invitationRoute(file, base), file);
  }
  assert.equal(invitationRoute('./', base), 'index.html');
  for (const route of ['https://evil.test/wedding.html', '../wedding.html', 'javascript:alert(1)', 'assets/a.mp3', 'wedding.html?x=1', 'wedding.html#x', 'http://[']) {
    assert.equal(invitationRoute(route, base), null);
  }
});