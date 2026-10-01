// Optional IO-based Chromium checks; unit tests remain hermetic.
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { assertSecondaryNavigation } = require('./invitation-browser-helpers.cjs');
const url = pathToFileURL(path.resolve(__dirname, '../reception.html')).href;

async function assertBackdrop(page) {
  assert.ok(await page.locator('.night-sky').evaluate(el => {
    const bounds = el.getBoundingClientRect();
    return getComputedStyle(el).position === 'fixed' && bounds.y === 0 &&
      bounds.width === innerWidth && bounds.height === innerHeight;
  }), 'background covers viewport at every scroll position');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no overflow');
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  try {
    for (const width of [320, 390, 768, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(url);
      await page.evaluate(() => document.fonts.ready);
      await assertSecondaryNavigation(page);
      await page.waitForFunction(() => {
        const video = document.getElementById('reception-video');
        return !video.hidden && !video.paused && video.currentTime > 0;
      });
      const video = page.locator('#reception-video');
      assert.ok(await video.evaluate(el => el.muted && el.loop && el.playsInline && getComputedStyle(el).objectFit === 'cover'));
      assert.ok(await page.locator('img').evaluateAll(images => images.every(el => el.complete && el.naturalWidth > 0)));
      await assertBackdrop(page);
      await page.locator('#open-invitation').focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.activeElement.id === 'invitation-heading');
      assert.equal(await page.locator('.letter-time').textContent(), '6:30 PM onwards');
      assert.equal(await page.locator('.letter-map').getAttribute('href'), 'https://share.google/MLjErDc9WtHHSo3wP');
      await assertBackdrop(page);
      await page.locator('#motion-toggle').click();
      assert.ok(await video.evaluate(el => el.paused && !el.hidden));
      assert.equal(await page.locator('.botanical-left').evaluate(el => getComputedStyle(el).animationPlayState), 'paused');
      await assertBackdrop(page);
      await page.screenshot({ path: `/tmp/reception-video-footer-${width}.png` });
      await page.locator('#motion-toggle').click();
      await page.waitForFunction(() => !document.getElementById('reception-video').paused);
      await page.locator('#close-invitation').click();
      assert.equal(await page.evaluate(() => document.activeElement.id), 'open-invitation');
      await page.keyboard.press('Space');
      await page.waitForFunction(() => document.activeElement.id === 'invitation-heading');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForFunction(() => document.getElementById('motion-toggle').disabled);
      assert.ok(await video.evaluate(el => el.paused && el.hidden));
      await page.locator('#close-invitation').click();
      await page.emulateMedia({ media: 'print' });
      assert.equal(await page.locator('#invitation').isVisible(), true);
      assert.equal(await page.locator('.night-sky').isVisible(), false);
      await page.close();
      console.log(`PASS ${width}: video, keyboard reveal/replay, stationery, full-screen scrolling, pause, reduced motion and print`);
    }
    for (const mode of ['nojs', 'reduced', 'blocked', 'error']) {
      const page = await browser.newPage({ javaScriptEnabled: mode !== 'nojs', reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference' });
      page.on('pageerror', error => errors.push(error.message));
      if (mode === 'blocked') await page.addInitScript(() => {
        HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException('Blocked', 'NotAllowedError'));
      });
      await page.goto(url);
      if (mode === 'error') {
        await page.waitForFunction(() => !document.getElementById('reception-video').hidden);
        await page.locator('#reception-video').evaluate(el => el.dispatchEvent(new Event('error')));
      }
      assert.equal(await page.locator('#reception-video').isVisible(), false);
      assert.ok(await page.locator('.night-sky > img').evaluate(el => el.complete && el.naturalWidth > 0));
      if (mode === 'nojs' || mode === 'reduced') assert.equal(await page.locator('#reception-video').getAttribute('src'), null);
      if (mode === 'nojs') assert.equal(await page.locator('#invitation').isVisible(), true);
      await page.close();
      console.log(`PASS ${mode}: still fallback and readable invitation`);
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });