const assert = require('node:assert/strict');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = pathToFileURL(path.resolve(__dirname,'../index.html')).href;

(async () => {
  const browser = await chromium.launch({headless:true});
  const errors = [];
  try {
    for (const mode of ['copy','blocked','missing','native-failed','cancelled']) {
      const page = await browser.newPage({viewport:{width:320,height:568},reducedMotion:'reduce'});
      page.on('pageerror',error => errors.push(error.message));
      await page.addInitScript(mode => {
        const native = mode === 'native-failed' || mode === 'cancelled';
        Object.defineProperty(navigator,'share',{configurable:true,value:native ? async () => {throw new DOMException('Test',mode === 'cancelled' ? 'AbortError' : 'NotAllowedError');} : undefined});
        Object.defineProperty(navigator,'clipboard',{configurable:true,value:mode === 'missing' ? undefined : {writeText:async url => {
          if (mode !== 'copy') throw new DOMException('Test','NotAllowedError');
          window.copiedInvitation = url;
        }}});
      },mode);
      await page.goto(url);
      await page.locator('#share-landing').click();
      if (mode === 'cancelled') {
        assert.equal(await page.locator('#share-link-panel').isVisible(),false);
        assert.equal(await page.locator('#wed-toast').textContent(),'');
      } else if (mode === 'copy') {
        await page.waitForFunction(() => document.getElementById('wed-toast').textContent === 'Invitation link copied.');
        assert.equal(await page.evaluate(() => window.copiedInvitation),'https://shankar-prasad-k.github.io/ShaHaWeddingInvite/');
        assert.equal(await page.locator('#wed-toast').getAttribute('role'),'status');
      } else {
        await page.locator('#share-link-panel').waitFor({state:'visible'});
        assert.equal(await page.locator('#share-link-value').inputValue(),'https://shankar-prasad-k.github.io/ShaHaWeddingInvite/');
        assert.equal(await page.evaluate(() => document.activeElement.id),'share-link-value');
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await page.emulateMedia({media:'print'});
        assert.equal(await page.locator('#share-link-panel').isVisible(),false);
      }
      await page.close();
      console.log(`PASS sharing ${mode}: safe feedback and mobile fallback`);
    }
    assert.deepEqual(errors,[]);
  } finally {await browser.close();}
})().catch(error => {console.error(error);process.exitCode=1;});