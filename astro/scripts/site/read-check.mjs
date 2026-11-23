#!/usr/bin/env node
// Readability of the reading pages, measured on the built site the way a reader meets it:
//  - size: body text at least `minPx` CSS pixels, at desktop and phone width;
//  - leading: line height at least `minLeading` times the text size;
//  - measure: characters per line of running paragraphs between `measure.desktop` at desktop and
//    at least `measure.phoneMin` on a phone, counted from the lines the browser actually laid out.
// Body text is every paragraph and list item in <main>, outside code, figures, captions, asides,
// nav and footer. The limits and why each was chosen are in readability.json.
// Usage: node scripts/site/read-check.mjs --url=http://127.0.0.1:4410 [--routes=/about/] [--selftest]
// Needs a built site being served (npx astro build, then any static server on dist/).
import { chromium } from 'playwright';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const LIMITS = JSON.parse(readFileSync(join(ROOT, 'scripts/site/readability.json'), 'utf8'));
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=').slice(1).join('=');

/** The reading pages: every library piece and the About page. */
function readingRoutes() {
  const lib = join(ROOT, 'dist/library');
  const reserved = new Set(['lessons', 'articles']);
  const pieces = readdirSync(lib, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !reserved.has(d.name))
    .filter((d) => !readFileSync(join(lib, d.name, 'index.html'), 'utf8').includes('http-equiv="refresh"'))
    .map((d) => `/library/${d.name}/`);
  return ['/about/', ...pieces.sort()];
}

/** Runs in the page: size, leading and characters per line of each body paragraph. */
function measure() {
  const SKIP = 'pre, code, figure, figcaption, aside, nav, footer, table, [aria-hidden="true"]';
  const out = [];
  for (const el of document.querySelectorAll('main p, main li')) {
    if (el.closest(SKIP) || el.querySelector('p, li')) continue;
    const text = el.innerText.replace(/\s+/g, ' ').trim();
    const s = getComputedStyle(el);
    if (text.length < 40 || s.display === 'none' || s.visibility === 'hidden') continue;
    const size = parseFloat(s.fontSize);
    const lh = s.lineHeight === 'normal' ? size * 1.2 : parseFloat(s.lineHeight);
    const range = document.createRange();
    range.selectNodeContents(el);
    const tops = new Set([...range.getClientRects()].filter((r) => r.width > 1).map((r) => Math.round(r.top / 2)));
    out.push({ prose: el.tagName === 'P', text: text.slice(0, 40), size, leading: lh / size, lines: tops.size, chars: text.length });
  }
  return out;
}

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

/** What a page breaks, from its paragraphs at one width. */
export function judge(paras, view) {
  const out = [];
  const small = paras.filter((p) => p.size < LIMITS.minPx);
  if (small.length) out.push(`text under ${LIMITS.minPx}px (${small[0].size}px: "${small[0].text}")`);
  const tight = paras.filter((p) => p.leading < LIMITS.minLeading);
  if (tight.length) out.push(`line height under ${LIMITS.minLeading} (${tight[0].leading.toFixed(2)}: "${tight[0].text}")`);
  // Characters per line from running paragraphs of 3 lines or more, so a short last line does not
  // count; a list item or a card's text is set to its own column, not the reading measure.
  const full = paras.filter((p) => p.prose && p.lines >= 3).map((p) => p.chars / p.lines);
  if (full.length) {
    const cpl = median(full);
    const [lo, hi] = view === 'desktop' ? LIMITS.measure.desktop : [LIMITS.measure.phoneMin, Infinity];
    if (cpl < lo || cpl > hi) out.push(`${Math.round(cpl)} characters per line (wants ${lo} to ${hi === Infinity ? 'any' : hi})`);
  }
  return out;
}

async function check(browser, base, routes) {
  const problems = [];
  for (const [vw, vh, view] of [[1280, 900, 'desktop'], [390, 820, 'phone']]) {
    const page = await browser.newPage({ viewport: { width: vw, height: vh } });
    for (const r of routes) {
      await page.goto(base + r, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const paras = await page.evaluate(measure);
      for (const p of judge(paras, view)) problems.push(`${r} [${view}] ${p}`);
    }
    await page.close();
  }
  return problems;
}

async function selftest(browser) {
  const para = 'The quick brown fox jumps over the lazy dog while the reader keeps reading line after line. '.repeat(6);
  const page = (css) =>
    `data:text/html,${encodeURIComponent(`<style>body{margin:0}main{${css}}</style><main><p>${para}</p><p>${para}</p></main>`)}`;
  const cases = [
    ['a page that reads well', 'font:18px/1.6 serif;max-width:28em', 0],
    ['text too small', 'font:13px/1.6 serif;max-width:28em', 1],
    ['lines too tight', 'font:18px/1.1 serif;max-width:28em', 1],
    ['lines too long', 'font:18px/1.6 serif;max-width:none', 1],
    ['lines too short', 'font:18px/1.6 serif;max-width:12em', 1],
  ];
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  let bad = 0;
  for (const [name, css, want] of cases) {
    await p.goto(page(css));
    const found = judge(await p.evaluate(measure), 'desktop');
    if (found.length !== want) {
      bad++;
      console.error(`selftest: ${name}: expected ${want} problems, got ${found.join('; ') || 'none'}`);
    }
  }
  await p.close();
  if (bad) process.exit(1);
  console.log(`read-check selftest: ${cases.length} cases caught as expected`);
}

const browser = await chromium.launch();
if (process.argv.includes('--selftest')) await selftest(browser);
else {
  const routes = arg('routes')?.split(',') ?? readingRoutes();
  const problems = await check(browser, arg('url') ?? 'http://127.0.0.1:4410', routes);
  for (const p of problems) console.error(p);
  console.log(`read-check: ${routes.length} reading pages at desktop and phone, ${problems.length} problems`);
  if (problems.length) process.exitCode = 1;
}
await browser.close();
