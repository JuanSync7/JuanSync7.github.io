/** Compare four public seeds within every theme, rather than only one example per theme. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { decode, diff } from './pixels.mjs';
import { colourMetrics, assertColour } from './room-colour-metrics.mjs';
import { nightInk } from './night-ink.mjs';
const url = (process.argv.find((a) => a.startsWith('--url='))?.slice(6) ?? 'http://127.0.0.1:4410').replace(/\/$/, '');
const report = { schema: 'room-variation-browser/1', passed: false, url, rooms: [], errors: [] };
mkdirSync('figures-out', { recursive: true });
const save = () => writeFileSync('figures-out/room-variation-report.json', JSON.stringify(report, null, 2) + '\n');
save();
execFileSync(process.execPath, ['scripts/figures/room-lighting-check.mjs'], { stdio: 'inherit' });
const fixtures = JSON.parse(readFileSync('figures-out/room-lighting-report.json')).examples.sort(
  (a, b) => a.theme.localeCompare(b.theme) || a.paletteVariant - b.paletteVariant,
);
const night = JSON.parse(readFileSync('scripts/figures/thresholds.json')),
  limits = JSON.parse(readFileSync('scripts/figures/room-colour-checks.json'));
function tones(png, label) {
  const m = colourMetrics(png, night),
    image = decode(png),
    bins = new Array(16).fill(0);
  for (let i = 0; i < image.data.length; i += 4) {
    const [r, g, b] = image.data.subarray(i, i + 3);
    if (Math.max(Math.abs(r - 7), Math.abs(g - 8), Math.abs(b - 12)) > night.inkDelta)
      bins[Math.min(15, Math.floor((r * 0.2126 + g * 0.7152 + b * 0.0722) / 16))]++;
  }
  assert(m.contrast >= 0.12, `${label}: crushed monochrome values ${m.contrast}`);
  assert(
    bins.filter((n) => n > image.width * image.height * 0.001).length >= 4,
    `${label}: insufficient monochrome gradation`,
  );
  assert(m.offPalette <= night.offPaletteMax, `${label}: monochrome hue drift`);
  assert(m.coverage <= night.coverageMax, `${label}: isometric frame coverage`);
  return { contrast: m.contrast, bins };
}
function changedRoomShare(a, b) {
  assert.equal(a.data.length, b.data.length);
  let room = 0,
    changed = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const occupied = [0, 1, 2].some(
      (k) =>
        Math.abs(a.data[i + k] - [7, 8, 12][k]) > night.inkDelta ||
        Math.abs(b.data[i + k] - [7, 8, 12][k]) > night.inkDelta,
    );
    if (occupied) {
      room++;
      if ([0, 1, 2].some((k) => Math.abs(a.data[i + k] - b.data[i + k]) > night.inkDelta)) changed++;
    }
  }
  return changed / Math.max(1, room);
}
let browser;
try {
  browser = await chromium.launch();
  for (const fallback of [false, true]) {
    const renderer = fallback ? 'fallback' : 'webgl',
      context = await browser.newContext({ viewport: { width: 1200, height: 1000 }, reducedMotion: 'reduce', colorScheme: 'dark' }),
      page = await context.newPage(),
      shots = [],
      first = new Map();
    // Measure the rooms on the night ground, as the other room audits do (the paper stage follows the page).
    await nightInk(page);
    await context.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ status: 200, body: '' }));
    if (fallback)
      await context.addInitScript(() => {
        const get = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
          return kind === 'webgl' || kind === 'webgl2' ? null : get.call(this, kind, ...args);
        };
      });
    page.on('pageerror', (e) => report.errors.push(e.message));
    page.on('console', (m) => {
      if (/CONTEXT_LOST_WEBGL|Too many active WebGL contexts|THREE.WebGLProgram: Shader Error/.test(m.text()))
        report.errors.push(m.text());
    });
    await page.goto(`${url}/lab/pixel-still/?seed=${fixtures[0].seed}`);
    await page.addStyleTag({
      content: '.lab-main{max-width:640px;width:100%;margin-inline:auto}.lab-strip{display:none}',
    });
    await page.waitForFunction(() => document.querySelector('.lab-main canvas')?.dataset.ready === '1', null, {
      timeout: 90000,
    });
    const canvas = page.locator('.lab-main canvas'),
      shot = async () => {
        await canvas.scrollIntoViewIfNeeded();
        await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
        return canvas.screenshot();
      };
    for (const f of fixtures) {
      await page.locator('.lab-seed input').fill(String(f.seed));
      await page.locator('.lab-seed input').press('Enter');
      await page.waitForURL(new RegExp(`seed=${f.seed}$`));
      await page.waitForFunction(() => document.querySelector('.lab-main canvas')?.dataset.ready === '1', null, {
        timeout: 90000,
      });
      assert.equal(await canvas.getAttribute('data-error'), null);
      assert.equal(await canvas.getAttribute('data-renderer'), fallback ? '2d-fallback' : 'webgl');
      await page.getByRole('button', { name: 'Isometric', exact: true }).click();
      await page.getByRole('button', { name: 'Full colour', exact: true }).click();
      const label = `${renderer}/${f.theme}/${f.seed}`,
        colour = await shot();
      assertColour(colourMetrics(colour, night), limits, label);
      writeFileSync(`figures-out/room-variant-${renderer}-${f.theme}-${f.paletteVariant}-colour.png`, colour);
      if (first.has(f.theme)) {
        const share = changedRoomShare(decode(first.get(f.theme)), decode(colour));
        assert(share > 0.15, `${label}: variants change too little of the room (${share})`);
      } else first.set(f.theme, colour);
      await page.getByRole('button', { name: 'Monochrome', exact: true }).click();
      const mono = await shot(),
        tonal = tones(mono, label);
      if (report.rooms.length === 0) {
        const flat = decode(mono);
        for (let i = 0; i < flat.data.length; i += 4) {
          const occupied = [0, 1, 2].some((k) => Math.abs(flat.data[i + k] - [7, 8, 12][k]) > night.inkDelta);
          if (occupied) flat.data.fill(80, i, i + 3);
        }
        assert.throws(() => tones(PNG.sync.write(flat), 'mutated flat room'), /crushed monochrome/);
        assert.equal(changedRoomShare(decode(colour), decode(colour)), 0, 'Identical room fixture');
        report.negativeFixture = 'flattened actual monochrome image and identical room';
      }
      await page.getByRole('button', { name: 'Full colour', exact: true }).click();
      const restored = await shot();
      assert(
        diff(decode(colour), decode(restored)) <= limits.stillDifferenceMax,
        `${label}: appearance failed to restore`,
      );
      const still = await shot();
      assert(diff(decode(restored), decode(still)) <= limits.stillDifferenceMax, `${label}: lighting changes at rest`);
      for (const [mode, png] of [
        ['colour', colour],
        ['mono', mono],
      ])
        writeFileSync(`figures-out/room-variant-${renderer}-${f.theme}-${f.paletteVariant}-${mode}.png`, png);
      shots.push({
        label: `${f.theme} · seed ${f.seed} · palette ${f.paletteVariant} / layout ${f.layoutVariant} / furniture ${f.furnitureVariant} / light ${f.lightVariant}`,
        colour,
        mono,
      });
      report.rooms.push({ ...f, renderer, tonal });
      if (f.paletteVariant === 3) console.log(`Reviewed fixtures captured: ${renderer}/${f.theme}`);
      save();
    }
    for (const mode of ['colour', 'mono']) {
      const sheet = await browser.newPage({ viewport: { width: 1520, height: 900 } });
      await sheet.setContent(
        `<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:20px;background:#07080c;color:#ddd;font:12px system-ui}h1{font-size:21px}main{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}figure{margin:0}img{width:100%;display:block}figcaption{line-height:1.5;padding:5px}</style><h1>Within-theme room variation · ${renderer} · ${mode}</h1><main>${shots.map((s) => `<figure><img src="data:image/png;base64,${s[mode].toString('base64')}"><figcaption>${s.label}</figcaption></figure>`).join('')}</main>`,
      );
      await sheet.locator('img').evaluateAll((images) => Promise.all(images.map((i) => i.decode())));
      await sheet.screenshot({ path: `figures-out/room-variants-${renderer}-${mode}.png`, fullPage: true });
      await sheet.close();
    }
    await context.close();
  }
  assert.equal(report.rooms.length, 72);
  assert.deepEqual(report.errors, []);
  report.passed = true;
  save();
  console.log(
    'Room variation passed: 36 same-theme seeded palettes × WebGL/fallback, neutral tonal depth, distinct rendered variants, reversible appearance and stillness. Read the four sheets.',
  );
} finally {
  await browser?.close();
}
