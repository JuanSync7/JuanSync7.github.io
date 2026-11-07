/** Apply the existing Three.js frame budget to the full-colour room viewer. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
const url = (process.argv.find((a) => a.startsWith('--url='))?.slice(6) ?? 'http://127.0.0.1:4410').replace(/\/$/, '');
const limits = JSON.parse(readFileSync('scripts/figures/thresholds.json', 'utf8'));
const browser = await chromium.launch(),
  report = [];
try {
  for (const [theme, seed] of [
    ['computer', 11],
    ['lab', 3],
  ]) {
    const context = await browser.newContext({
      viewport: { width: 736, height: 1000 },
      reducedMotion: 'no-preference',
    });
    const page = await context.newPage(),
      errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error' && !/GroupMarkerNotSet|GL Driver Message|enable-unsafe-swiftshader/.test(m.text()))
        errors.push(m.text());
    });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ status: 200, body: '' }));
    await page.goto(`${url}/lab/pixel-still/?seed=${seed}`);
    await page.addStyleTag({ content: '.lab-main{max-width:640px;margin-inline:auto}' });
    const canvas = page.locator('.lab-main canvas');
    await canvas.evaluate((c) => c.scrollIntoView({ block: 'center' }));
    await page.waitForFunction(() => document.querySelector('.lab-main canvas')?.dataset.ready === '1');
    await page.waitForTimeout(limits.liveWaitMs);
    const rendered = Number(await canvas.getAttribute('data-rendered-frames'));
    assert(rendered > 0, 'The room must draw before retaining its frame');
    await page.waitForTimeout(400);
    assert.equal(Number(await canvas.getAttribute('data-rendered-frames')), rendered, 'Idle room kept rendering');
    const metrics = await canvas.evaluate((c) => ({
      average: Number(c.dataset.msAvg),
      peak: Number(c.dataset.msMax),
      frames: Number(c.dataset.frames),
      renderer: c.dataset.renderer,
      error: c.dataset.error,
    }));
    report.push({ theme, seed, ...metrics });
    writeFileSync('figures-out/room-colour-performance.json', JSON.stringify(report, null, 2) + '\n');
    assert.equal(metrics.renderer, 'webgl');
    assert.equal(metrics.error, undefined);
    assert(metrics.frames >= 15, `${theme}: insufficient live frames`);
    assert(
      metrics.average <= limits.msAvgMaxThree,
      `${theme}: average ${metrics.average}ms exceeds ${limits.msAvgMaxThree}ms`,
    );
    const projection = await page.getByRole('button', { name: 'Isometric', exact: true }).getAttribute('aria-pressed');
    await page.getByRole('button', { name: projection === 'true' ? 'Eye level' : 'Isometric', exact: true }).click();
    await page.waitForFunction(
      (before) => Number(document.querySelector('.lab-main canvas')?.dataset.renderedFrames) > before,
      rendered,
    );
    const moved = Number(await canvas.getAttribute('data-rendered-frames'));
    await page.getByRole('button', { name: 'Monochrome', exact: true }).click();
    await page.waitForFunction(
      (before) => Number(document.querySelector('.lab-main canvas')?.dataset.renderedFrames) > before,
      moved,
    );
    assert.deepEqual(errors, []);
    await context.close();
  }
  writeFileSync('figures-out/room-colour-performance.json', JSON.stringify(report, null, 2) + '\n');
  console.log('Full-colour room performance passed the existing Three.js frame budget:', report);
} finally {
  await browser.close();
}
