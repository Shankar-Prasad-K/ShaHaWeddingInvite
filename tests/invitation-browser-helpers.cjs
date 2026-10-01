const assert = require('node:assert/strict');

async function assertSecondaryNavigation(page) {
  const back = page.locator('.invitation-back');
  assert.equal((await back.textContent()).trim(), '← The beginning');
  assert.equal(await back.getAttribute('href'), 'index.html');
  assert.ok((await back.boundingBox()).height >= 44, 'back link has a touch-sized target');
  assert.equal(await back.evaluate(el => getComputedStyle(el).position), 'static');
  assert.equal(await page.locator('[id^="rsvp-"], [id^="calendar-"], [id^="share-"], a[href*="wa.me"], [onclick*="Calendar"], [onclick*="shareInvite"]').count(), 0, 'guest actions appear only on landing');
  assert.equal(await page.locator('.invitation-navigation a[href="index.html#guest-actions"]').count(), 1);
  await back.focus();
  assert.equal(await back.evaluate(el => el.matches(':focus-visible')), true);
}

async function assertLandingActions(page) {
  const rsvp = page.locator('#rsvp-landing');
  const href = new URL(await rsvp.getAttribute('href'));
  assert.equal(href.origin, 'https://wa.me');
  assert.equal(href.pathname, '/919840454710');
  assert.ok(href.searchParams.get('text'));
  assert.equal(await rsvp.getAttribute('rel'), 'noopener noreferrer');
  await rsvp.focus();
  assert.equal(await rsvp.evaluate(el => el.matches(':focus-visible')), true);
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