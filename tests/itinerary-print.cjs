// Run with NODE_PATH pointing to the bundled packages, or with Playwright installed locally.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
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
    const old = await page.evaluate(() => {
      const data = structuredClone(DEFAULT_ITINERARY);
      data.forEach((d) => { delete d.planRevision; });
      data[0].title = 'KEEP CUSTOM NORTH';
      data[5].title = 'OLD TOKYO';
      localStorage.setItem('jt26_itinerary', JSON.stringify(data));
      return data;
    });
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
    await page.locator('#close-print-btn').click();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof itinerary !== 'undefined');
    assert.equal(await page.evaluate(() => itinerary[6].title), 'CUSTOM TOKYO AFTER UPDATE');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#print-itinerary-btn').click();
    await page.locator('#print-scope').selectOption('8');
    assert.equal(await page.evaluate(() => document.querySelector('#trip-print-dialog').scrollWidth <= document.querySelector('#trip-print-dialog').clientWidth), true);
    await page.screenshot({ path: path.join(artifacts, 'print-preview-mobile.png') });
    console.log('Verified: scoped/idempotent migration, backup, custom edits, all/Tokyo/day scopes, optional details/costs, safe text, print button, A4 PDFs and mobile preview.');
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
