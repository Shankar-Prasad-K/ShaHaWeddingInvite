// Controlled HTTP integration: serve only public invitation files, never private originals.
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.mp3':'audio/mpeg', '.mp4':'video/mp4', '.jpg':'image/jpeg', '.png':'image/png', '.svg':'image/svg+xml' };
const server = http.createServer((req, res) => {
  const name = new URL(req.url, 'http://localhost').pathname.slice(1) || 'index.html';
  const file = path.resolve(root, name);
  if (!file.startsWith(root + path.sep) || !/^(?:(?:index|wedding|reception|invite)\.html|(?:js|styles|assets)\/[\w./-]+)$/.test(name) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); res.end(); return;
  }
  const size = fs.statSync(file).size;
  const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
  const start = range ? Number(range[1]) : 0;
  const end = range && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
  if (start > end) { res.writeHead(416); res.end(); return; }
  res.writeHead(range ? 206 : 200, { 'Content-Type':types[path.extname(file)] || 'application/octet-stream',
    'Accept-Ranges':'bytes', 'Content-Length':end - start + 1,
    ...(range ? { 'Content-Range':`bytes ${start}-${end}/${size}` } : {}) });
  fs.createReadStream(file, { start, end }).pipe(res);
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ headless:true, args:['--autoplay-policy=no-user-gesture-required'] });
  const errors = [];
  async function newPage(options = {}) {
    const page = await browser.newPage(options);
    page.on('pageerror', error => errors.push(error.message));
    await page.route(/^https:\/\//, route => route.abort());
    return page;
  }
  const ready = page => page.waitForFunction(() => {
    const frame = document.getElementById('invitation-frame');
    return frame?.contentDocument?.readyState === 'complete' &&
      frame.contentDocument.location.pathname === location.pathname;
  });
  try {
    for (const width of [320, 390, 1440]) {
      const page = await newPage({ viewport:{ width, height:844 } });
      await page.goto(base); await ready(page);
      await page.waitForFunction(() => document.getElementById('invitation-music')?.currentTime > .2);
      await page.evaluate(() => {
        window.originalAudio = document.getElementById('invitation-music');
        window.pauses = 0;
        originalAudio.addEventListener('pause', () => window.pauses++);
      });
      for (const file of ['wedding.html', 'reception.html', 'index.html']) {
        const before = await page.locator('audio').evaluate(el => el.currentTime);
        await page.frameLocator('#invitation-frame').locator(`a[href="${file}"]`).first().click();
        await page.waitForURL(base + file); await ready(page);
        assert.ok(await page.evaluate(() => originalAudio === document.getElementById('invitation-music')));
        assert.equal(await page.evaluate(() => pauses), 0, 'No pause event during internal navigation');
        assert.ok(await page.locator('audio').evaluate((el, before) => !el.paused && el.currentTime >= before, before), 'Playback clock continues');
      }
      await page.goBack(); await page.waitForURL(base + 'reception.html'); await ready(page);
      assert.match(await page.frameLocator('#invitation-frame').locator('title').textContent(), /Reception/);
      await page.goForward(); await page.waitForURL(base + 'index.html'); await ready(page);
      assert.equal(await page.evaluate(() => pauses), 0, 'Back/forward does not pause audio');
      if (width === 390) {
        const content = page.frameLocator('#invitation-frame');
        const download = page.waitForEvent('download');
        await content.locator('#calendar-wedding').click();
        assert.match((await download).suggestedFilename(), /\.ics$/);
        await content.locator('body').evaluate(() => {
          Object.defineProperty(navigator, 'share', { configurable:true, value:async data => { window.sharedInvitation = data; } });
        });
        await content.locator('#share-landing').click();
        assert.equal(await content.locator('body').evaluate(() => window.sharedInvitation.url), 'https://shankar-prasad-k.github.io/ShaHaWeddingInvite/');
        assert.equal(await page.evaluate(() => pauses), 0, 'Calendar/share actions do not pause the player');
      }
      await page.locator('#music-toggle').click();
      assert.equal(await page.locator('audio').evaluate(el => el.paused), true);
      await page.frameLocator('#invitation-frame').locator('a[href="wedding.html"]').first().click();
      await page.waitForURL(base + 'wedding.html'); await ready(page);
      assert.equal(await page.locator('audio').evaluate(el => el.paused), true, 'Mute survives navigation');
      await page.reload(); await ready(page);
      assert.equal(await page.locator('audio').evaluate(el => el.paused), true, 'Mute survives reload');
      await page.locator('#music-toggle').click();
      await page.waitForFunction(() => {
        const audio = document.querySelector('audio');
        return !audio.paused && Number.isFinite(audio.duration) && audio.readyState >= 2;
      });
      await page.locator('audio').evaluate(el => { el.currentTime = el.duration - .2; });
      await page.waitForFunction(() => document.querySelector('audio').currentTime < 2);
      assert.equal(await page.locator('audio').evaluate(el => el.loop && !el.paused), true);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path:`/tmp/music-shell-${width}.png` });
      await page.close();
      console.log(`PASS ${width}px: continuous player, internal navigation, back/forward, mute/reload and loop`);
    }
    const blocked = await newPage();
    await blocked.addInitScript(() => {
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        if (this.tagName === 'AUDIO' && !navigator.userActivation.isActive) return Promise.reject(new DOMException('Blocked', 'NotAllowedError'));
        return play.call(this);
      };
    });
    await blocked.goto(base + 'reception.html'); await ready(blocked);
    assert.equal(await blocked.locator('#music-toggle').textContent(), 'Play music');
    await blocked.frameLocator('#invitation-frame').locator('#open-invitation').click();
    await blocked.waitForFunction(() => !document.querySelector('audio').paused);
    await blocked.close();
    console.log('PASS blocked autoplay: trusted frame tap starts music');
    const missing = await newPage();
    await missing.route('**/invitation-music.mp3', route => route.abort());
    await missing.goto(base); await ready(missing);
    await missing.waitForFunction(() => document.getElementById('music-toggle').disabled);
    assert.equal(await missing.frameLocator('#invitation-frame').locator('a[href="wedding.html"]').count(), 1);
    await missing.close();
    for (const suffix of ['wedding.html?standalone=1', 'reception.html?standalone=1']) {
      const page = await newPage(); await page.goto(base + suffix);
      assert.equal(await page.locator('#invitation-frame').count(), 0); await page.close();
    }
    const nojs = await newPage({ javaScriptEnabled:false }); await nojs.goto(base + 'wedding.html');
    assert.equal(await nojs.locator('.s-venue').isVisible(), true); await nojs.close();
    assert.deepEqual(errors, []);
    console.log('PASS audio-error, standalone print and no-JS fallbacks; no page errors');
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });