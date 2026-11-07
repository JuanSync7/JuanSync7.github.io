import { parseArgs } from 'node:util';
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { browserEnvironment, newPage } from './browser-kit.mjs';
import { loadKernel, ROOT } from './load.mjs';
import { sourceHash } from './fingerprint.mjs';
import { saveArtifact } from './artifacts.mjs';
import { decode, diff, measure } from '../figures/pixels.mjs';

const args = process.argv.slice(2),
  hash = sourceHash();
const { values } = parseArgs({ options: { url: { type: 'string' }, seeds: { type: 'string' } } });
const { template } = await loadKernel();
const seedArg = values.seeds;
if (seedArg !== undefined && seedArg.split(',').some((s) => !/^\d+$/.test(s)))
  throw new Error('Public seeds must be nonempty unsigned integer strings');
const strata = new Map();
for (let seed = 0; seed < 1000 && strata.size < 5; seed++) {
  const instance = template.instance(seed);
  if (!strata.has(instance.variant)) strata.set(instance.variant, seed);
}
const seeds = seedArg ? [...new Set(seedArg.split(',').map(Number))] : [...new Set([...strata.values(), 7, 42, 2026])];
if (!seeds.length || seeds.some((s) => !Number.isSafeInteger(s) || s < 0 || s > 999999999))
  throw new Error('Invalid public seed list');
const limits = JSON.parse(readFileSync(join(ROOT, 'scripts/figures/thresholds.json'), 'utf8'));
const out = join(ROOT, 'figures-out/deepdive');
mkdirSync(out, { recursive: true });
rmSync(join(out, 'browser.json'), { force: true });
const env = await browserEnvironment(args),
  failures = [],
  cases = [];
const artifacts = [];
const requireThat = (condition, at, issue) => {
  if (!condition) failures.push(`${at}: ${issue}`);
};
const inspectPixels = (png, at) => {
  const metrics = measure(decode(png), limits);
  requireThat(metrics.coverage >= limits.coverageMin, at, `blank (${metrics.coverage})`);
  requireThat(metrics.coverage <= limits.coverageMax, at, `wash (${metrics.coverage})`);
  requireThat(metrics.signalPixels > 0, at, 'missing selected teal part');
  requireThat(metrics.signalShare <= limits.signalShareMax, at, `signal share (${metrics.signalShare})`);
  requireThat(metrics.offPalette <= limits.offPaletteMax, at, `off palette (${metrics.offPalette})`);
  return metrics;
};
let phaseFrames = 0,
  handoffs = 0;
