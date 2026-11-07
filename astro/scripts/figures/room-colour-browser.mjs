import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { decode, diff, measure } from './pixels.mjs';
import { writeSheet } from './sheet.mjs';
import { colourMetrics, assertColour } from './room-colour-metrics.mjs';
const url = (process.argv.find((a) => a.startsWith('--url='))?.slice(6) ?? 'http://127.0.0.1:4410').replace(/\/$/, '');
const night = JSON.parse(readFileSync('scripts/figures/thresholds.json', 'utf8'));
const limits = JSON.parse(readFileSync('scripts/figures/room-colour-checks.json', 'utf8'));
const themes = [
  ['dining', 38],
  ['work', 1],
  ['computer', 11],
  ['storage', 0],
  ['messy', 2],
  ['study', 6],
  ['kitchen', 12],
  ['bar', 10],
  ['lab', 3],
];
const browser = await chromium.launch(),
  errors = [],
  report = [];
mkdirSync('figures-out', { recursive: true });
try {
  for (const fallback of [false, true]) {
    const context = await browser.newContext({ viewport: { width: 1200, height: 1000 }, reducedMotion: 'reduce' }),
      page = await context.newPage(),
      shots = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (
        ['error', 'warning'].includes(m.type()) &&
        !/\[vite\]|React DevTools|GroupMarkerNotSet|GL Driver Message|enable-unsafe-swiftshader|\[transitions\]: all view transition animations/.test(
          m.text(),
        )
      )
        errors.push(m.text());
    });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ status: 200, body: '' }));
    if (fallback)
      await page.addInitScript(() => {
        const get = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
          return kind === 'webgl' || kind === 'webgl2' ? null : get.call(this, kind, ...args);
        };
      });
    await page.goto(`${url}/lab/pixel-still/?seed=38`);
    const canvas = page.locator('.lab-main canvas');
    const ready = async () => {
      await page.waitForFunction(() => document.querySelector('.lab-main canvas')?.dataset.ready === '1');
      assert.equal(await canvas.getAttribute('data-error'), null);
      assert.equal(await canvas.getAttribute('data-renderer'), fallback ? '2d-fallback' : 'webgl');
    };
    const shot = async () => {
      await canvas.evaluate((c) => c.scrollIntoView({ block: 'center' }));
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      return canvas.screenshot();
    };
    const previewShot = async () => {
      const preview = page.locator('.lab-strip canvas').first();
      await preview.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('.lab-strip canvas')?.dataset.ready === '1');
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      return preview.screenshot();
    };
    for (const [theme, seed] of themes) {
      await page.locator('.lab-seed input').fill(String(seed));
      await page.locator('.lab-seed input').press('Enter');
      await page.waitForURL(new RegExp(`seed=${seed}$`));
      await ready();
      assert.deepEqual(
        await page.locator('canvas[data-error]').evaluateAll((canvases) => canvases.map((c) => c.dataset.error)),
        [],
        'A seed preview failed to mount',
      );
      assert(
        (await canvas.getAttribute('aria-label'))?.includes(
          theme === 'messy' ? 'messy' : theme === 'computer' ? 'computer' : theme,
        ),
        'Seed/theme fixture drift',
      );
      await page.getByRole('button', { name: 'Full colour', exact: true }).click();
      await page.getByRole('button', { name: 'Isometric', exact: true }).click();
      const colour = await shot(),
        metrics = colourMetrics(colour, night),
        label = `${theme} · ${fallback ? 'fallback' : 'WebGL'}`;
      writeFileSync(`figures-out/room-colour-${fallback ? 'fallback' : 'webgl'}-${theme}.png`, colour);
      assertColour(metrics, limits, label);
      const previewColour = theme === 'dining' ? await previewShot() : null;
      const repeat = await shot();
      assert(diff(decode(colour), decode(repeat)) <= limits.stillDifferenceMax, `${label}: texture shimmer at rest`);
      await page.getByRole('button', { name: 'Monochrome', exact: true }).click();
      const mono = await shot(),
        monoMetrics = measure(decode(mono), night);
      if (previewColour) {
        const previewMono = await previewShot();
        assert(
          diff(decode(previewColour), decode(previewMono)) > limits.modeDifferenceMin,
          `${label}: seed previews did not follow the appearance switch`,
        );
        assert((await page.locator('.lab-strip canvas').count()) <= limits.previewCountMax, 'Too many room previews');
      }
      assert(monoMetrics.offPalette <= night.offPaletteMax, `${label}: monochrome palette was not restored`);
      assert(monoMetrics.coverage <= night.coverageMax, `${label}: monochrome frame coverage`);
      assert(diff(decode(colour), decode(mono)) > limits.modeDifferenceMin, `${label}: colour switch has no effect`);
      assert.equal(await page.locator('.room-orbit output').textContent(), '135°', 'Appearance changed the camera');
      writeFileSync(`figures-out/room-monochrome-${fallback ? 'fallback' : 'webgl'}-${theme}.png`, mono);
      shots.push({ label: `${theme} · colour`, png: colour }, { label: `${theme} · monochrome`, png: mono });
      report.push({ theme, seed, renderer: fallback ? 'fallback' : 'webgl', metrics });
      await page.getByRole('button', { name: 'Full colour', exact: true }).click();
      await page.getByRole('button', { name: 'Eye level', exact: true }).click();
      const eye = await shot();
      assertColour(colourMetrics(eye, night), limits, `${label} eye level`);
      assert.equal(
        await page.getByRole('button', { name: 'Full colour', exact: true }).getAttribute('aria-pressed'),
        'true',
      );
    }
    await page.getByRole('button', { name: 'Monochrome', exact: true }).click();
    await page.getByRole('button', { name: 'Next seed', exact: true }).click();
    await ready();
    assert.equal(
      await page.getByRole('button', { name: 'Monochrome', exact: true }).getAttribute('aria-pressed'),
      'true',
      'Seed change reset appearance',
    );
    await page.getByRole('button', { name: 'Full colour', exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.getByRole('button', { name: 'Monochrome', exact: true }).click();
    await page.getByRole('button', { name: 'Full colour', exact: true }).click();
    await ready();
    await page.goto(`${url}/lab/`);
    const gallery = page.locator('a[href="/lab/pixel-still/"] canvas');
    await gallery.scrollIntoViewIfNeeded();
    await page.waitForFunction(
      () => document.querySelector('a[href="/lab/pixel-still/"] canvas')?.dataset.ready === '1',
    );
    const galleryColour = await gallery.screenshot();
    assertColour(colourMetrics(galleryColour, night), limits, `Room gallery · ${fallback ? 'fallback' : 'WebGL'}`);
    writeFileSync(`figures-out/room-gallery-colour-${fallback ? 'fallback' : 'webgl'}.png`, galleryColour);
    await writeSheet(
      browser,
      `figures-out/room-colour-${fallback ? 'fallback' : 'webgl'}.png`,
      {
        id: 'Room colour and monochrome',
        style: fallback ? '2D fallback' : 'Three.js · textured PBR',
        motion: 'still / seeded',
        answers: true,
        bleed: false,
      },
      shots,
      [],
    );
    await context.close();
  }
  assert.deepEqual(errors, []);
  writeFileSync('figures-out/room-colour-report.json', JSON.stringify(report, null, 2) + '\n');
  console.log(
    'Room colour passed: nine themes × WebGL/fallback × eye/isometric, reversible colour/monochrome controls, appearance-synced previews, a colour gallery, stable textures, contrast/highlight guards and mobile width.',
  );
} finally {
  await browser.close();
}
