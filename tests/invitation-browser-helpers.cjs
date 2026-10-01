const assert = require('node:assert/strict');

async function assertDrawnArrows(page) {
  assert.equal(await page.locator('body').evaluate(el => el.textContent.includes('↗')), false, 'diagonal arrows must not depend on emoji fonts');
  const arrows = page.locator('svg.direction-arrow');
  assert.ok(await arrows.count() > 0);
  assert.ok(await arrows.evaluateAll(elements => elements.every(el => {
    const style = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    return el.getAttribute('aria-hidden') === 'true' && style.stroke === style.color && (!el.getClientRects().length || (box.width >= 12 && box.height >= 12));
  })), 'decorative vector arrows inherit the link color');
}

async function assertSecondaryNavigation(page) {
  await assertDrawnArrows(page);
  const back = page.locator('.invitation-back');
  assert.equal((await back.textContent()).trim(), '← The beginning');
  assert.equal(await back.getAttribute('href'), 'index.html');
  assert.ok((await back.boundingBox()).height >= 44, 'back link has a touch-sized target');
  assert.equal(await back.evaluate(el => getComputedStyle(el).position), 'static');
  assert.equal(await page.locator('[id^="rsvp-"], [id^="calendar-"], [id^="share-"], a[href*="wa.me"], [onclick*="Calendar"], [onclick*="shareInvite"]').count(), 0, 'guest actions appear only on landing');
  assert.equal(await page.locator('.invitation-navigation a[href="index.html#guest-actions"]').count(), 0);
  await back.focus();
  assert.equal(await back.evaluate(el => el.matches(':focus-visible')), true);
}

async function assertLandingActions(page) {
  await assertDrawnArrows(page);
  assert.equal(await page.locator('[id^="rsvp-"], a[href*="wa.me"]').count(), 0);
  const share = page.locator('#share-landing');
  await share.focus();
  assert.equal(await share.evaluate(el => el.matches(':focus-visible')), true);
  for (const [event, start, end] of [
    ['wedding', '20261120T003000Z', '20261120T020000Z'],
    ['reception', '20261120T130000Z', '20261120T153000Z'],
  ]) {
    const pending = page.waitForEvent('download');
    await page.locator(`#calendar-${event}`).click();
    const download = await pending;
    assert.match(download.suggestedFilename(), /\.ics$/);
    const chunks = [];
    for await (const chunk of await download.createReadStream()) chunks.push(chunk);
    const content = Buffer.concat(chunks).toString('utf8');
    assert.ok(content.includes(`DTSTART:${start}\r\n`));
    assert.ok(content.includes(`DTEND:${end}\r\n`));
    assert.match(content, new RegExp(`SUMMARY:.*${event}`, 'i'));
  }
  await page.locator('#share-landing').click();
  assert.equal(await page.evaluate(() => window.sharedInvitation.url), 'https://shankar-prasad-k.github.io/ShaHaWeddingInvite/');
}

module.exports = { assertSecondaryNavigation, assertLandingActions };