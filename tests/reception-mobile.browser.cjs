// Local-file integration checks: no server exposes private source images.
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = pathToFileURL(path.resolve(__dirname, '../reception.html')).href;

async function checkClosed(page, width, height) {
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 0); });
  const garden = await page.locator('.garden').boundingBox();
  assert.ok(garden.y + garden.height <= height + 1, `closed hero fits ${width}×${height}: bottom=${garden.y + garden.height}`);
  for (const selector of ['.canopy-bough', '.botanical', '.envelope', '.open-caption', '.scroll-cue']) {
    for (const element of await page.locator(selector).all()) {
      const bounds = await element.boundingBox();
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width, `${selector} fits width at ${width}`);
      assert.ok(bounds.y >= garden.y && bounds.y + bounds.height <= height + 1, `${selector} fits hero height`);
    }
  }
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
}

(async () => {
  const browser = await chromium.launch({ headless:true });
  const errors = [];
  try {
    for (const [width, height] of [[320,568], [360,640], [390,844], [430,932], [600,960]]) {
      const page = await browser.newPage({ viewport:{width,height} });
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(url);
      await page.evaluate(() => document.fonts.ready);
      for (const progress of [0, .4, .72, 1]) {
        await page.locator('.botanical').evaluateAll((elements, progress) => {
          for (const element of elements) for (const animation of element.getAnimations()) {
            const { delay, duration } = animation.effect.getTiming();
            animation.currentTime = delay + duration * progress;
          }
        }, progress);
        await checkClosed(page, width, height);
      }
      await page.screenshot({path:`/tmp/reception-mobile-fit-${width}.png`});
      await page.locator('#open-invitation').click();
      await page.waitForFunction(() => document.activeElement.id === 'invitation-heading');
      assert.ok(await page.locator('#invitation').evaluate(el => el.scrollWidth <= el.clientWidth));
      await page.locator('#close-invitation').click();
      await checkClosed(page, width, height);
      await page.emulateMedia({ reducedMotion:'reduce' });
      await checkClosed(page, width, height);
      await page.close();
      console.log(`PASS ${width}×${height}: complete closed hero, unclipped artwork, opening and replay`);
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });