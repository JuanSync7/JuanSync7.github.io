import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { decode } from './pixels.mjs';
import { PNG } from 'pngjs';
const baseline = process.argv.includes('--baseline'),
  eyesOnly = process.argv.includes('--eyes-only'),
  out = process.argv.find((a) => a.startsWith('--out='))?.slice(6) ?? 'figures-out/room-tone';
mkdirSync(out, { recursive: true });
const report = { schema: 'room-tone-check/1', passed: false, baseline, eyesOnly, rooms: [], rejected: [], errors: [] };
const save = () => writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2) + '\n');
save();
const bundle = await build({
  entryPoints: ['scripts/figures/room-tone-entry.mjs'],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  write: false,
});
const html = '<html><style>body{margin:0;background:#07080c}canvas{display:block}</style><canvas></canvas></html>';
const fixtures = [
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
function stats(png, mask, entities) {
  const image = decode(png),
    ids = decode(mask),
    groups = {};
  for (const e of entities) groups[e.role] ??= [];
  for (let y = 1; y < image.height - 1; y++)
    for (let x = 1; x < image.width - 1; x++) {
      const at = (y * image.width + x) * 4,
        id = ids.data[at + 1],
        e = entities[id - 1];
      if (!e || ids.data[at] || ids.data[at + 2]) continue;
      if ([-1, 1, -image.width, image.width].some((d) => ids.data[at + d * 4 + 1] !== id)) continue;
      const [r, g, b] = image.data.subarray(at, at + 3);
      groups[e.role].push((r * 0.2126 + g * 0.7152 + b * 0.0722) / 255);
    }
  const result = {};
  for (const [role, values] of Object.entries(groups)) {
    values.sort((a, b) => a - b);
    const q = (p) => values[Math.floor((values.length - 1) * p)] ?? 0;
    result[role] = {
      pixels: values.length,
      q10: q(0.1),
      median: q(0.5),
      q90: q(0.9),
      midtones: values.filter((v) => v >= 48 / 255 && v <= 208 / 255).length / Math.max(1, values.length),
    };
  }
  return result;
}
function assertTones(m, label) {
  // Dark tiled/brick rooms keep a lower wall value than plaster; neither may collapse into black.
  assert(m.wall.median >= 45 / 255, `${label}: walls lose midtones (${m.wall.median})`);
  assert(m.furniture.median >= 45 / 255, `${label}: furniture collapses into black (${m.furniture.median})`);
  assert(m.table.median >= 55 / 255, `${label}: table has no readable midtone (${m.table.median})`);
  assert(m.wall.q90 - m.wall.q10 >= 0.08, `${label}: flat wall gradients`);
  assert(m.furniture.q90 - m.furniture.q10 >= 0.1, `${label}: flat furniture gradients`);
  assert(m.table.q90 - m.table.q10 >= 0.06, `${label}: flat table gradients`);
}
function rejectMutations(png, mask, entities) {
  const ids = decode(mask);
  for (const mutation of ['crushed-furniture', 'flattened-wall', 'flattened-table']) {
    const image = decode(png);
    for (let at = 0; at < image.data.length; at += 4) {
      const role = entities[ids.data[at + 1] - 1]?.role;
      if (
        (mutation === 'crushed-furniture' && role === 'furniture') ||
        (mutation === 'flattened-wall' && role === 'wall') ||
        (mutation === 'flattened-table' && role === 'table')
      )
        image.data.fill(mutation === 'crushed-furniture' ? 8 : 85, at, at + 3);
    }
    assert.throws(() => assertTones(stats(PNG.sync.write(image), mask, entities), mutation));
    report.rejected.push(mutation);
  }
}
function assertCeiling(m, label) {
  assert(m.ceiling.pixels >= 500, `${label}: ceiling missing from the eye view`);
  assert(m.ceiling.median >= 28 / 255, `${label}: ceiling panels collapse into black`);
  assert(m.ceiling.q90 - m.ceiling.q10 >= 0.04, `${label}: ceiling finish has no depth`);
}
if (!baseline) {
  const before = JSON.parse(readFileSync('scripts/figures/room-tone-before.json', 'utf8'));
  for (const r of before.rooms) {
    assert.throws(() => assertTones(r.metrics, `before/${r.theme}`), `${r.theme}: old crushed values escaped`);
    report.rejected.push(`before/${r.theme}`);
  }
  for (const r of before.eyes ?? []) {
    assert.throws(() => assertCeiling(r.metrics, `before/${r.renderer}/${r.theme}`));
    report.rejected.push(`before-ceiling/${r.renderer}/${r.theme}`);
  }
}
let browser;
try {
  browser = await chromium.launch();
  for (const fallback of [false, true]) {
    const context = await browser.newContext({ viewport: { width: 640, height: 356 } }),
      page = await context.newPage();
    page.on('pageerror', (e) => report.errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') report.errors.push(m.text());
    });
    await context.route('http://room-tone.test/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: route.request().url().endsWith('.js') ? 'text/javascript' : 'text/html',
        body: route.request().url().endsWith('.js') ? bundle.outputFiles[0].text : html,
      }),
    );
    await page.goto('http://room-tone.test/');
    for (const [theme, seed] of eyesOnly ? [] : fixtures) {
      let mono;
      for (const appearance of ['monochrome', 'colour']) {
        const r = await page.evaluate(
          async ({ seed, appearance, fallback }) => (await import('/entry.js')).renderCase(seed, appearance, fallback),
          { seed, appearance, fallback },
        );
        assert.equal(r.theme, theme);
        const png = Buffer.from(r.png.split(',')[1], 'base64'),
          mask = Buffer.from(r.mask.split(',')[1], 'base64'),
          metrics = stats(png, mask, r.entities);
        writeFileSync(`${out}/${r.renderer}-${theme}-${appearance}.png`, png);
        writeFileSync(`${out}/${r.renderer}-${theme}-mask.png`, mask);
        report.rooms.push({ theme, seed, appearance, renderer: r.renderer, view: 'isometric', angle: 135, metrics });
        save();
        if (appearance === 'monochrome') {
          mono = png;
          if (!baseline) {
            assertTones(metrics, `${r.renderer}/${theme}`);
            if (theme === 'dining') rejectMutations(png, mask, r.entities);
          }
        }
      }
      const restored = await page.evaluate(
        async ({ seed, fallback }) => (await import('/entry.js')).renderCase(seed, 'monochrome', fallback),
        { seed, fallback },
      );
      assert(mono.equals(Buffer.from(restored.png.split(',')[1], 'base64')), `${theme}: appearance failed to restore`);
    }
    for (const [theme, seed] of [
      ['study', 6],
      ['bar', 10],
    ]) {
      const r = await page.evaluate(
        async ({ seed, fallback }) => (await import('/entry.js')).renderCase(seed, 'monochrome', fallback, 'eye', 90),
        { seed, fallback },
      );
      const png = Buffer.from(r.png.split(',')[1], 'base64'),
        mask = Buffer.from(r.mask.split(',')[1], 'base64'),
        metrics = stats(png, mask, r.entities);
      assert.equal(r.theme, theme);
      writeFileSync(`${out}/${r.renderer}-${theme}-eye-monochrome.png`, png);
      writeFileSync(`${out}/${r.renderer}-${theme}-eye-mask.png`, mask);
      report.rooms.push({
        theme,
        seed,
        appearance: 'monochrome',
        renderer: r.renderer,
        view: 'eye',
        angle: 90,
        metrics,
      });
      save();
      if (!baseline) {
        assertCeiling(metrics, `${r.renderer}/${theme}`);
        if (theme === 'study') {
          const broken = decode(png),
            ids = decode(mask);
          for (let at = 0; at < broken.data.length; at += 4)
            if (r.entities[ids.data[at + 1] - 1]?.role === 'ceiling') broken.data.fill(8, at, at + 3);
          assert.throws(() => assertCeiling(stats(PNG.sync.write(broken), mask, r.entities), 'crushed ceiling'));
          report.rejected.push(`crushed-ceiling/${r.renderer}`);
        }
      }
      await page.evaluate(
        async ({ seed, fallback }) => (await import('/entry.js')).renderCase(seed, 'colour', fallback, 'eye', 90),
        { seed, fallback },
      );
      const restored = await page.evaluate(
        async ({ seed, fallback }) => (await import('/entry.js')).renderCase(seed, 'monochrome', fallback, 'eye', 90),
        { seed, fallback },
      );
      assert(
        png.equals(Buffer.from(restored.png.split(',')[1], 'base64')),
        `${theme}: eye appearance failed to restore`,
      );
    }
    await context.close();
  }
  assert.deepEqual(report.errors, []);
  report.passed = !baseline;
  save();
  console.log(
    `${baseline ? 'Baseline captured' : 'Room tonal separation passed'}: ${report.rooms.length} actual renders with eroded entity-ID masks.`,
  );
} finally {
  await browser?.close();
}