try {
  for (const seed of seeds) {
    const instance = template.instance(seed),
      id = instance.id,
      errors = [];
    const page = await newPage(env.browser);
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    const shot = async (query, filename) => {
      await page.goto(`${env.url}/figures?only=${id}&${query}`);
      await page.waitForSelector('canvas[data-ready="1"]');
      const canvas = page.locator('canvas');
      requireThat(!(await canvas.getAttribute('data-error')), id, 'canvas drawing error');
      const bytes = await canvas.screenshot();
      artifacts.push(saveArtifact(out, filename, bytes));
      return bytes;
    };
    const rest = await shot('w=1000&t=0.8', `public-${seed}-desktop.png`);
    const restMetrics = inspectPixels(rest, `${id}/desktop`);
    const replay = await shot('w=1000&t=0.8', `public-${seed}-replay.png`);
    requireThat(diff(decode(rest), decode(replay)) === 0, id, 'same seed/time differs on replay');
    await page.setViewportSize({ width: 390, height: 844 });
    inspectPixels(await shot('w=358&t=0.8', `public-${seed}-phone.png`), `${id}/phone`);
    await page.setViewportSize({ width: 1440, height: 1000 });
    const later = await shot('w=1000&t=2.6', `public-${seed}-later.png`);
    requireThat(diff(decode(rest), decode(later)) >= limits.motionMin, id, 'dive does not advance');
    const answer = await shot('w=1000&t=2.6&at=0.62,0.45', `public-${seed}-answer.png`);
    requireThat(diff(decode(later), decode(answer)) >= limits.answerMin, id, 'pointer does not slow the dive');

    // Exercise the actual mounted template across a complete six-level cycle. Direct
    // clock input makes even the terminal rollover reproducible without wall-clock waits.
    const cycle = await page.evaluate(async (seed) => {
      const { default: template } = await import('/src/figures/templates/zoom-dive.ts');
      const { tone } = await import('/src/figures/kit/ink.ts');
      const figure = template.instance(seed),
        p = figure.params;
      const canvas = document.createElement('canvas'),
        opaque = document.createElement('canvas');
      opaque.width = 1000;
      opaque.height = 500;
      const ctx = opaque.getContext('2d'),
        mounted = figure.mount(canvas);
      const start = p.start + 0.35;
      const frame = (u) => {
        mounted.resize(1000, 500, 1);
        mounted.frame({
          t: (u - start) / p.speed,
          dt: (u - start) / p.speed,
          hover: 0,
          pointer: { x: 0.5, y: 0.5, active: false },
          pulses: [],
          still: true,
        });
        ctx.fillStyle = tone('ground');
        ctx.fillRect(0, 0, 1000, 500);
        ctx.drawImage(canvas, 0, 0);
        return opaque.toDataURL();
      };
      const samples = [],
        boundaries = [];
      for (let n = p.start + 1; n <= p.start + 6; n++) {
        for (const phase of [0.05, 0.35, 0.7, 0.78, 0.88, 0.95, 0.98])
          samples.push({ u: n + phase, png: frame(n + phase) });
        boundaries.push({ n, before: frame(n - 1e-6), after: frame(n + 1e-6) });
        if (n % 6 === 5)
          for (const f of [0.78, 0.98])
            boundaries.push({ n: n + f, before: frame(n + f - 1e-6), after: frame(n + f + 1e-6) });
      }
      mounted.resize(1000, 500, 1);
      const timings = [];
      const levelTimings = Array.from({ length: 6 }, () => []);
      const frames = Math.ceil((6 / p.speed) * 60);
      for (let i = 0; i < frames; i++) {
        const begin = performance.now();
        mounted.frame({
          t: i / 60,
          dt: 1 / 60,
          hover: 0,
          pointer: { x: 0.5, y: 0.5, active: false },
          pulses: [],
          still: false,
        });
        const elapsed = performance.now() - begin;
        timings.push(elapsed);
        levelTimings[Math.floor(start + ((i + 1) / 60) * p.speed) % 6].push(elapsed);
      }
      mounted.dispose();
      return {
        samples,
        boundaries,
        frames,
        msAvg: timings.reduce((s, t) => s + t, 0) / timings.length,
        msMax: Math.max(...timings),
        levelMsAvg: levelTimings.map((ts) => ts.reduce((s, t) => s + t, 0) / Math.max(1, ts.length)),
      };
    }, seed);
    const buffer = (data) => Buffer.from(data.split(',')[1], 'base64');
    for (const sample of cycle.samples) {
      const bytes = buffer(sample.png);
      inspectPixels(bytes, `${id}/u=${sample.u}`);
      artifacts.push(saveArtifact(out, `public-${seed}-u-${sample.u.toFixed(2)}.png`, bytes));
      phaseFrames++;
    }
    for (const boundary of cycle.boundaries) {
      const difference = diff(decode(buffer(boundary.before)), decode(buffer(boundary.after)));
      requireThat(difference <= limits.reducedMax, `${id}/handoff ${boundary.n}`, `visible jump (${difference})`);
      for (const side of ['before', 'after'])
        artifacts.push(saveArtifact(out, `public-${seed}-handoff-${boundary.n}-${side}.png`, buffer(boundary[side])));
      handoffs++;
    }
    requireThat(cycle.msAvg <= limits.msAvgMax, id, `frame budget exceeded (${cycle.msAvg.toFixed(2)}ms)`);
    for (const [n, ms] of cycle.levelMsAvg.entries())
      requireThat(ms <= limits.msAvgMax, `${id}/level ${n}`, `frame budget exceeded (${ms.toFixed(2)}ms)`);
    // With reduced motion the shared clock must hold a real static drawing indefinitely.
    const reduced = await shot('w=1000', `public-${seed}-reduced.png`);
    await page.waitForTimeout(400);
    const held = await page.locator('canvas').screenshot();
    artifacts.push(saveArtifact(out, `public-${seed}-reduced-held.png`, held));
    requireThat(diff(decode(reduced), decode(held)) <= limits.reducedMax, id, 'reduced motion still animates');
    requireThat(errors.length === 0, id, `browser errors: ${errors.join('; ')}`);
    cases.push({
      seed,
      variant: instance.variant,
      params: instance.params,
      restMetrics,
      performanceFrames: cycle.frames,
      msAvg: cycle.msAvg,
      msMax: cycle.msMax,
      levelMsAvg: cycle.levelMsAvg,
      errors,
    });
    await page.close();
    console.log(
      `browser ${id}: ${instance.variant}; ${cycle.samples.length} phase frames, ${cycle.boundaries.length} handoffs, ${cycle.frames} measured frames, ${cycle.msAvg.toFixed(2)}ms/frame`,
    );
  }
  // Inspect the actual public layout too, including its seed controls and narrow viewport.
  const product = await newPage(env.browser);
  for (const width of [1440, 390]) {
    await product.setViewportSize({ width, height: 1000 });
    await product.goto(`${env.url}/lab/zoom-dive/?seed=42`);
    await product.waitForSelector('canvas[data-ready="1"]');
    artifacts.push(saveArtifact(out, `page-${width}.png`, await product.screenshot({ fullPage: true })));
    const overflow = await product.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    requireThat(!overflow, `public page/${width}`, 'horizontal overflow');
  }
  const selectSeed = async (seed) => {
    await product.locator('.lab-controls input').fill(String(seed));
    await product.locator('.lab-controls input').press('Enter');
    await product.waitForFunction((seed) => new URL(location.href).searchParams.get('seed') === String(seed), seed);
    await product.waitForSelector(`.lab-main [data-figure="zoom-dive~${seed}"] canvas[data-ready="1"]`);
  };
  await selectSeed(7);
  const beforeNavigation = await product.locator('.lab-main canvas').screenshot();
  await product.getByRole('button', { name: 'Next seed', exact: true }).click();
  await product.waitForSelector('.lab-main [data-figure="zoom-dive~8"] canvas[data-ready="1"]');
  requireThat(new URL(product.url()).searchParams.get('seed') === '8', 'seed controls', 'next seed did not update URL');
  await product.getByRole('button', { name: 'Previous seed', exact: true }).click();
  await product.waitForSelector('.lab-main [data-figure="zoom-dive~7"] canvas[data-ready="1"]');
  requireThat(
    diff(decode(beforeNavigation), decode(await product.locator('.lab-main canvas').screenshot())) === 0,
    'seed controls',
    'returning to a seed changed its drawing',
  );
  await product.reload();
  await product.waitForSelector('.lab-main [data-figure="zoom-dive~7"] canvas[data-ready="1"]');
  requireThat(
    diff(decode(beforeNavigation), decode(await product.locator('.lab-main canvas').screenshot())) === 0,
    'seed controls',
    'seed URL reload changed its drawing',
  );
  await selectSeed(0);
  requireThat(
    await product.getByRole('button', { name: 'Previous seed', exact: true }).isDisabled(),
    'seed controls',
    'previous seed enabled below zero',
  );
  await selectSeed(999999999);
  requireThat(
    await product.getByRole('button', { name: 'Next seed', exact: true }).isDisabled(),
    'seed controls',
    'next seed enabled above maximum',
  );
  await product.evaluate(() => {
    Object.defineProperty(crypto, 'getRandomValues', {
      value: (array) => {
        array[0] = 4294967295;
        return array;
      },
    });
  });
  await product.getByRole('button', { name: 'roll', exact: true }).click();
  await product.waitForFunction(() => new URL(location.href).searchParams.get('seed') === '294967295');
  const rolled = Number(new URL(product.url()).searchParams.get('seed'));
  requireThat(
    Number.isInteger(rolled) && rolled >= 0 && rolled <= 999999999,
    'seed controls',
    'roll produced an invalid seed',
  );
  await product.waitForSelector(`.lab-main [data-figure="zoom-dive~${rolled}"] canvas[data-ready="1"]`);
  await product.close();
  const live = await newPage(env.browser, 1440, 'no-preference');
  await live.goto(`${env.url}/figures?only=zoom-dive~42&w=1000`);
  await live.waitForSelector('canvas[data-ready="1"]');
  const first = await live.locator('canvas').screenshot();
  await live.waitForTimeout(800);
  const last = await live.locator('canvas').screenshot();
  requireThat(
    diff(decode(first), decode(last)) > limits.reducedMax,
    'live clock',
    'normal-motion canvas remained frozen',
  );
  await live.close();
} catch (error) {
  failures.push(`browser execution: ${error.stack ?? error.message}`);
} finally {
  await env.close();
}
if (sourceHash() !== hash) failures.push('Source changed during browser verification; rerun');
const report = {
  status: failures.length ? 'failed' : 'passed',
  passed: failures.length === 0,
  sourceHash: hash,
  seedNamespace: 'public',
  runtime: { node: process.version, chromium: env.browser.version(), url: env.url },
  counts: {
    publicSeeds: cases.length,
    phaseFrames,
    handoffs,
    performanceFrames: cases.reduce((s, c) => s + c.performanceFrames, 0),
  },
  cases,
  artifacts,
  failures,
  visualReview: 'required',
};
writeFileSync(join(out, 'browser.json'), JSON.stringify(report, null, 2));
for (const issue of failures) console.error(issue);
console.log(`deepdive browser: ${report.status}; ${phaseFrames} phase frames, ${handoffs} handoffs`);
process.exitCode = failures.length ? 1 : 0;
