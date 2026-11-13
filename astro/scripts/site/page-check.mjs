#!/usr/bin/env node
// Every built page, judged the way the owner judges it, before anyone looks:
//  - sideways overflow at desktop and phone width, console errors, figures that threw;
//  - 60/30/10: the share of the first screen that is ground (about 60), ink and structure
//    (about 30) and signal (at most 10), in both themes;
//  - text contrast: every visible text element against the ground it sits on (WCAG ratio;
//    4.5 for body text, 3 for large text).
// Usage: node scripts/site/page-check.mjs --url=http://127.0.0.1:4410 [--routes=/,/blog/] [--json=out.json]
// Needs a built site being served (npx astro build, then any static server on dist/).
import { chromium } from 'playwright';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { decode } from '../figures/pixels.mjs';

const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=').slice(1).join('=');
const base = arg('url') ?? 'http://127.0.0.1:4410';
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const routes = arg('routes')?.split(',') ?? walk(join(ROOT, 'dist')).filter((f) => f.endsWith('index.html')).map((f) => f.slice(join(ROOT, 'dist').length).replace(/index\.html$/, '')).sort();
// Pages that keep the night bench on purpose.
const NIGHT_ONLY = new Set(['/figures/']);
const SIGNAL_MAX = 0.1;
const GROUND_MIN = 0.45;

const lum = ([r, g, b]) => {
  const c = [r, g, b].map((v) => (v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);

/** Ground: within 10 of the page ground. Signal: saturated and orange-hued. Ink: the rest. */
function balance(png, ground) {
  let g = 0, s = 0, n = 0;
  for (let i = 0; i < png.data.length; i += 4 * 3) {
    const r = png.data[i], gg = png.data[i + 1], b = png.data[i + 2];
    n++;
    if (Math.abs(r - ground[0]) + Math.abs(gg - ground[1]) + Math.abs(b - ground[2]) < 30) g++;
    else if (r > 150 && r - b > 90 && r - gg > 40) s++;
  }
  return { ground: g / n, signal: s / n, ink: (n - g - s) / n };
}

const problems = [];
const report = [];
const browser = await chromium.launch();
for (const scheme of ['light', 'dark']) {
  for (const [vw, vh, view] of [[1280, 900, 'desktop'], [390, 820, 'phone']]) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, colorScheme: scheme });
    for (const r of routes) {
      const page = await ctx.newPage();
      const errors = [];
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 140)));
      page.on('pageerror', (e) => errors.push(String(e).slice(0, 140)));
      await page.goto(base + r, { waitUntil: 'load' });
      await page.waitForTimeout(600);
      const m = await page.evaluate(() => {
        // rgb()/rgba() in 0-255, or color(srgb r g b / a) in 0-1; returns [r, g, b, a].
        const rgba = (c) => {
          const n = (c.match(/[\d.]+/g) ?? []).map(Number);
          const k = c.startsWith('color(') ? 255 : 1;
          return [n[0] * k, n[1] * k, n[2] * k, n.length > 3 ? n[3] : 1];
        };
        const rgb = (c) => rgba(c).slice(0, 3);
        const ground = rgb(getComputedStyle(document.body).backgroundColor);
        // The ground a text sits on: its nearest painted ancestors, composited over the page ground.
        const bgOf = (el) => {
          const layers = [];
          for (let e = el; e; e = e.parentElement) {
            const c = rgba(getComputedStyle(e).backgroundColor);
            if (c[3] > 0) layers.push(c);
            if (c[3] >= 1) break;
          }
          return layers.reverse().reduce((under, [r, g, b, a]) => [r * a + under[0] * (1 - a), g * a + under[1] * (1 - a), b * a + under[2] * (1 - a)], ground);
        };
        const texts = [];
        for (const el of document.querySelectorAll('h1,h2,h3,h4,p,li,a,span,dt,dd,td,th,label,button,figcaption')) {
          const b = el.getBoundingClientRect();
          const st = getComputedStyle(el);
          if (!b.width || !b.height || b.bottom < 0 || b.top > innerHeight * 3 || st.visibility === 'hidden' || +st.opacity === 0) continue;
          if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
          if (el.closest('[aria-hidden="true"], canvas, svg, .mark')) continue; // the SJ logotype is exempt (WCAG 1.4.3)
          texts.push({ tag: el.tagName, text: el.textContent.trim().slice(0, 30), fg: rgb(st.color), bg: bgOf(el), size: parseFloat(st.fontSize), weight: +st.fontWeight || 400 });
        }
        return { over: document.documentElement.scrollWidth - innerWidth, ground, texts, broken: document.querySelectorAll('canvas[data-error]').length };
      });
      const png = decode(await page.screenshot());
      const bal = balance(png, m.ground);
      const low = m.texts
        .map((t) => ({ ...t, ratio: ratio(t.fg, t.bg), need: t.size >= 24 || (t.size >= 18.66 && t.weight >= 700) ? 3 : 4.5 }))
        .filter((t) => t.ratio < t.need);
      const tag = `${r} [${scheme} ${view}]`;
      if (m.over > 1) problems.push(`${tag}: ${m.over}px sideways overflow`);
      if (errors.length) problems.push(`${tag}: console ${errors[0]}`);
      if (m.broken) problems.push(`${tag}: ${m.broken} figure(s) threw`);
      if (!NIGHT_ONLY.has(r)) {
        if (bal.signal > SIGNAL_MAX) problems.push(`${tag}: signal covers ${(bal.signal * 100).toFixed(1)}% of the first screen (max ${SIGNAL_MAX * 100}%)`);
        if (bal.ground < GROUND_MIN) problems.push(`${tag}: ground is only ${(bal.ground * 100).toFixed(0)}% of the first screen (aim ~60%)`);
      }
      for (const t of low.slice(0, 2)) problems.push(`${tag}: low contrast ${t.ratio.toFixed(2)}:1 < ${t.need} on <${t.tag.toLowerCase()}> "${t.text}"`);
      report.push({ route: r, scheme, view, balance: bal, lowContrast: low.length, overflow: m.over, errors });
      await page.close();
    }
    await ctx.close();
  }
}
await browser.close();
const out = arg('json');
if (out) writeFileSync(out, JSON.stringify(report, null, 2));
console.log(problems.join('\n'));
console.log(`${routes.length} page(s) × 2 themes × 2 widths: ${problems.length} problem(s)`);
process.exit(problems.length ? 1 : 0);
