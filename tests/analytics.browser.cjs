// Controlled browser integration: all requests are fulfilled locally or blocked.
// Never send synthetic visitors to the production GA4 property.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const base = 'https://invitation.test/ShaHaWeddingInvite/';
const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.jpg':'image/jpeg', '.png':'image/png', '.svg':'image/svg+xml' };

(async () => {
  const browser = await chromium.launch({ headless: true });
  const errors = [], coverage = [];
  const ready = page => page.waitForFunction(() => {
    const frame = document.querySelector('#invitation-frame');
    return frame?.contentDocument?.readyState === 'complete' && frame.contentDocument.location.pathname === location.pathname;
  });
  const events = page => page.evaluate(() => (window.dataLayer || []).filter(x => x[0] === 'event').map(x => ({ name: x[1], params: x[2] })));
  let googleLoads = 0;
  async function newPage(extra = {}) {
    const page = await browser.newPage({ viewport: { width:390, height:844 }, reducedMotion:'reduce', ...extra });
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', async route => {
      const url = route.request().url();
      if (url.startsWith('https://www.googletagmanager.com/gtag/js?id=G-78D63NNW7R')) {
        googleLoads++;
        return route.fulfill({ contentType:'text/javascript', body:'/* Google stub: commands inspected through dataLayer. */' });
      }
      if (!url.startsWith(base)) return route.abort();
      const relative = new URL(url).pathname.slice(new URL(base).pathname.length) || 'index.html';
      if (!/^(?:(?:index|wedding|reception|invite)\.html|(?:js|styles|assets)\/[\w/-]+\.(?:js|css|jpg|png|svg))$/.test(relative)) return route.abort();
      const file = path.join(root, relative);
      return fs.existsSync(file) ? route.fulfill({ contentType: mime[path.extname(file)], body: fs.readFileSync(file) }) : route.abort();
    });
    await page.coverage.startJSCoverage({ resetOnNavigation:false });
    return page;
  }
  async function close(page) { coverage.push(...await page.coverage.stopJSCoverage()); await page.close(); }
  try {
    const p = await newPage();
    await p.goto(base); await ready(p);
    await p.waitForFunction(() => document.querySelector('script[src*="googletagmanager"]'));
    assert.equal(await p.locator('#analytics-consent').isVisible(), false);
    assert.equal((await events(p)).filter(e=>e.name==='page_view').length, 1);
    assert.equal((await events(p))[0].params.invitation_page, 'landing');
    assert.equal(await p.evaluate(()=>localStorage.getItem('invitation-analytics-consent-v1')),null);
    await p.locator('#analytics-settings').click(); await p.locator('#analytics-close').click();
    assert.equal(await p.locator('#analytics-consent').isVisible(), false);
    await p.locator('#analytics-settings').click(); await p.locator('#analytics-decline').click();
    await p.waitForFunction(() => !window.dataLayer && document.querySelector('#analytics-settings'));
    await ready(p);
    const optedOutLoads = googleLoads;
    await p.frameLocator('iframe').locator('a[href="wedding.html"]').first().click(); await ready(p);
    assert.equal(googleLoads, optedOutLoads); assert.deepEqual(await events(p), []);
    await p.locator('#analytics-settings').click(); await p.locator('#analytics-accept').click();
    await p.waitForFunction(() => document.querySelector('script[src*="googletagmanager"]'));
    assert.equal((await events(p)).filter(e=>e.name==='page_view').length, 1);
    assert.equal((await events(p))[0].params.invitation_page, 'wedding');
    const config = await p.evaluate(() => Array.from(dataLayer.find(x=>x[0]==='config')));
    assert.equal(config[2].send_page_view, false); assert.equal(config[2].allow_google_signals, false);
    await p.frameLocator('iframe').locator('#tie-cord').click();
    await p.waitForFunction(() => dataLayer.some(x=>x[1]==='invitation_open'));
    const doc = p.frameLocator('iframe');
    await doc.locator('body').evaluate(() => document.addEventListener('click', e=>{ if(e.target.closest('a[href^="https://share.google/"]')) e.preventDefault(); }));
    await doc.locator('a[href="https://share.google/5LpDdYQeVHZ9qTApS"]').last().click();
    await doc.locator('body').evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await p.waitForFunction(() => dataLayer.some(x=>x[1]==='scroll_depth'));
    await doc.locator('a[href="reception.html"]').first().click(); await ready(p);
    await p.frameLocator('iframe').locator('#open-invitation').click();
    await p.frameLocator('iframe').locator('#close-invitation').click();
    await p.waitForFunction(() => dataLayer.some(x=>x[1]==='invitation_close'));
    await p.frameLocator('iframe').locator('a[href="index.html"]').first().click(); await ready(p);
    await p.frameLocator('iframe').locator('body').evaluate(() => Object.defineProperty(navigator,'share',{ configurable:true, value:async()=>{} }));
    await p.frameLocator('iframe').locator('#share-landing').click();
    await p.frameLocator('iframe').locator('#calendar-wedding').click();
    // Media is blocked in this test; make the control clickable to test action routing.
    await p.locator('#music-toggle').evaluate(el => { el.disabled = false; });
    await p.locator('#music-toggle').click();
    await p.frameLocator('iframe').locator('#motion-toggle').evaluate(el=>{el.hidden=false;el.disabled=false;});
    await p.frameLocator('iframe').locator('#motion-toggle').focus();
    await p.frameLocator('iframe').locator('#motion-toggle').press('Enter');
    const recorded = await events(p);
    for (const name of ['navigation_click','map_click','calendar_click','share_click','invitation_open','invitation_close','scroll_depth','music_toggle','motion_toggle']) assert.ok(recorded.some(e=>e.name===name), name);
    assert.deepEqual(recorded.filter(e=>e.name==='page_view').map(e=>e.params.invitation_page), ['wedding','reception','landing']);
    await p.goBack(); await ready(p);
    assert.deepEqual((await events(p)).filter(e=>e.name==='page_view').map(e=>e.params.invitation_page), ['wedding','reception','landing','reception']);
    assert.equal(await p.frameLocator('iframe').locator('script[src*="googletagmanager"]').count(),0);
    await p.reload(); await ready(p);
    assert.equal((await events(p)).filter(e=>e.name==='page_view').length,1);
    await p.evaluate(() => { document.cookie='_ga=test; Path=/ShaHaWeddingInvite/; Secure'; });
    await p.locator('#analytics-settings').click(); await p.locator('#analytics-decline').click(); await ready(p);
    await p.waitForFunction(() => !window.dataLayer);
    assert.equal(await p.evaluate(()=>document.cookie.includes('_ga=')),false);
    assert.equal(await p.locator('#analytics-consent').isVisible(),false);
    const before = googleLoads;
    await p.reload(); await ready(p); assert.equal(googleLoads,before);
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await close(p);
    console.log('PASS automatic tracking without prompt, opt-out/cookies, saved preference, all events, history deduplication and mobile width');

    const q = await newPage();
    await q.addInitScript(() => {
      Object.defineProperty(window,'localStorage',{ get(){throw Error('Unavailable');} });
    });
    await q.goto(base+'reception.html?email=private@example.test#private'); await ready(q);
    assert.equal(await q.locator('#analytics-consent').isVisible(),false);
    assert.ok((await events(q)).every(e=>!JSON.stringify(e).includes('private')));
    assert.equal((await events(q))[0].params.page_location,base+'reception.html');
    await q.locator('#analytics-settings').click(); await q.locator('#analytics-decline').click();
    assert.equal(await q.evaluate(()=>window['ga-disable-G-78D63NNW7R']),true);
    const eventCount=(await events(q)).length;
    await q.frameLocator('iframe').locator('a[href="index.html"]').first().click(); await ready(q);
    assert.equal((await events(q)).length,eventCount);
    await q.locator('#analytics-settings').click(); await q.locator('#analytics-accept').click();
    assert.equal(await q.evaluate(()=>window['ga-disable-G-78D63NNW7R']),false);
    assert.equal(await q.locator('#invitation-google-tag').count(),1);
    await close(q);

    const prior = await newPage();
    await prior.addInitScript(() => localStorage.setItem('invitation-analytics-consent-v1','declined'));
    const priorLoads = googleLoads;
    await prior.goto(base); await ready(prior);
    assert.equal(googleLoads,priorLoads); assert.deepEqual(await events(prior),[]);
    assert.equal(await prior.locator('#analytics-consent').isVisible(),false);
    await close(prior);
    console.log('PASS storage unavailable and query/hash redaction; no actual Google requests');
    assert.deepEqual(errors, []);
    // Browser adapters are not included in Node coverage; measure this adapter separately.
    const entries=coverage.filter(e=>e.url.endsWith('/js/analytics-shell.js'));
    const source=fs.readFileSync(path.join(root,'js/analytics-shell.js'),'utf8'), covered=new Uint8Array(source.length);
    for (const entry of entries) {
      const executed = new Uint8Array(source.length);
      // Playwright returns raw V8 coverage: narrower block ranges override their parents.
      const ranges = entry.functions.flatMap(fn => fn.ranges)
        .sort((a,b) => (b.endOffset-b.startOffset)-(a.endOffset-a.startOffset));
      for (const range of ranges) executed.fill(range.count > 0 ? 1 : 0, range.startOffset, range.endOffset);
      for (let i=0; i<covered.length; i++) covered[i] |= executed[i];
    }
    const percent=100*covered.reduce((a,b)=>a+b,0)/source.length;
    console.log(`Analytics browser adapter executed-byte coverage: ${percent.toFixed(2)}%`);
    assert.ok(percent>=80,'Browser adapter coverage must reach 80%');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});