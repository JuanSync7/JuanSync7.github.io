import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const supplied = process.argv.find((arg) => arg.startsWith('--url='))?.slice(6);
const base = supplied ?? 'http://127.0.0.1:4387';
const child = supplied ? null : spawn(process.execPath, ['node_modules/astro/astro.js', 'preview', '--host', '127.0.0.1', '--port', '4387'],
  { env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' }, stdio: 'ignore' });
let browser;
try {
  for (let attempt = 0; attempt < 100; attempt++) {
    try { if ((await fetch(`${base}/lab/icon-kit/`)).ok) break; } catch { /* Preview is starting. */ }
    if (attempt === 99) throw new Error('Hardware preview did not start.');
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  await mkdir('hardware-out', { recursive: true });
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1360, height: 1000 }, reducedMotion: 'reduce', acceptDownloads: true });
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${base}/lab/icon-kit/`);
  const canvas = page.locator('.atlas-stage canvas');
  await page.locator('.atlas-stage canvas[data-ready="1"]').waitFor();
  assert.equal(await page.locator('.atlas-card').count(), 12);
  assert.equal(await page.locator('#atlas-object-title').textContent(), 'Processor package');
  await page.locator('.atlas-inspector').screenshot({ path: 'hardware-out/workbench-desktop.png' });

  await page.getByRole('searchbox').fill('no-such-hardware');
  assert.equal(await page.locator('.atlas-card').count(), 0);
  assert.match(await page.locator('.atlas-empty').textContent(), /No objects match/);
  await page.getByRole('searchbox').fill('');
  await page.locator('.atlas-filter button').filter({ hasText: /^compute$/ }).click();
  assert.equal(await page.locator('.atlas-card').count(), 4);
  await page.locator('.atlas-card').filter({ hasText: 'Memory stack' }).click();
  await page.waitForFunction(() => document.querySelector('#atlas-object-title')?.textContent === 'Memory stack');
  assert.equal(await page.locator('#atlas-object-title').evaluate((node) => document.activeElement === node), true);
  await page.locator('.atlas-parts button').first().click();
  await page.waitForFunction(() => document.querySelector('.atlas-stage canvas')?.getAttribute('data-readout') === 'Interposer landing');
  const original = await canvas.evaluate((node) => node.toDataURL());
  await page.getByRole('button', { name: 'wireframe', exact: true }).click();
  await page.waitForFunction((before) => document.querySelector('.atlas-stage canvas')?.toDataURL() !== before, original);
  await page.getByRole('button', { name: 'front', exact: true }).click();
  await page.getByRole('button', { name: 'Assemble ↘', exact: true }).click();
  await page.waitForFunction(() => new URL(location.href).searchParams.get('open') === '0');

  const individual = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download SVG ↓', exact: true }).click();
  const download = await individual;
  assert.equal(download.suggestedFilename(), 'memory-wireframe.svg');
  const svg = await readFile(await download.path(), 'utf8');
  assert.match(svg, /<title>memory · wireframe<\/title>/);
  assert.equal(await page.evaluate((source) => new DOMParser().parseFromString(source, 'image/svg+xml').querySelector('parsererror') === null, svg), true);
  await page.getByRole('button', { name: 'Copy SVG', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.atlas-status')?.textContent === 'SVG copied.');
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), svg);
  const pack = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download all 24 symbols ↓', exact: true }).click();
  const sprite = await readFile(await (await pack).path(), 'utf8');
  assert.equal([...sprite.matchAll(/<symbol id=/g)].length, 24);

  const shared = page.url();
  await page.reload();
  await page.locator('.atlas-stage canvas[data-ready="1"]').waitFor();
  await page.waitForFunction(() => document.querySelector('#atlas-object-title')?.textContent === 'Memory stack');
  assert.equal(new URL(shared).search, new URL(page.url()).search, 'A shared URL preserves object, view, mode, opening and selected part');
  assert.equal(await page.locator('.atlas-parts button').first().getAttribute('aria-pressed'), 'true');
  await page.mouse.move(0, 0);
  const frozen = await canvas.evaluate((node) => node.toDataURL());
  // This delay proves the reduced-motion scene remains still over elapsed time.
  await page.waitForTimeout(250);
  assert.equal(await canvas.evaluate((node) => node.toDataURL()), frozen);
  for (const width of [375, 768]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px: no horizontal overflow`);
    await page.screenshot({ path: `hardware-out/workbench-${width}.png`, fullPage: true });
  }
  assert.equal(await canvas.getAttribute('data-error'), null);
  assert.deepEqual(errors, []);
  const plain = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await plain.newPage();
  await staticPage.goto(`${base}/lab/icon-kit/`);
  assert.equal(await staticPage.locator('.atlas-grid svg').count(), 12, 'The collection renders without JavaScript');
  console.log('Hardware browser: selection, search, category filters, camera, assembly, download, clipboard, sprite, sharing, reduced motion, mobile and no-JS passed.');
} finally {
  await browser?.close();
  child?.kill();
}
