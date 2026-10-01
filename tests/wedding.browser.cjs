const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { assertSecondaryNavigation } = require('./invitation-browser-helpers.cjs');
const url = pathToFileURL(path.resolve(__dirname, '../wedding.html')).href;

async function assertWeddingSummary(page) {
  const summary = page.locator('#wedding-celebration');
  assert.equal(await summary.count(), 1, 'One wedding summary outside the scroll');
  assert.equal(await summary.isVisible(), true, 'Details available without opening the scroll');
  for (const [key, value] of Object.entries({
    dateDisplay:'Friday, 20th November 2026', timeDisplay:'6:00 AM – 7:30 AM',
    venueName:'Sri Aadhi Sivalayam · Murugan Sannidhanam'
  })) assert.equal(await summary.locator(`[data-cfg="wedding.${key}"]`).textContent(), value);
  const links = page.locator('[data-cfg="wedding.mapLink"]');
  assert.equal(await links.count(), 2);
  for (const link of await links.all()) {
    assert.equal(await link.getAttribute('href'), 'https://share.google/n43wNhqH8ZwYTdRaE');
    assert.equal(await link.getAttribute('target'), '_blank');
    assert.match(await link.getAttribute('rel'), /noopener/);
  }
  assert.ok(await summary.evaluate(el => !el.closest('#scroll-body') && el.scrollWidth <= el.clientWidth));
  assert.equal(await page.locator('.wedding-footer .invitation-navigation a').getAttribute('href'), 'reception.html');
}

