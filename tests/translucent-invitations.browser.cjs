// Optional Chromium integration checks; no external requests or services.
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const invitations = [
  { file:'wedding.html', surface:'.scroll-silk', pseudo:'::before', text:'.scroll-content', property:'backgroundImage' },
  { file:'reception.html', surface:'.invitation', pseudo:null, text:'.letter-time', property:'backgroundColor' }
];

(async () => {
  const browser = await chromium.launch({ headless:true });
  try {
    for (const invitation of invitations) {
      for (const width of [320, 390, 1440]) {
        const page = await browser.newPage({ viewport:{ width, height:900 }, reducedMotion:'reduce' });
        await page.route(/^https?:/, route => route.abort());
        await page.goto(pathToFileURL(path.resolve(__dirname, '..', invitation.file)).href);
        await page.locator(invitation.file === 'wedding.html' ? '#tie-cord' : '#open-invitation').click();
        const paint = () => page.locator(invitation.surface).evaluate((el, { pseudo, property }) =>
          getComputedStyle(el, pseudo)[property], invitation);
        assert.match(await paint(), /rgba\([^)]*, 0\.8[0-9]*\)/, 'Surface lets a little backdrop through');
        if (invitation.file === 'reception.html') {
          assert.equal(await paint(), 'rgba(247, 243, 233, 0.84)');
        } else {
          for (const selector of ['.wedding-celebration', '.wedding-footer']) {
            assert.deepEqual(await page.locator(selector).evaluate(el => {
              const style = getComputedStyle(el);
              return [style.backgroundColor, style.backgroundImage, style.opacity];
            }), ['rgba(0, 0, 0, 0)', 'none', '1'], 'Wedding summary has no background fill, without fading its text');
          }
        }
        assert.equal(await page.locator(invitation.surface).evaluate(el => getComputedStyle(el).opacity), '1');
        assert.equal(await page.locator(invitation.text).evaluate(el => getComputedStyle(el).opacity), '1', 'Text is not faded');
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        if (width !== 320) await page.screenshot({ path:`/tmp/translucent-${invitation.file}-${width}.png`, fullPage:true });
        const session = await page.context().newCDPSession(page);
        await session.send('Emulation.setEmulatedMedia', { features:[
          { name:'prefers-reduced-motion', value:'reduce' },
          { name:'prefers-reduced-transparency', value:'reduce' }
        ] });
        assert.ok(await page.evaluate(() => matchMedia('(prefers-reduced-transparency: reduce)').matches));
        assert.doesNotMatch(await paint(), /rgba\([^)]*, 0\.8[0-9]*\)/, 'Reduced transparency restores solid material');
        await session.detach();
        await page.emulateMedia({ media:'print' });
        assert.equal(await page.locator(invitation.surface).evaluate(el => getComputedStyle(el).backgroundColor),
          invitation.file === 'wedding.html' ? 'rgb(255, 255, 255)' : 'rgb(247, 243, 233)', 'Printed invitation stays opaque');
        await page.close();
        console.log(`PASS ${invitation.file} ${width}px: subtle surface, solid text, fit, reduced transparency and print`);
      }
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });