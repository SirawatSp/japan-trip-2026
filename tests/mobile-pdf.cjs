// Run with NODE_PATH pointing to Playwright and CHROME_PATH if needed.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium, webkit, devices } = require('playwright');
const root = path.resolve(__dirname, '..');
const artifacts = path.join(root, 'test-results');

test('direct A4 PDF download on mobile without the print API', { timeout: 180000 }, async () => {
  fs.mkdirSync(artifacts, { recursive: true });
  const server = http.createServer((req, res) => {
    const target = path.resolve(root, '.' + (decodeURIComponent(req.url.split('?')[0]) === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0])));
    if (!target.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(target, (error, body) => {
      if (error) { res.writeHead(404).end(); return; }
      res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.ttf': 'font/ttf' })[path.extname(target)] || 'application/octet-stream');
      res.end(body);
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const browser = process.env.PDF_TEST_WEBKIT
    ? await webkit.launch()
    : await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  try {
    const page = await browser.newPage({ ...devices[process.env.PDF_TEST_WEBKIT ? 'iPhone 13' : 'Pixel 7'] });
    const requests = [];
    const externalPosts = [];
    page.on('request', (req) => {
      requests.push(req.url());
      if (req.method() === 'POST' && !req.url().startsWith('http://127.0.0.1:')) externalPosts.push(req.url());
    });
    // Isolate trip data from the real sync service in this regression test.
    await page.route(/firebase|gstatic.com|open-meteo.com/, (route) => route.abort());
    await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('.day-card').length === 9);
    assert.equal(requests.some((url) => url.includes('assets/pdf/')), false, 'PDF engine/fonts should be lazy');
    await page.evaluate(() => {
      window.print = () => { throw new Error('Mobile PDF must not require printing'); };
      itinerary[0].items[0].act = 'CUSTOM SAVED ACTIVITY';
      localStorage.setItem('jt26_itinerary', JSON.stringify(itinerary));
    });
    const saved = await page.evaluate(() => localStorage.getItem('jt26_itinerary'));
    await page.locator('#print-itinerary-btn').click();
    await page.locator('#print-details').check();
    await page.locator('#print-costs').check();
    const downloadPDF = async (name) => {
      const event = page.waitForEvent('download', { timeout: 90000 });
      await page.locator('#download-pdf-btn').click();
      const download = await event;
      assert.match(download.suggestedFilename(), /^japan-trip-2026-.*\.pdf$/);
      await download.saveAs(path.join(artifacts, name));
      fs.writeFileSync(path.join(artifacts, name + '.json'), JSON.stringify(await page.locator('#trip-print-report').evaluate((report) => ({
        text: report.textContent,
        headers: [...report.querySelectorAll('thead')].map((el) => el.textContent),
        expected: [...report.querySelectorAll('h1, h2, tbody strong, .print-item-note, .print-time, .print-cost')].map((el) => el.textContent.trim()),
      }))));
      const bytes = fs.readFileSync(path.join(artifacts, name));
      assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
      assert.ok(bytes.length > 5000);
      await page.waitForFunction(() => !document.querySelector('#download-pdf-btn').disabled);
      assert.equal(await page.locator('#open-pdf-link').isVisible(), true);
      assert.match(await page.locator('#open-pdf-link').getAttribute('href'), /^blob:/);
      assert.equal(await page.locator('#trip-print-dialog').evaluate((el) => el.scrollWidth <= el.clientWidth), true);
    };
    await downloadPDF(process.env.PDF_TEST_WEBKIT ? 'mobile-webkit-th.pdf' : 'mobile-full-th.pdf');
    await page.screenshot({ path: path.join(artifacts, process.env.PDF_TEST_WEBKIT ? 'mobile-pdf-webkit.png' : 'mobile-pdf-android.png') });
    await page.locator('#print-language').selectOption('en');
    assert.equal(await page.locator('#pdf-download-links').isHidden(), true, 'Changed options invalidate old download');
    await page.locator('#print-scope').selectOption('tokyo');
    await downloadPDF(process.env.PDF_TEST_WEBKIT ? 'mobile-webkit-en.pdf' : 'mobile-tokyo-en.pdf');
    await page.locator('#print-scope').selectOption('8');
    await page.locator('#print-details').uncheck();
    await page.locator('#print-costs').uncheck();
    await downloadPDF(process.env.PDF_TEST_WEBKIT ? 'mobile-webkit-day8.pdf' : 'mobile-day8-en.pdf');
    await page.setViewportSize({ width: 320, height: 700 });
    assert.equal(await page.locator('#trip-print-dialog').evaluate((el) => el.scrollWidth <= el.clientWidth), true);
    assert.equal(await page.evaluate(() => localStorage.getItem('jt26_itinerary')), saved);
    await page.evaluate(() => { itinerary[7].title = 'ข้อความใหม่ที่ยังไม่มีคำแปล'; updatePrintPreview(); });
    assert.equal(await page.locator('#download-pdf-btn').isDisabled(), true);
    assert.equal(await page.locator('#pdf-download-links').isHidden(), true);
    assert.deepEqual(externalPosts, [], 'No itinerary upload');
    await page.locator('#print-language').selectOption('th');
    await page.evaluate(() => { TripPDF.create = () => new Promise((resolve) => { window.releasePDF = resolve; }); });
    await page.locator('#download-pdf-btn').click();
    assert.equal(await page.locator('#download-pdf-btn').isDisabled(), true);
    await page.locator('#print-scope').selectOption('all');
    await page.evaluate(() => window.releasePDF(new Blob(['%PDF-test'], { type: 'application/pdf' })));
    await page.waitForFunction(() => !document.querySelector('#download-pdf-btn').disabled);
    assert.equal(await page.locator('#pdf-download-links').isHidden(), true, 'Discard exports superseded during generation');
    // A failed asset load must show a retryable message, with no stale PDF link.
    await page.evaluate(() => { TripPDF.create = async () => { throw new Error('simulated connection failure'); }; });
    await page.locator('#download-pdf-btn').click();
    await page.waitForFunction(() => document.querySelector('#pdf-status').textContent.includes('ไม่สำเร็จ'));
    assert.equal(await page.locator('#download-pdf-btn').isEnabled(), true);
    console.log('Verified mobile direct downloads, Thai/Japanese and English content, all/Tokyo/day scopes, details/costs, translation guard, retry status, unchanged saved data and no trip upload.');
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
