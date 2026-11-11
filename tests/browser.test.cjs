const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');

test('catalog, categories, search, covers, cart, discount and payment handoff work on desktop and mobile', async () => {
  const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404).end(); return; }
      res.setHeader('Content-Type', ({'.html':'text/html','.js':'text/javascript','.jpg':'image/jpeg','.css':'text/css'})[path.extname(file)] || 'application/octet-stream');
      res.end(data);
    });
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    assert.equal(await page.locator('.book').count(), 29);
    const firstRowTops = await page.locator('.book .cover-wrap').evaluateAll(els => els.slice(0, 4).map(el => el.getBoundingClientRect().top));
    assert.ok(Math.max(...firstRowTops) - Math.min(...firstRowTops) < 1, 'First-row covers align at the top');
    await page.locator('[data-filter="Comic"]').click();
    assert.equal(await page.locator('.book').count(), 13);
    await page.locator('[data-filter="Ebook"]').click();
    assert.equal(await page.locator('.book').count(), 16);
    await page.locator('[data-filter="All books"]').click();
    await page.locator('#search').fill('Villa Nabila');
    assert.equal(await page.locator('.book').count(), 1);
    await page.locator('.book').click();
    assert.match(await page.locator('#detail-title').textContent(), /Villa Nabila/);
    assert.equal(await page.locator('#detail a.preview-link').getAttribute('href'), 'https://www.penana.com/story/198938');
    assert.ok(await page.locator('#detail img').evaluate(img => img.complete && img.naturalWidth > 0));
    await page.locator('#add-to-cart').click();
    assert.equal(await page.locator('#add-to-cart').isDisabled(), true);
    await page.locator('#detail .close').click();
    await page.locator('#search').fill('no-such-title-xyz');
    assert.equal(await page.locator('.book').count(), 0);
    await page.locator('#search').fill('');
    for (const id of [1, 2]) {
      await page.locator(`.book[data-id="${id}"]`).click();
      await page.locator('#add-to-cart').click();
      await page.locator('#detail .close').click();
    }
    await page.locator('#open-cart').click();
    assert.equal(await page.locator('.cart-row').count(), 3);
    assert.equal(await page.locator('#subtotal').textContent(), 'RM 28.00');
    assert.equal(await page.locator('#discount').textContent(), '− RM 1.40');
    assert.equal(await page.locator('#total').textContent(), 'RM 26.60');
    await page.evaluate(() => { window.open = (url) => { window.testOpenedUrl = url; }; });
    await page.locator('#email').fill('reader@example.com');
    await page.locator('button[value="stripe"]').click();
    assert.equal(await page.evaluate(() => window.testOpenedUrl), 'https://buy.stripe.com/cNi28rfiWdkR1fn7hj57W0v');
    await page.locator('button[value="tng"]').click();
    assert.equal(await page.evaluate(() => window.testOpenedUrl), 'https://payment.tngdigital.com.my/sc/bDLnx1yAeB');
    await page.locator('#receipt').click();
    const receipt = await page.evaluate(() => window.testOpenedUrl);
    assert.match(receipt, /^https:\/\/t.me\/kokombeee\?text=/);
    assert.ok(decodeURIComponent(receipt).includes('RM 26.60'));
    assert.ok(decodeURIComponent(receipt).includes('reader@example.com'));
    await page.locator('.remove-item').first().click();
    assert.equal(await page.locator('.cart-row').count(), 2);
    assert.equal(await page.locator('#discount-row').isVisible(), false);
    await page.locator('#close-cart').click();
    await page.reload();
    assert.equal(await page.locator('#cart-count').textContent(), '2');
    await page.locator('#search').fill('Kawan Baik Anakku');
    await page.locator('.book').click();
    assert.equal(await page.locator('#detail .cover-fallback').isVisible(), true);
    await page.keyboard.press('Escape');
    await page.locator('#search').fill('');
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 844 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `No overflow at ${width}px`);
      await page.locator('.book').first().click();
      assert.ok(await page.locator('#detail').evaluate(el => el.scrollWidth <= el.clientWidth), `Modal fits at ${width}px`);
      await page.keyboard.press('Escape');
    }
    await page.locator('[data-filter="All books"]').click();
    await page.locator('.book img').evaluateAll(imgs => imgs.forEach(img => img.loading = 'eager'));
    await page.waitForFunction(() => [...document.querySelectorAll('.book img')].every(img => img.complete && img.naturalWidth > 0));
    assert.equal(await page.locator('.book img').count(), 28);
    // A missing image should show a styled title cover, not a broken icon.
    await page.locator('.book img').first().evaluate(img => { img.dispatchEvent(new Event('error')); });
    assert.equal(await page.locator('.book .cover-fallback').first().isVisible(), true);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    await new Promise(r => server.close(r));
  }
});