(async () => {
  const browser = await chromium.launch({ headless:true });
  const errors = [];
  const openPage = async options => {
    const page = await browser.newPage(options);
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(url); await page.evaluate(() => document.fonts.ready);
    return page;
  };
  try {
    for (const width of [320, 390, 768, 1440]) {
      const page = await openPage({ viewport:{ width, height:900 } });
      await assertSecondaryNavigation(page);
      await assertWeddingSummary(page);
      const cord = page.locator('#tie-cord');
      assert.equal(await page.locator('.royal-side-frame').count(), 0, 'Video architecture replaces separate pillar overlays');
      const video = page.locator('#wedding-background-video');
      assert.equal(await video.getAttribute('data-src'), 'assets/wedding-temple-bells.mp4');
      assert.equal(await video.getAttribute('poster'), 'assets/wedding-temple-bells-poster.jpg');
      await page.evaluate(async () => {
        const poster = new Image(); poster.src = document.getElementById('wedding-background-video').poster;
        await poster.decode();
      });
      await page.waitForFunction(() => {
        const v = document.getElementById('wedding-background-video'); return !v.hidden && !v.paused && v.currentTime > 0;
      });
      assert.equal(await video.evaluate(el => el.muted && el.loop && el.playsInline), true);
      assert.equal(await video.evaluate(el => getComputedStyle(el).objectFit), 'cover');
      await page.locator('#wedding-video-toggle').click();
      assert.equal(await video.evaluate(el => el.paused), true);
      await page.locator('#wedding-video-toggle').click();
      assert.equal(await cord.evaluate(el => el.tagName), 'BUTTON');
      assert.equal(await page.locator('.finial-lotus').count(), 4, 'Four engraved lotus finial caps');
      assert.equal(await page.locator('.tassel-strand').count(), 52, 'Each finial has thirteen detailed tassel strands');
      assert.equal(await page.locator('.finial-slot stop').nth(2).evaluate(el => getComputedStyle(el).stopColor), 'rgb(230, 188, 145)', 'Finial highlight is warm bronze, not yellow gold');
      assert.match(await page.locator('.rod-top').evaluate(el => getComputedStyle(el).backgroundImage), /142, 86, 53/, 'Rod uses the bronze body tone');
      assert.match(await page.locator('.scroll-silk').evaluate(el => getComputedStyle(el, '::after').backgroundImage), /wedding-temple-border/);
      assert.match(await page.locator('.s-om').evaluate(el => getComputedStyle(el).backgroundImage), /wedding-lotus-medallion/);
      assert.match(await page.locator('.s-div').first().evaluate(el => getComputedStyle(el).backgroundImage), /wedding-lotus-divider/);
      await page.evaluate(async () => {
        await Promise.all(['temple-border', 'lotus-medallion', 'lotus-divider'].map(async name => {
          const image = new Image(); image.src = `assets/patterns/wedding-${name}.svg`; await image.decode();
        }));
      });
      assert.equal(await page.locator('.charm-initial').allTextContents().then(values => values.join('')), 'HS');
      assert.equal(await page.locator('.charm-shine').count(), 2);
      assert.equal(await page.locator('#braid-bronze stop').nth(1).evaluate(el => getComputedStyle(el).stopColor), 'rgb(238, 210, 182)');
      assert.equal(await page.locator('.charm-shine').first().evaluate(el => getComputedStyle(el).animationIterationCount), '1', 'Finite initial shine, not endless flashing');
      assert.match(await page.locator('.scroll-brocade').evaluate(el => getComputedStyle(el).backgroundImage), /wedding-gold-buta\.svg/);
      for (const slot of await page.locator('.finial-slot').all()) {
        const bounds = await slot.boundingBox();
        assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width, 'Detailed hangings remain within the viewport');
      }
      await page.evaluate(async () => {
        const pattern = new Image(); pattern.src = 'assets/patterns/wedding-gold-buta.svg'; await pattern.decode();
      });
      assert.equal(await page.locator('#scroll-body').evaluate(el => el.inert), true);
      assert.ok((await page.locator('#scroll-body').boundingBox()).height < 1, 'Starts fully closed, without an initial collapse animation');
      // The motion control now lives below the guest details; return to the tie before dragging.
      await cord.scrollIntoViewIfNeeded();
      if (width === 390 || width === 1440) await page.screenshot({ path:`/tmp/wedding-tie-closed-${width}.png`, fullPage:true });
      const box = await cord.boundingBox();
      const x = box.x + box.width / 2, y = box.y + 140;
      await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x, y + 25, { steps:5 }); await page.mouse.up();
      assert.equal(await cord.getAttribute('aria-expanded'), 'false', 'Short pull must not open');
      await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x, y + 70, { steps:8 });
      assert.ok(parseFloat(await cord.evaluate(el => el.style.getPropertyValue('--pull'))) > 25);
      if (width === 390) await page.screenshot({ path:'/tmp/wedding-tie-tension.png' });
      await page.mouse.up();
      await page.waitForFunction(() => document.getElementById('scroll-body').classList.contains('open'));
      const frames = await page.evaluate(() => {
        const animations = document.getAnimations().filter(a =>
          ['scroll-body', 'scroll-roll'].includes(a.effect.target.id));
        const saved = animations.map(a => a.currentTime);
        animations.forEach(a => a.pause());
        const box = selector => {
          const r = document.querySelector(selector).getBoundingClientRect();
          return { y:r.y, height:r.height, bottom:r.bottom };
        };
        const samples = [0, .2, .5, .8, 1].map(fraction => {
          animations.forEach(a => { a.currentTime = Number(a.effect.getTiming().duration) * fraction; });
          const panel = document.getElementById('scroll-body').getBoundingClientRect();
          const edgeY = panel.bottom - 4;
          const edgePainted = panel.height < 4 || edgeY >= innerHeight ||
            document.querySelector('.scroll-silk').contains(document.elementFromPoint(panel.x + panel.width / 2, edgeY));
          return { top:box('.rod-top'), panel:box('#scroll-body'), roll:box('#scroll-roll'),
            silk:box('.scroll-silk'), edgePainted,
            texture:getComputedStyle(document.getElementById('scroll-roll'), '::before').backgroundPosition };
        });
        animations.forEach((a, i) => { a.currentTime = saved[i]; a.play(); });
        return samples;
      });
      for (const frame of frames) {
        assert.ok(Math.abs(frame.top.y - frames[0].top.y) < 1, 'Top rod stays anchored during downward unrolling');
        assert.ok(Math.abs(frame.silk.y - frames[0].silk.y) < 1, 'Text stays stationary rather than sliding or stretching');
        assert.ok(Math.abs(frame.roll.y - frame.panel.bottom) < 1, 'Cylinder tracks the revealing edge');
        assert.ok(frame.edgePainted, 'Revealed silk meets the cylinder without an empty gap');
        assert.ok(frame.roll.height >= 27, 'A rounded silk curl remains visible, never flattening to zero');
      }
      assert.ok(frames[1].panel.height < frames[4].panel.height * .35, 'Opening starts gradually, not almost fully revealed');
      assert.ok(frames[2].panel.height > frames[1].panel.height && frames[3].panel.height > frames[2].panel.height);
      assert.notEqual(frames[1].texture, frames[2].texture, 'Silk texture visibly winds around the cylinder');
      await page.waitForFunction(() => document.activeElement.id === 'wedding-heading');
      assert.equal(await cord.getAttribute('aria-expanded'), 'true');
      assert.equal(await page.locator('#scroll-body').evaluate(el => el.inert), false);
      assert.ok((await page.locator('.s-om').boundingBox()).y >= 0, 'Om remains visible after focus moves into the invitation');
      const omOffset = await page.locator('.om-glyph').evaluate(el => {
        const s = getComputedStyle(el), box = el.getBoundingClientRect(), ring = el.parentElement.getBoundingClientRect();
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.font = `${s.fontSize} ${s.fontFamily}`;
        const m = ctx.measureText(el.textContent);
        const baseline = box.y + (box.height - m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2 + m.fontBoundingBoxAscent;
        return { x:box.x + (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2 - (ring.x + ring.width / 2),
          y:baseline + (m.actualBoundingBoxDescent - m.actualBoundingBoxAscent) / 2 - (ring.y + ring.height / 2) };
      });
      assert.ok(Math.abs(omOffset.x) < 1.5 && Math.abs(omOffset.y) < 1.5, `Om ink centered within lotus ring: ${JSON.stringify(omOffset)}`);
      assert.equal(await page.locator('.petal').count(), width < 600 ? 24 : 36);
      const content = await page.locator('.scroll-content').innerText();
      for (const removed of ['ஸ்ரீ பச்சையம்மன்', 'Wedding Invitation', 'cordially solicit', 'Selvan', 'Selvi', 'Deloitte', 'eClerx']) assert.ok(!content.includes(removed));
      assert.match(content, /S\/o Mrs\. Devi Kumaravel & Mr\. V\. Kumaravel/);
      assert.match(content, /D\/o Mrs\. V\. Shanthi & Mr\. V\. Venkatesh \(Late\)/);
      assert.match(content, /6:00 AM – 7:30 AM/);
      assert.match(content, /Friday, 20th November 2026/);
      await assertWeddingSummary(page);
      assert.ok(await page.locator('.s-parents small').evaluate(el => parseFloat(getComputedStyle(el).fontSize) < parseFloat(getComputedStyle(el.parentElement).fontSize) * .7));
      assert.notEqual(await page.locator('.s-om').evaluate(el => getComputedStyle(el).color), 'rgba(0, 0, 0, 0)');
      assert.ok(await page.locator('.scroll-content').evaluate(el => el.scrollWidth <= el.clientWidth), 'Content must fit without clipping');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.waitForFunction(() => !document.getElementById('petal-layer'));
      if (width === 390 || width === 1440) await page.screenshot({ path:`/tmp/wedding-tie-open-${width}.png`, fullPage:true });
      await page.close(); console.log('PASS', width, 'drag, short pull, copy, Om, content bounds, petals and cleanup');
    }
    for (const key of ['Enter', 'Space']) {
      const page = await openPage({ reducedMotion:'reduce', viewport:{ width:390, height:844 } });
      assert.equal(await page.locator('#wedding-background-video').getAttribute('src'), null);
      assert.equal(await page.locator('#wedding-video-toggle').isDisabled(), true);
      assert.equal(await page.locator('.charm-shine').first().evaluate(el => getComputedStyle(el).animationName), 'none');
      assert.equal(await page.locator('.charm-shine').first().evaluate(el => getComputedStyle(el).opacity), '0');
      await page.locator('#tie-cord').focus(); await page.keyboard.press(key);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'wedding-heading');
      assert.equal(await page.locator('.petal').count(), 0);
      await page.close();
    }
    const live = await openPage({ viewport:{ width:390, height:844 } });
    await live.locator('#tie-cord').click();
    await live.emulateMedia({ reducedMotion:'reduce' });
    await live.waitForFunction(() => document.activeElement.id === 'wedding-heading');
    assert.equal(await live.locator('.petal').count(), 0);
    assert.equal(await live.locator('#wedding-background-video').evaluate(el => el.paused && el.hidden), true);
    await live.close();
    for (const failure of ['autoplay', 'media']) {
      const page = await browser.newPage({ viewport:{ width:390, height:844 } });
      page.on('pageerror', e => errors.push(e.message));
      if (failure === 'autoplay') await page.addInitScript(() => {
        HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException('Blocked', 'NotAllowedError'));
      });
      await page.goto(url);
      if (failure === 'media') await page.locator('#wedding-background-video').evaluate(el => el.dispatchEvent(new Event('error')));
      await page.waitForFunction(() => document.getElementById('wedding-background-video').hidden);
      assert.match(await page.locator('.wedding-backdrop').evaluate(el => getComputedStyle(el).backgroundImage), /wedding-temple-bells-poster/);
      await page.locator('#tie-cord').click();
      await page.waitForFunction(() => document.activeElement.id === 'wedding-heading');
      await page.close();
    }
    const touch = await openPage({ hasTouch:true, isMobile:true, viewport:{ width:390, height:844 } });
    const touchCord = await touch.locator('#tie-cord').boundingBox();
    const session = await touch.context().newCDPSession(touch);
    const tx = touchCord.x + 140, ty = touchCord.y + 160;
    const touchPoint = y => [{ x:tx, y, id:1 }];
    await session.send('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:touchPoint(ty) });
    await session.send('Input.dispatchTouchEvent', { type:'touchMove', touchPoints:touchPoint(ty + 25) });
    await session.send('Input.dispatchTouchEvent', { type:'touchCancel', touchPoints:[] });
    assert.equal(await touch.locator('#tie-cord').getAttribute('aria-expanded'), 'false');
    await session.send('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:touchPoint(ty) });
    await session.send('Input.dispatchTouchEvent', { type:'touchMove', touchPoints:touchPoint(ty + 70) });
    await session.send('Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] });
    await touch.waitForFunction(() => document.activeElement.id === 'wedding-heading');
    assert.equal(await touch.locator('.petal').count(), 24);
    await touch.locator('.petal').first().evaluate(el => {
      for (const petal of document.querySelectorAll('.petal')) {
        for (const animation of petal.getAnimations({ subtree:true })) { animation.pause(); animation.currentTime = 1600; }
      }
    });
    await touch.screenshot({ path:'/tmp/wedding-gold-petals.png' });
    await touch.close();
    const print = await openPage({ viewport:{ width:390, height:844 } });
    await print.emulateMedia({ media:'print' });
    assert.equal(await print.locator('.wedding-backdrop').isVisible(), false);
    assert.equal(await print.locator('#wedding-video-toggle').isVisible(), false);
    assert.equal(await print.locator('.s-venue').isVisible(), true);
    assert.equal(await print.locator('#wedding-celebration').isVisible(), false);
    assert.equal(await print.locator('.wedding-footer').isVisible(), false);
    await print.close();
    const nojs = await openPage({ javaScriptEnabled:false, viewport:{ width:390, height:844 } });
    await assertWeddingSummary(nojs);
    assert.equal(await nojs.locator('.s-venue').isVisible(), true);
    assert.equal(await nojs.locator('#tie-cord').isVisible(), false);
    assert.equal(await nojs.locator('.js-action').count(), 0);
    assert.equal(await nojs.locator('#wedding-video-toggle').isVisible(), false);
    assert.equal(await nojs.locator('#wedding-background-video').getAttribute('src'), null);
    assert.match(await nojs.locator('.wedding-backdrop').evaluate(el => getComputedStyle(el).backgroundImage), /wedding-temple-bells-poster/);
    await nojs.close();
    assert.deepEqual(errors, []);
    console.log('PASS touch drag/cancel, keyboard, reduced motion, live preference, print, no-JS and no browser errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });