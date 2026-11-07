/** Exercise every theme and seed controls with both real WebGL and forced fallback. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { writeSheet } from './sheet.mjs';
import { decode, measure } from './pixels.mjs';
import { checkRoomCamera, checkRoomTouch } from './tabletop-room-browser.mjs';

const scratch = mkdtempSync(join(tmpdir(), 'tabletop-browser-'));
const arg = process.argv.find((a) => a.startsWith('--url='));
const url = arg ? arg.slice(6) : 'http://127.0.0.1:4427';
const server = arg
  ? null
  : spawn(process.execPath, ['node_modules/astro/astro.js', 'dev', '--host', '127.0.0.1', '--port', '4427'], {
      stdio: 'ignore',
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
      detached: true,
    });
let browser;
try {
  if (server)
    for (let k = 0; k < 60; k++) {
      if (
        await fetch(`${url}/lab/`)
          .then((r) => r.ok)
          .catch(() => false)
      )
        break;
      await new Promise((r) => setTimeout(r, 500));
    }
  const file = join(scratch, 'planner.mjs');
  await build({
    stdin: {
      contents:
        "export {arrange,THEMES} from './src/figures/kit/tabletop'; export {mulberry32} from './src/figures/kit/rng';",
      resolveDir: process.cwd(),
      loader: 'ts',
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: file,
  });
  const { arrange, THEMES, mulberry32 } = await import(pathToFileURL(file));
  const examples = new Map();
  for (let seed = 0; seed < 500 && examples.size < THEMES.length; seed++) {
    const p = arrange(mulberry32((seed ^ 0x9e3779b9) >>> 0));
    if (!examples.has(p.theme.id)) examples.set(p.theme.id, { seed, theme: p.theme });
  }
  assert.equal(examples.size, 9);
  browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 1000 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage(),
    errors = [];
  const noise = /\[vite\]|React DevTools|GroupMarkerNotSet|GL Driver Message|enable-unsafe-swiftshader/;
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (['error', 'warning'].includes(m.type()) && !noise.test(m.text())) errors.push(m.text());
  });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ status: 200, body: '' }));
  const thresholds = JSON.parse(readFileSync('scripts/figures/thresholds.json', 'utf8'));
  mkdirSync('figures-out', { recursive: true });
  const shots = [];
  for (const theme of THEMES) {
    const { seed } = examples.get(theme.id);
    await page.goto(`${url}/figures?only=pixel-still~${seed}&w=640&t=0.8`);
    const canvas = page.locator(`[data-bench-figure="pixel-still~${seed}"] canvas`);
    await canvas.waitFor();
    await page.waitForFunction(() => document.querySelector('canvas')?.dataset.ready === '1');
    assert.equal(await canvas.getAttribute('data-error'), null, `${theme.id} failed to draw`);
    assert.equal(await canvas.getAttribute('data-renderer'), 'webgl');
    const alt = await canvas.getAttribute('aria-label');
    assert(alt.includes(theme.name.toLowerCase()));
    let png = await canvas.screenshot();
    for (let retry = 0; retry < 3 && measure(decode(png), thresholds).coverage < thresholds.coverageMin; retry++) {
      await page.waitForTimeout(150);
      png = await canvas.screenshot();
    }
    assert(measure(decode(png), thresholds).coverage >= thresholds.coverageMin, `${theme.id} rendered blank`);
    writeFileSync(`figures-out/tabletop-${theme.id}.png`, png);
    shots.push({ label: `${theme.name} · seed ${seed}`, alt, png });
  }
  await ctx.close();
  await writeSheet(
    browser,
    join(process.cwd(), 'figures-out/tabletop-themes.png'),
    {
      id: 'Nine tabletop themes',
      style: 'three · WebGL',
      motion: 'seeded functional layouts',
      answers: true,
      bleed: false,
    },
    shots,
    shots.map((s) => ({ level: 'ok', text: s.label })),
  );
  const roomShots = [],
    isoShots = [];
  for (const fallback of [false, true]) {
    const c = await browser.newContext({ viewport: { width: 1200, height: 1000 }, reducedMotion: 'reduce' });
    const p = await c.newPage();
    p.on('pageerror', (e) => errors.push(e.message));
    p.on('console', (m) => {
      if (/Too many active WebGL contexts|CONTEXT_LOST_WEBGL/.test(m.text())) errors.push(m.text());
    });
    await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ status: 200, body: '' }));
    if (fallback)
      await p.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
          return kind === 'webgl' || kind === 'webgl2' ? null : original.call(this, kind, ...args);
        };
      });
    await p.goto(`${url}/lab/pixel-still/?seed=7`);
    const ready = async () => {
      await p.waitForFunction(() => document.querySelector('.lab-main canvas')?.dataset.ready === '1');
      assert.equal(await p.locator('.lab-main canvas').getAttribute('data-error'), null, 'Main canvas failed to draw');
    };
    await ready();
    assert.equal(await p.locator('.lab-main canvas').getAttribute('data-renderer'), fallback ? '2d-fallback' : 'webgl');
    await p.getByRole('button', { name: 'Next seed', exact: true }).click();
    await p.waitForURL(/seed=8/);
    await ready();
    await p.getByRole('button', { name: 'Previous seed', exact: true }).click();
    await p.waitForURL(/seed=7/);
    await ready();
    const input = p.locator('.lab-seed input');
    await input.fill('42');
    await input.press('Enter');
    await p.waitForURL(/seed=42/);
    await ready();
    const png = await p.locator('.lab-main canvas').screenshot();
    assert(measure(decode(png), thresholds).coverage >= thresholds.coverageMin, 'Main canvas rendered blank');
    writeFileSync(`figures-out/tabletop-${fallback ? 'fallback' : 'webgl'}.png`, png);
    roomShots.push(...(await checkRoomCamera(p, fallback, thresholds)));
    if (!fallback) {
      await p.getByRole('button', { name: 'Isometric', exact: true }).click();
      for (const theme of THEMES) {
        const { seed } = examples.get(theme.id);
        await p.locator('.lab-seed input').fill(String(seed));
        await p.locator('.lab-seed input').press('Enter');
        await p.waitForURL(new RegExp(`seed=${seed}$`));
        await ready();
        const png = await p.locator('.lab-main canvas').screenshot(),
          m = measure(decode(png), thresholds);
        assert(
          m.coverage >= thresholds.coverageMin && m.coverage <= thresholds.coverageMax,
          `${theme.id} isometric framing`,
        );
        assert(m.offPalette <= thresholds.offPaletteMax, `${theme.id} isometric palette`);
        writeFileSync(`figures-out/room-isometric-${theme.id}.png`, png);
        isoShots.push({ label: `${theme.name} · seed ${seed}`, png });
      }
    }
    await p.setViewportSize({ width: 390, height: 844 });
    await p.waitForTimeout(200);
    assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await checkRoomTouch(p);
    await p.getByRole('button', { name: 'roll', exact: true }).click();
    await ready();
    await c.close();
  }
  await writeSheet(
    browser,
    join(process.cwd(), 'figures-out/room-camera-views.png'),
    {
      id: '180° room camera',
      style: 'three · perspective and isometric',
      motion: 'drag / slider / keyboard',
      answers: true,
      bleed: false,
    },
    roomShots,
    [],
  );
  await writeSheet(
    browser,
    join(process.cwd(), 'figures-out/room-isometric-themes.png'),
    {
      id: 'Nine furnished isometric rooms',
      style: 'three · WebGL · PCSS shadows',
      motion: 'seeded room dressing',
      answers: true,
      bleed: false,
    },
    isoShots,
    [],
  );
  assert.deepEqual(errors, []);
  console.log(
    'All 9 rooms, WebGL/fallback, 180° sweep, true isometric projection, drag, keyboard, zoom, seed controls and mobile width passed. Wrote figures-out/tabletop-themes.png and room-camera-views.png',
  );
} finally {
  await browser?.close();
  if (server?.pid) process.kill(-server.pid);
  rmSync(scratch, { recursive: true, force: true });
}
