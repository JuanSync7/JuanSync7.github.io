// The main thread around a page swap: long tasks (over 50 ms) from 2 s before the turn to its end,
// and main-thread time by script (a CPU profile), so a slow landing names the script behind it.
// node lag.mjs <site astro dir> <base url> <from path> <to path>
import { args, browser, go } from './lib.mjs';

const { siteDir, base, from, to } = args('lag.mjs');
const b = await browser(siteDir);
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(base + from, { waitUntil: 'load' });
await page.waitForTimeout(4000);
const cdp = await page.context().newCDPSession(page);
await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
await page.evaluate(() => {
  window.__lag = { long: [], start: 0, end: 0 };
  new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lag.long.push([e.startTime, e.duration]))).observe({ type: 'longtask' });
  document.addEventListener('astro:before-swap', (e) => {
    e.viewTransition.ready.then(() => (window.__lag.start = performance.now()));
    e.viewTransition.finished.then(() => (window.__lag.end = performance.now()));
  }, { once: true });
});
await cdp.send('Profiler.start');
await go(page, to);
await page.waitForFunction(() => window.__lag?.end > 0, null, { timeout: 30000 });
await page.waitForTimeout(1500);
const { profile } = await cdp.send('Profiler.stop');
const r = await page.evaluate(() => window.__lag);
const near = r.long.filter(([s, d]) => s + d > r.start - 2000);
const nodes = new Map(profile.nodes.map((n) => [n.id, n]));
const self = new Map();
profile.samples.forEach((id, i) => {
  const url = nodes.get(id).callFrame.url.replace(/^.*\/_astro\//, '') || '(native)';
  self.set(url, (self.get(url) ?? 0) + (profile.timeDeltas[i] ?? 0) / 1000);
});
const top = [...self.entries()].filter(([u]) => u !== '(native)').sort((x, y) => y[1] - x[1]).slice(0, 6);
console.log(`${from} -> ${to}: turn ${Math.round(r.end - r.start)} ms`);
console.log(`  long tasks: ${near.map(([s, d]) => `${Math.round(d)} ms at ${Math.round(s - r.start)}`).join(', ') || 'none'}`);
console.log(`  main thread by script: ${top.map(([u, ms]) => `${u} ${ms.toFixed(0)} ms`).join(' | ')}`);
await b.close();
