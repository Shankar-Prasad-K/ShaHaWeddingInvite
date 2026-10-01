// Optional local integration check; unit tests remain browser- and IO-free.
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = pathToFileURL(path.resolve(__dirname, '../index.html')).href;

async function changingTransform(page, selector) {
  const transforms = await page.locator(selector).first().evaluate(el => {
    const animation = el.getAnimations()[0];
    const originalTime = animation.currentTime;
    const { duration, delay } = animation.effect.getTiming();
    animation.currentTime = delay + duration * .43;
    const first = getComputedStyle(el).transform;
    animation.currentTime = delay + duration * .53;
    const second = getComputedStyle(el).transform;
    animation.currentTime = originalTime;
    return [first, second];
  });
  assert.notEqual(...transforms, `${selector} should visibly deform, not just translate with its parent`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  try {
    for (const [width, height] of [[280, 653], [320, 568], [390, 844], [600, 960], [768, 1024], [1440, 900]]) {
      const page = await browser.newPage({ viewport: { width, height } });
      page.on('pageerror', error => errors.push(error.message));
      await page.clock.install({ time: new Date('2026-10-01T12:00:00Z') });
      await page.goto(url);
      await page.evaluate(() => document.fonts.ready);
      const arch = page.locator('.courtyard-photo img');
      assert.equal(await arch.count(), 1, 'video has a matching still fallback');
      assert.ok(await arch.evaluate(img => img.complete && img.naturalWidth > 0), 'poster loads');
      assert.match(await arch.getAttribute('src'), /landing-golden-arches-poster\.jpg$/);
      const video = page.locator('#background-video');
      assert.equal(await video.getAttribute('data-src'), 'assets/landing-golden-arches.mp4');
      await page.waitForFunction(() => {
        const video = document.getElementById('background-video');
        return !video.hidden && !video.paused && video.currentTime > 0;
      });
      assert.ok(await video.evaluate(el => el.muted && el.loop && el.playsInline));
      assert.equal(await video.evaluate(el => getComputedStyle(el).objectFit), 'cover');
      assert.ok(await video.evaluate(el => el.clientWidth === innerWidth && el.clientHeight === innerHeight));
      const timer = await page.locator('#countdown').boundingBox();
      const names = await page.locator('h1').boundingBox();
      if (width <= 600) {
        const photo = await page.locator('.courtyard-photo').boundingBox();
        assert.ok(Math.abs(photo.width - width) < 1, 'mobile scenery fits the screen width');
        assert.ok(Math.abs(photo.height - height) < 1, 'mobile scenery fills the entire viewport');
        assert.equal(await page.locator('.courtyard').evaluate(el => getComputedStyle(el).position), 'fixed', 'temple remains behind the invitation while scrolling');
        assert.ok(await arch.evaluate(img => img.getBoundingClientRect().width >= innerWidth && img.getBoundingClientRect().height >= innerHeight - 1), 'upright arch covers the viewport');
        assert.equal(await page.locator('.courtyard-photo').evaluate(el => getComputedStyle(el).animationName), 'none', 'mobile scenery has no additional zoom');
      }
      assert.ok(timer.y + timer.height <= names.y, 'timer precedes the names');
      assert.ok(timer.y + timer.height < height, 'timer fits in first screen');
      const before = await page.locator('#cd-secs').textContent();
      await page.clock.runFor(1000);
      assert.notEqual(await page.locator('#cd-secs').textContent(), before, 'seconds tick');
      assert.equal(await page.locator('.sky-bird').count(), 2);
      assert.equal(await page.locator('.bird-wing').count(), 4);
      assert.equal(await page.locator('.lamp-flame').count(), 2);
      assert.ok(await page.locator('.sky-bird').evaluateAll(birds => birds.every(bird => bird.getBoundingClientRect().width <= 23)), 'birds read as distant');
      const wingTiming = await page.locator('.bird-wing-left').evaluateAll(wings => wings.map(wing => [getComputedStyle(wing).animationDuration, getComputedStyle(wing).animationDelay]));
      assert.deepEqual(wingTiming[0], wingTiming[1], 'birds flap together');
      assert.ok(await page.locator('.temple-lamp').evaluateAll(lamps => lamps.every(lamp => lamp.clientWidth <= 132)), 'lamps stay slender');
      assert.ok(await page.locator('.temple-lamp').evaluateAll(lamps => lamps.every(lamp => Math.abs(lamp.clientWidth - lamp.querySelector('img').clientWidth) <= 1)), 'lamp artwork fills its flame coordinate system');
      for (const selector of ['.bird-wing-left', '.bird-wing-right', '.flame-body']) {
        await changingTransform(page, selector);
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.ok(await page.locator('img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0)));
      await page.locator('#motion-toggle').click();
      assert.equal(await video.evaluate(el => el.paused), true, 'motion control pauses video');
      if (width <= 600) {
        const photo = await page.locator('.courtyard-photo').boundingBox();
        assert.ok(Math.abs(photo.y) < 1 && Math.abs(photo.height - height) < 1, 'scenery still fills the screen at the footer');
        await page.screenshot({ path: `/tmp/courtyard-scroll-${width}.png` });
      }
      await page.clock.runFor(1000);
      assert.ok(await page.evaluate(() => document.getAnimations().every(a => a.playState === 'paused' || a.playState === 'finished')));
      const pausedSeconds = await page.locator('#cd-secs').textContent();
      await page.clock.runFor(1000);
      assert.notEqual(await page.locator('#cd-secs').textContent(), pausedSeconds, 'ambient pause does not stop countdown');
      await page.locator('#motion-toggle').click();
      await page.waitForFunction(() => !document.getElementById('background-video').paused);
      await page.locator('#motion-toggle').click();
      await page.locator('#motion-toggle').blur();
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: `/tmp/courtyard-wind-${width}.png`, fullPage: true });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForFunction(() => document.getElementById('motion-toggle').disabled);
      assert.ok(await video.evaluate(el => el.paused && el.hidden), 'reduced motion uses still fallback');
      assert.equal(await page.locator('.flame-body').first().evaluate(el => getComputedStyle(el).animationName), 'none');
      assert.equal(await page.locator('.sky-birds').isVisible(), false);
      await page.close();
      console.log(`PASS ${width}: ticking timer, distant synchronized birds, slender single-flame lamps, pause/reduced motion and layout`);
    }
    const nojs = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 320, height: 568 } });
    await nojs.goto(url);
    assert.equal(await nojs.locator('#countdown').isVisible(), false);
    assert.equal(await nojs.locator('.reception-portal').isVisible(), true);
    assert.equal(await nojs.locator('.flame-body').first().evaluate(el => getComputedStyle(el).animationPlayState), 'paused');
    assert.equal(await nojs.locator('#background-video').getAttribute('src'), null, 'no-JS does not download video');
    await nojs.close();
    const reduced = await browser.newPage({ reducedMotion: 'reduce' });
    await reduced.goto(url);
    assert.equal(await reduced.locator('#background-video').getAttribute('src'), null, 'initial reduced motion does not download video');
    await reduced.close();
    const blocked = await browser.newPage();
    blocked.on('pageerror', error => errors.push(error.message));
    await blocked.addInitScript(() => {
      HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException('Blocked', 'NotAllowedError'));
    });
    await blocked.goto(url);
    assert.equal(await blocked.locator('#background-video').isVisible(), false);
    assert.equal(await blocked.locator('.courtyard-photo img').isVisible(), true);
    assert.equal(await blocked.locator('.wedding-portal').isVisible(), true);
    await blocked.close();
    assert.deepEqual(errors, []);
    console.log('PASS no-JavaScript fallback and no browser errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });