import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.argv.find(a => a.startsWith('--url='))?.slice(6) ?? 'http://127.0.0.1:4321';
const name = process.argv.find(a => a.startsWith('--name='))?.slice(7) ?? 'gallery-profile';
const { gallery: limits } = JSON.parse(await readFile(new URL('./rules.json', import.meta.url), 'utf8'));
await mkdir('hardware-out', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1360, height: 1000 }, colorScheme: 'dark' });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${base}/lab/hardware-atlas/?seed=7`);
  await page.locator('.lab-strip canvas').last().scrollIntoViewIfNeeded();
  await page.waitForFunction(() => [...document.querySelectorAll('.lab-strip canvas')].every(c => c.dataset.ready === '1'));
  const report = await page.evaluate(async limits => {
    const canvases = [...document.querySelectorAll('.lab-strip canvas')];
    const before = canvases.map(c => Number(c.dataset.frames ?? 0));
    const start = performance.now();
    await new Promise(resolve => setTimeout(resolve, limits.idleWindowMs));
    const idleMs = performance.now() - start;
    const after = canvases.map(c => Number(c.dataset.frames ?? 0));
    const intervals = [];
    let last = performance.now();
    for (let i = 0; i < limits.scrollFrames; i++) {
      await new Promise(requestAnimationFrame);
      const now = performance.now();
      intervals.push(now - last); last = now;
      scrollTo(0, document.querySelector('.lab-strip').getBoundingClientRect().top + scrollY - 100 + Math.sin(i / 10) * 90);
    }
    intervals.sort((a, b) => a - b);
    return { idleMs, frameDeltas: after.map((n, i) => n - before[i]),
      thumbnails: canvases.map(c => ({ id: c.closest('[data-figure]').dataset.figure, avgMs: Number(c.dataset.msAvg), maxMs: Number(c.dataset.msMax) })),
      scrollP95Ms: intervals[Math.floor(intervals.length * limits.percentile)], scrollMaxMs: intervals.at(-1) };
  }, limits);
  await page.locator('.lab-strip').screenshot({ path: `hardware-out/${name}.png` });
  await writeFile(`hardware-out/${name}.json`, JSON.stringify(report, null, 2) + '\n');
  if (process.argv.includes('--check')) {
    assert.equal(report.frameDeltas.length, 8, 'Gallery retains all eight seeds');
    assert.ok(report.frameDeltas.every(n => n === 0), 'Seed thumbnails do no frame work while idle');
    await page.locator('.lab-thumb').first().click();
    await page.locator('.lab-main [data-figure="hardware-atlas~8"] canvas[data-ready="1"]').waitFor();
    const main = page.locator('.lab-main canvas');
    const before = await main.evaluate(c => c.toDataURL());
    await main.hover({ position: { x: 200, y: 150 } });
    await page.waitForFunction(before => document.querySelector('.lab-main canvas').toDataURL() !== before, before);
    for (const width of [375,768,1360]) {
      await page.setViewportSize({width,height:900});
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px: no gallery overflow`);
    }
    assert.deepEqual(errors, []);
    assert.equal(await main.getAttribute('data-error'), null);
  }
  console.log(JSON.stringify(report));
} finally { await browser.close(); }
