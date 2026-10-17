#!/usr/bin/env node
/**
 * The figure look: `node scripts/figures/look.mjs [id ...] [--fixtures] [--selftest] [--url URL] [--no-sheet]`.
 * It opens each figure on the bench (/figures?only=<id>) in headless Chromium, takes the
 * pictures below, measures them, writes one sheet per figure to figures-out/<id>.png, and
 * exits 1 if any figure fails. Without --url it starts `astro dev` itself and stops it after.
 *
 *   rest     frozen at restT            later    frozen at laterT
 *   answer   frozen at laterT, pointer held at answerAt
 *   phone    rest, at phoneWidth        live     running for liveWaitMs (frame time, console)
 *   reduced  live under prefers-reduced-motion, twice, a second apart
 *
 * Each problem line starts with its code:
 *   load     the figure never drew (or set data-error)       console  an error or warning was logged
 *   blank    almost no ink (rest or phone)                    wash     ink covers too much of the frame
 *   palette  colour outside the night tokens                  signal   the signal covers too much of the ink
 *   motion   ambient but frozen, or still/responsive but drifting
 *   answer   declares answers but the pointer changes nothing, or the reverse
 *   reduced  still moving under reduced motion                perf     frame time over budget
 *   seed     a template draws (nearly) the same picture for different seeds
 * and `warn` lines (not failing): no signal at all, frame time near the budget, ink on the border.
 *
 * A template (src/figures/templates) is looked at once per seed in thresholds.json
 * `templateSeeds`, as the instances `<template>~<seed>`: every instance must pass every check
 * above, and the instances' rest frames must differ from each other by at least `seedMin`
 * of their ink (the mean change per pixel over the larger of the two ink coverages).
 * Each instance gets its own sheet; `<template>.png` lays the seeds side by side.
 *
 * --selftest runs the fixtures and fails unless each reports exactly its `// expect-look:` codes.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { FIG_DIR, FIX_DIR, FIX_TPL_DIR, ROOT, TPL_DIR, figureFiles, readMeta } from './source.mjs';
import { decode, diff, measure } from './pixels.mjs';
import { writeSheet } from './sheet.mjs';

const TH = JSON.parse(readFileSync(join(ROOT, 'scripts', 'figures', 'thresholds.json'), 'utf8'));
const OUT = join(ROOT, 'figures-out');
const args = process.argv.slice(2);
const selftest = args.includes('--selftest');
const fixtures = selftest || args.includes('--fixtures');
const urlArg = args.find((a) => a.startsWith('--url='))?.slice(6);
const sheets = !args.includes('--no-sheet');
const only = args.filter((a) => !a.startsWith('--'));

async function serve() {
  if (urlArg) return { url: urlArg.replace(/\/$/, ''), stop: () => undefined };
  const port = 4399;
  const child = spawn('npx', ['astro', 'dev', '--port', String(port), '--host', '127.0.0.1'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
  const url = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 180; i++) {
    try {
      const r = await fetch(`${url}/figures`);
      if (r.ok) return { url, stop: () => process.kill(-child.pid) };
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  process.kill(-child.pid);
  throw new Error('astro dev did not start within 90 s');
}

/** Console lines that come from the harness, not the figure: the dev server's HMR client,
 *  React's devtools hint, and headless Chromium's software WebGL, which warns that its
 *  fallback is deprecated and that screenshots stall the GPU on every read-back. */
const NOISE = /\[vite\]|Download the React DevTools|GroupMarkerNotSet|GL Driver Message|enable-unsafe-swiftshader/;

/** Loads every figure once before any shot, so the dev server has compiled each module and
 *  finished bundling dependencies. A first request can otherwise land mid-re-bundle and fail
 *  with a 504 that says nothing about the figure. */
async function warm(browser, url) {
  const page = await browser.newPage();
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto(`${url}/figures${fixtures ? '?fixtures=1' : ''}`, { waitUntil: 'load' });
    const settled = await page
      .waitForFunction(() => document.querySelector('[data-bench-error]') !== null || [...document.querySelectorAll('canvas')].some((c) => c.dataset.ready === '1'), null, { timeout: 30000 })
      .then(() => page.$('[data-bench-error]'))
      .catch(() => 'timeout');
    if (settled === null) break;
  }
  await page.close();
}

