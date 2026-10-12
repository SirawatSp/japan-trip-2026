// Run with NODE_PATH pointing to the bundled packages, or with Playwright installed locally.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const legacyDay4 = require('./fixtures/day4-transit.json');
const root = path.resolve(__dirname, '..');
const artifacts = path.join(root, 'test-results');

test('Tokyo migration and editable A4 print report', async () => {
  fs.mkdirSync(artifacts, { recursive: true });
  const server = http.createServer((req, res) => {
    const target = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
    if (!target.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(target, (err, body) => {
      if (err) { res.writeHead(404).end(); return; }
      res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' })[path.extname(target)] || 'application/octet-stream');
      res.end(body);
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof itinerary !== 'undefined' && document.querySelectorAll('.day-card').length === 9);
    const old = await page.evaluate((day4) => {
      const data = structuredClone(DEFAULT_ITINERARY);
      data[3] = day4;
      data.forEach((d) => { delete d.planRevision; });
      data[0].title = 'KEEP CUSTOM NORTH';
      data[5].title = 'OLD TOKYO';
      localStorage.setItem('jt26_itinerary', JSON.stringify(data));
      return data;
    }, legacyDay4);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof itinerary !== 'undefined');
    assert.equal(await page.evaluate(() => itinerary[0].title), old[0].title);
    assert.deepEqual(await page.evaluate(() => itinerary.slice(0, 5)), old.slice(0, 5));
    assert.match(await page.evaluate(() => itinerary[5].title), /Horyuji/);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('jt26_tokyo_plan_backup'))[0].title), 'OLD TOKYO');
    assert.equal(await page.evaluate(() => applyTokyoSavedPlan(itinerary)), false);
    assert.equal(await page.evaluate(() => {
      const remote = structuredClone(DEFAULT_ITINERARY);
      delete remote[5].planRevision;
      remote[0].title = 'REMOTE NORTH';
      return applyTokyoSavedPlan(remote) && remote[0].title === 'REMOTE NORTH' && !applyTokyoSavedPlan(remote);
    }), true);
    await page.locator('.day-title-input[data-idx="6"]').fill('CUSTOM TOKYO AFTER UPDATE');
    await page.locator('.day-title-input[data-idx="6"]').blur();
    await page.locator('.day-act-input[data-idx="6"][data-item="0"]').fill('CUSTOM ACTIVITY <img src=x onerror=alert(1)>');
    await page.locator('#print-itinerary-btn').click();
    assert.equal(await page.locator('.trip-print-table').count(), 9);
    assert.match(await page.locator('#trip-print-report').innerText(), /CUSTOM TOKYO AFTER UPDATE/);
    assert.equal(await page.locator('#trip-print-report img').count(), 0);
    assert.equal(await page.locator('#trip-print-report .print-item-note').count(), 0);
    await page.locator('#print-scope').selectOption('tokyo');
    assert.equal(await page.locator('.trip-print-table').count(), 4);
    await page.screenshot({ path: path.join(artifacts, 'print-preview-desktop.png') });
    await page.locator('#print-details').check();
    await page.locator('#print-costs').check();
    assert.ok(await page.locator('.print-item-note').count() > 0);
    await page.locator('#print-scope').selectOption('8');
    assert.equal(await page.locator('.trip-print-table').count(), 1);
    assert.match(await page.locator('#trip-print-report').innerText(), /Setagaya/);
    // Verify the button reaches the browser print API without opening an OS dialog in CI.
    await page.evaluate(() => { window.print = () => { window.printRequested = true; }; });
    await page.locator('#confirm-print-btn').click();
    await page.waitForFunction(() => window.printRequested === true);
    await page.locator('#print-scope').selectOption('all');
    await page.locator('#print-details').uncheck();
    await page.locator('#print-costs').uncheck();
    await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
    await page.emulateMedia({ media: 'print' });
    assert.equal(await page.locator('body > #trip-print-report').count(), 1);
    assert.equal(await page.locator('nav').isVisible(), false);
    await page.pdf({ path: path.join(artifacts, 'trip-plan-compact.pdf'), preferCSSPageSize: true, printBackground: true });
    await page.screenshot({ path: path.join(artifacts, 'print-layout.png'), fullPage: true });
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    await page.emulateMedia({ media: 'screen' });
    assert.equal(await page.locator('#trip-print-preview > #trip-print-report').count(), 1);
    await page.locator('#print-details').check();
    await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
    await page.emulateMedia({ media: 'print' });
    await page.pdf({ path: path.join(artifacts, 'trip-plan-detailed.pdf'), preferCSSPageSize: true });
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    await page.emulateMedia({ media: 'screen' });
    // English must cover the complete default plan, not just table headings.
    assert.deepEqual(await page.evaluate(() => TripPrint.missing(DEFAULT_ITINERARY, { details: true })), []);
    assert.deepEqual(await page.evaluate(() => TripPrint.missing([itinerary[3]], { details: true })), []);
    assert.equal(await page.evaluate(() => {
      const el = document.createElement('div');
      el.innerHTML = TripPrint.render(DEFAULT_ITINERARY, { language: 'en', details: true, costs: true });
      return /[\u0E00-\u0E7F]/u.test(el.textContent);
    }), false);
    const savedThai = await page.evaluate(() => JSON.stringify(itinerary));
    await page.locator('#print-language').selectOption('en');
    assert.equal(await page.locator('#trip-print-report').getAttribute('lang'), 'en');
    const english = await page.locator('#trip-print-report').innerText();
    assert.doesNotMatch(english, /[\u0E00-\u0E7F]/u);
    assert.match(english, /Outbound ZIPAIR ZG052/);
    assert.match(english, /Return ZIPAIR ZG051/);
    assert.match(english, /Tue 20 Oct 2026/);
    assert.match(english, /Always ask about wind, trail conditions, ice and volcanic notices/);
    assert.match(english, /CUSTOM TOKYO AFTER UPDATE/);
    assert.equal(await page.locator('#confirm-print-btn').isEnabled(), true);
    await page.locator('#print-costs').check();
    assert.match(await page.locator('#trip-print-report').innerText(), /JPY\s*\/\s*person/);
    await page.locator('#print-scope').selectOption('4');
    const legacyEnglish = await page.locator('#trip-print-report').innerText();
    assert.doesNotMatch(legacyEnglish, /[\u0E00-\u0E7F]/u);
    assert.match(legacyEnglish, /Urabandai lakes by train and bus/);
    assert.match(legacyEnglish, /Bandai Toto bus → Goshikinuma Iriguchi stop/);
    assert.match(legacyEnglish, /Check the last return bus/);
    assert.doesNotMatch(legacyEnglish, /Drive back to Fukushima|park the car/);
    assert.deepEqual(await page.locator('.trip-print-table .print-time').allTextContents(), legacyDay4.items.map((item) => item.t));
    assert.deepEqual(await page.locator('.trip-print-table .print-cost').allTextContents(), legacyDay4.items.map((item) => item.cost > 0 ? item.cost.toLocaleString('en-US') : '-'));
    assert.equal(await page.locator('#confirm-print-btn').isEnabled(), true);
    assert.equal(await page.locator('#print-translations').isVisible(), false);
    await page.screenshot({ path: path.join(artifacts, 'print-day4-transit-english.png') });
    await page.locator('#print-details').uncheck();
    assert.doesNotMatch(await page.locator('#trip-print-report').innerText(), /[\u0E00-\u0E7F]/u);
    await page.locator('#print-details').check();
    await page.locator('#print-scope').selectOption('all');
    await page.screenshot({ path: path.join(artifacts, 'print-preview-english.png') });
    await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
    await page.emulateMedia({ media: 'print' });
    await page.pdf({ path: path.join(artifacts, 'trip-plan-english.pdf'), preferCSSPageSize: true });
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    await page.emulateMedia({ media: 'screen' });
    assert.equal(await page.evaluate(() => JSON.stringify(itinerary)), savedThai);
    // Custom Thai must never reuse a stale English translation. It can be supplied
    // separately for export, without changing the saved trip.
    await page.evaluate(() => {
      itinerary[6].title = 'เที่ยวตามใจวันนี้';
      itinerary[6].items[0].act = 'ไปคาเฟ่ใหม่กับเพื่อน';
      itinerary[6].items[0].note = 'จองโต๊ะเวลา 10:00';
      itinerary[6].items[0].t = 'หลังอาหาร';
    });
    await page.locator('#print-scope').selectOption('7');
    assert.equal(await page.locator('#print-translation-fields textarea').count(), 4);
    assert.equal(await page.locator('#confirm-print-btn').isDisabled(), true);
    assert.match(await page.locator('#trip-print-report').innerText(), /translations are incomplete/);
    const customTranslations = {
      'เที่ยวตามใจวันนี้': 'Flexible day in Tokyo',
      'ไปคาเฟ่ใหม่กับเพื่อน': 'Visit a new cafe with friends <img src=x onerror=alert(1)>',
      'จองโต๊ะเวลา 10:00': 'Table reserved for 10:00',
      'หลังอาหาร': 'After breakfast',
    };
    for (const field of await page.locator('#print-translation-fields textarea').all()) {
      await field.fill(customTranslations[await field.getAttribute('data-print-source')]);
    }
    assert.equal(await page.locator('#confirm-print-btn').isEnabled(), true);
    const translated = await page.locator('#trip-print-report').innerText();
    assert.match(translated, /Flexible day in Tokyo/);
    assert.match(translated, /Visit a new cafe with friends/);
    assert.match(translated, /Table reserved for 10:00/);
    assert.match(translated, /After breakfast/);
    assert.doesNotMatch(translated, /[\u0E00-\u0E7F]/u);
    assert.equal(await page.locator('#trip-print-report img').count(), 0);
    await page.evaluate(() => {
      itinerary[6].items[0].act = 'เปลี่ยนคาเฟ่อีกแล้ว';
      updatePrintPreview();
    });
    assert.equal(await page.locator('#confirm-print-btn').isDisabled(), true);
    assert.equal(await page.locator('#print-translation-fields textarea').count(), 1);
    await page.evaluate((data) => { itinerary = JSON.parse(data); updatePrintPreview(); }, savedThai);
    await page.locator('#print-language').selectOption('th');
    assert.match(await page.locator('#trip-print-report').innerText(), /เวลาเที่ยวบินเป็นเวลาท้องถิ่น/);
    assert.equal(await page.evaluate(() => JSON.stringify(itinerary)), savedThai);
    await page.locator('#close-print-btn').click();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof itinerary !== 'undefined');
    assert.equal(await page.evaluate(() => itinerary[6].title), 'CUSTOM TOKYO AFTER UPDATE');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('jt26_print_english'))['เที่ยวตามใจวันนี้']), 'Flexible day in Tokyo');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#print-itinerary-btn').click();
    await page.locator('#print-scope').selectOption('8');
    assert.equal(await page.evaluate(() => document.querySelector('#trip-print-dialog').scrollWidth <= document.querySelector('#trip-print-dialog').clientWidth), true);
    await page.screenshot({ path: path.join(artifacts, 'print-preview-mobile.png') });
    await page.locator('#print-language').selectOption('en');
    assert.equal(await page.evaluate(() => document.querySelector('#trip-print-dialog').scrollWidth <= document.querySelector('#trip-print-dialog').clientWidth), true);
    assert.doesNotMatch(await page.locator('#trip-print-report').innerText(), /[\u0E00-\u0E7F]/u);
    await page.screenshot({ path: path.join(artifacts, 'print-preview-mobile-english.png') });
    await page.locator('#print-scope').selectOption('4');
    assert.equal(await page.evaluate(() => document.querySelector('#trip-print-dialog').scrollWidth <= document.querySelector('#trip-print-dialog').clientWidth), true);
    assert.doesNotMatch(await page.locator('#trip-print-report').innerText(), /[\u0E00-\u0E7F]/u);
    await page.screenshot({ path: path.join(artifacts, 'print-day4-transit-mobile.png') });
    console.log('Verified: migration, custom edits, scopes, details/costs, Thai/English A4 PDFs, complete English content, safe persistent custom translations, unchanged itinerary and mobile preview.');
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
