/** A quick native composition proof before the full room verification. */
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
const seed = Number(process.argv.find((a) => a.startsWith('--seed='))?.slice(7) ?? 11);
const url = process.argv.find((a) => a.startsWith('--url='))?.slice(6) ?? 'http://127.0.0.1:4410';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 1000 }, reducedMotion: 'reduce' }),
    errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ status: 200, body: '' }));
  await page.goto(`${url}/lab/pixel-still/?seed=${seed}`);
  const canvas = page.locator('.lab-main canvas');
  await page.waitForFunction(() => document.querySelector('.lab-main canvas')?.dataset.ready === '1', null, {
    timeout: 90000,
  });
  assert.equal(await canvas.getAttribute('data-error'), null);
  assert.equal(await canvas.getAttribute('data-renderer'), 'webgl');
  await page.getByRole('button', { name: 'Isometric', exact: true }).click();
  await canvas.evaluate((c) => c.scrollIntoView({ block: 'center' }));
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  mkdirSync('figures-out', { recursive: true });
  await canvas.screenshot({ path: `figures-out/room-composition-${seed}.png` });
  assert.deepEqual(errors, []);
  console.log(`Native composition saved: figures-out/room-composition-${seed}.png`);
} finally {
  await browser.close();
}