async function shoot(browser, url, id, { query = '', width = TH.width, viewport = 1280, reduced = false, live = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: viewport, height: 900 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  // Webfonts are not the figure's business, and the sandbox may have no network: answer
  // them empty so a missing font neither stalls a shot nor logs an error.
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const logs = [];
  page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && !NOISE.test(m.text()) && logs.push(`${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
  const q = `only=${id}&w=${width}${fixtures ? '&fixtures=1' : ''}${query}`;
  await page.goto(`${url}/figures?${q}`, { waitUntil: 'load' });
  const sel = `[data-bench-figure="${id}"]`;
  const state = { ready: false, error: null, msAvg: 0, msMax: 0, readout: '', renderer: '' };
  try {
    await page.waitForSelector(`${sel} canvas[data-ready="1"], [data-bench-error]`, { timeout: 25000 });
    const failed = await page.$eval('[data-bench-error]', (p) => p.getAttribute('data-bench-error')).catch(() => null);
    if (failed) state.error = `module failed to load: ${failed}`;
    else state.ready = true;
  } catch {
    state.error = await page.$eval(`${sel} canvas`, (c) => c.dataset.error ?? null).catch(() => 'never rendered');
  }
  const shots = [];
  if (state.ready) {
    if (live) await page.waitForTimeout(TH.liveWaitMs);
    // Measure the canvas alone: the read-out overlay is page chrome, not the drawing.
    const clip = await page.locator(`${sel} canvas`).boundingBox();
    const snap = async () => {
      try {
        return await page.screenshot({ clip: clip ?? undefined, animations: 'disabled', timeout: 15000 });
      } catch (err) {
        const alive = await Promise.race([page.evaluate(() => 'responsive'), new Promise((r) => setTimeout(() => r('main thread blocked'), 3000))]);
        throw new Error(`screenshot of ${id} (${query || 'live'}, ${viewport}px) failed; page ${alive}; clip ${JSON.stringify(clip)}: ${err.message.split('\n')[0]}`);
      }
    };
    shots.push(await snap());
    if (reduced) {
      await page.waitForTimeout(1000);
      shots.push(await snap());
    }
    const d = await page.$eval(`${sel} canvas`, (c) => ({ avg: Number(c.dataset.msAvg ?? 0), max: Number(c.dataset.msMax ?? 0), err: c.dataset.error ?? null, read: c.dataset.readout ?? '', gl: c.dataset.renderer ?? '' }));
    state.renderer = d.gl;
    state.msAvg = d.avg;
    state.msMax = d.max;
    state.error = d.err;
    state.readout = d.read;
  }
  await ctx.close();
  return { ...state, shots, logs };
}

async function lookOne(browser, url, fig) {
  const t = (s) => `&t=${s}`;
  const rest = await shoot(browser, url, fig.id, { query: t(TH.restT) });
  const later = await shoot(browser, url, fig.id, { query: t(TH.laterT) });
  const answer = await shoot(browser, url, fig.id, { query: `${t(TH.laterT)}&at=${TH.answerAt.join(',')}` });
  const phone = await shoot(browser, url, fig.id, { query: t(TH.restT), width: TH.phoneWidth, viewport: 390 });
  const live = await shoot(browser, url, fig.id, { live: true });
  const reduced = await shoot(browser, url, fig.id, { reduced: true });
  const all = { rest, later, answer, phone, live, reduced };
  const fails = [];
  const warns = [];
  const note = { fail: (code, text) => fails.push({ code, text }), warn: (text) => warns.push(text) };
  const broken = Object.entries(all).find(([, s]) => !s.ready || s.error);
  if (broken) note.fail('load', `${broken[0]}: ${broken[1].error ?? 'did not render'}`);
  const logs = [...new Set(Object.values(all).flatMap((s) => s.logs))];
  if (logs.length) note.fail('console', logs.slice(0, 3).join(' | '));
  if (broken) return { fig, fails, warns, shots: [], metrics: {} };

  const img = (s, i = 0) => decode(s.shots[i]);
  const m = measure(img(rest), TH);
  const mp = measure(img(phone), TH);
  const motion = diff(img(rest), img(later));
  const answerD = diff(img(later), img(answer));
  const reducedD = diff(img(reduced, 0), img(reduced, 1));
  if (m.coverage < TH.coverageMin || mp.coverage < TH.coverageMin) note.fail('blank', `ink covers ${(m.coverage * 100).toFixed(2)}% (phone ${(mp.coverage * 100).toFixed(2)}%); at least ${TH.coverageMin * 100}%`);
  if (m.coverage > TH.coverageMax) note.fail('wash', `ink covers ${(m.coverage * 100).toFixed(1)}% of the frame; at most ${TH.coverageMax * 100}%`);
  else if (m.coverage > TH.coverageWarn) note.warn(`ink covers ${(m.coverage * 100).toFixed(1)}%: heavy for a minimal figure`);
  if (m.offPalette > TH.offPaletteMax) note.fail('palette', `${(m.offPalette * 100).toFixed(2)}% of pixels are a colour outside the tokens`);
  if (m.signalShare > TH.signalShareMax) note.fail('signal', `the signal is ${(m.signalShare * 100).toFixed(0)}% of the ink; at most ${TH.signalShareMax * 100}%`);
  else if (m.signalPixels === 0) note.warn('no signal at rest: one bright mark should say where to look');
  if (fig.motion === 'ambient' && motion < TH.motionMin) note.fail('motion', `declared ambient, but ${TH.restT}s and ${TH.laterT}s differ by only ${motion.toFixed(5)}`);
  if (fig.motion !== 'ambient' && motion > TH.stillMax) note.fail('motion', `declared ${fig.motion}, but it changes on its own (${motion.toFixed(5)})`);
  if (fig.answers && answerD < TH.answerMin) note.fail('answer', `declares answers, but the pointer changes only ${answerD.toFixed(5)}`);
  if (!fig.answers && answerD > TH.stillMax) note.fail('answer', `declares no answer, but the pointer changes it (${answerD.toFixed(5)})`);
  if (reducedD > TH.reducedMax) note.fail('reduced', `still moving under reduced motion (${reducedD.toFixed(5)})`);
  const budget = fig.three ? TH.msAvgMaxThree : TH.msAvgMax;
  if (live.msAvg > budget) note.fail('perf', `frames average ${live.msAvg.toFixed(1)} ms; at most ${budget}`);
  else if (!fig.three && live.msAvg > TH.msAvgWarn) note.warn(`frames average ${live.msAvg.toFixed(1)} ms, near the ${budget} ms budget`);
  if (live.msMax > TH.msPeakWarn) note.warn(`slowest frame ${live.msMax.toFixed(0)} ms`);
  if (fig.three && rest.renderer !== 'webgl') note.warn(`rendered the 2D fallback (${rest.renderer || 'unknown'}), not WebGL: the scene itself was not looked at`);
  if (!fig.bleed && m.borderInk > TH.borderWarn) note.warn(`ink on ${(m.borderInk * 100).toFixed(0)}% of the border: does it leave the frame?`);
  const metrics = { coverage: m.coverage, phoneCoverage: mp.coverage, signalShare: m.signalShare, offPalette: m.offPalette, motion, answer: answerD, reduced: reducedD, msAvg: live.msAvg, msMax: live.msMax };
  const shots = [
    { label: `rest t=${TH.restT}${rest.readout ? ` · reads "${rest.readout}"` : ''}`, png: rest.shots[0] },
    { label: `later t=${TH.laterT}`, png: later.shots[0] },
    { label: `answer at ${TH.answerAt.join(',')}${answer.readout ? ` · reads "${answer.readout}"` : ''}`, png: answer.shots[0] },
    { label: 'live', png: live.shots[0] },
    { label: `phone ${TH.phoneWidth}px`, png: phone.shots[0] },
    { label: 'reduced motion', png: reduced.shots[0] },
  ];
  return { fig: fig.three ? { ...fig, style: `three · ${rest.renderer || 'unknown renderer'}` } : fig, fails, warns, shots, metrics };
}

const pick = (f) => only.length === 0 || only.some((id) => f.endsWith(`/${id}.ts`));
const files = [...figureFiles(fixtures ? FIX_DIR : FIG_DIR), ...figureFiles(fixtures ? FIX_TPL_DIR : TPL_DIR)].filter(pick);
const figs = files.map(readMeta);
if (figs.length === 0) {
  console.log('look: no figures matched');
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });
const server = await serve();
const browser = await chromium.launch({ args: process.env.LOOK_GPU_FLAGS ? ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-angle=swiftshader'] : [] });
await warm(browser, server.url);
const results = [];
const lineList = (r) => {
  const lines = [...r.fails.map((f) => ({ level: 'fail', text: `${f.code}  ${f.text}` })), ...r.warns.map((w) => ({ level: 'warn', text: `warn  ${w}` }))];
  return lines.length ? lines : [{ level: 'ok', text: 'look passed' }];
};
const report = (r) => {
  console.log(`${r.fails.length ? 'FAIL' : 'ok  '}  ${r.fig.id}${r.metrics?.closestSeeds !== undefined ? ` (closest seeds ${r.metrics.closestSeeds.toFixed(3)})` : ''}`);
  for (const l of lineList(r)) if (l.level !== 'ok') console.log(`      ${l.text}`);
};

/** One template: every seed as its own instance, then the seeds against each other. */
async function lookTemplate(browser, url, tpl) {
  const runs = [];
  for (const seed of TH.templateSeeds) {
    const r = await lookOne(browser, url, { ...tpl, id: `${tpl.id}~${seed}`, template: false });
    runs.push({ seed, r });
    if (sheets && r.shots.length) await writeSheet(browser, join(OUT, `${tpl.id}~${seed}.png`), r.fig, r.shots, lineList(r));
  }
  const fails = runs.flatMap(({ seed, r }) => r.fails.map((f) => ({ code: f.code, text: `seed ${seed}: ${f.text}` })));
  const warns = runs.flatMap(({ seed, r }) => r.warns.map((w) => `seed ${seed}: ${w}`));
  const rests = runs.filter(({ r }) => r.shots.length).map(({ seed, r }) => ({ seed, png: r.shots[0].png }));
  let closest = Infinity;
  for (let i = 0; i < rests.length; i++) {
    for (let j = i + 1; j < rests.length; j++) {
      // The change is measured against the ink, not the frame: two sparse drawings that share
      // no line differ by little per pixel, yet are wholly different figures.
      const pa = decode(rests[i].png);
      const pb = decode(rests[j].png);
      const d = diff(pa, pb) / Math.max(1e-6, measure(pa, TH).coverage, measure(pb, TH).coverage);
      if (d < closest) closest = d;
      if (d < TH.seedMin) fails.push({ code: 'seed', text: `seeds ${rests[i].seed} and ${rests[j].seed} differ by only ${d.toFixed(3)} of their ink; at least ${TH.seedMin}` });
    }
  }
  const shots = rests.map(({ seed, png }) => ({ label: `seed ${seed} · rest`, png }));
  return { fig: { ...tpl, style: `${tpl.style} · template` }, fails, warns, shots, metrics: { closestSeeds: closest } };
}

try {
  for (const fig of figs) {
    const r = fig.template ? await lookTemplate(browser, server.url, fig) : await lookOne(browser, server.url, fig);
    results.push(r);
    report(r);
    if (sheets && r.shots.length) await writeSheet(browser, join(OUT, `${fig.id}.png`), r.fig, r.shots, lineList(r));
  }
} finally {
  await browser.close();
  server.stop();
}
writeFileSync(join(OUT, 'report.json'), JSON.stringify(results.map((r) => ({ id: r.fig.id, fails: r.fails, warns: r.warns, metrics: r.metrics })), null, 2));

if (selftest) {
  let bad = 0;
  for (const r of results) {
    const want = (r.fig.expectLook ?? '').split(',').map((x) => x.trim()).filter((x) => x && x !== 'none').sort();
    const got = [...new Set(r.fails.map((f) => f.code))].sort();
    const ok = want.join() === got.join();
    if (!ok) bad++;
    console.log(`${ok ? 'ok  ' : 'FAIL'}  ${r.fig.id.padEnd(16)} expected [${want.join(', ')}]  got [${got.join(', ')}]`);
  }
  console.log(bad ? `look selftest failed: ${bad} fixture(s)` : `look selftest passed: ${results.length} fixtures`);
  process.exit(bad ? 1 : 0);
}
const failed = results.filter((r) => r.fails.length);
console.log(failed.length ? `look failed: ${failed.length} of ${results.length} figure(s). Sheets in figures-out/` : `look passed: ${results.length} figure(s). Sheets in figures-out/`);
process.exit(failed.length ? 1 : 0);
