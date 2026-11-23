// Screenshots of a page transition at 25, 50 and 75 % of its run, going forward (a link) or back
// (history), to lay beside the reference turn. Set SCROLL to start scrolled, DARK=1 for the night
// theme, VW and VH for another window (a phone: VW=390 VH=844).
// node shots.mjs <site astro dir> <base url> <from path> <to path> <out prefix> [back]
import { browser, go } from '../../../checks/perf/lib.mjs';

const [siteDir, base, from, to, out, way] = process.argv.slice(2);
if (!out) {
  console.error('usage: node shots.mjs <site astro dir> <base url> <from path> <to path> <out prefix> [back]');
  process.exit(2);
}
const b = await browser(siteDir);
const page = await b.newPage({
  viewport: { width: Number(process.env.VW ?? 1280), height: Number(process.env.VH ?? 800) },
  colorScheme: process.env.DARK ? 'dark' : 'light',
});
const settle = async () => {
  await page.waitForTimeout(2500);
  if (process.env.SCROLL) await page.evaluate((y) => window.scrollTo(0, y), Number(process.env.SCROLL));
  await page.waitForTimeout(400);
};
await page.goto(base + from, { waitUntil: 'load' });
await settle();
if (way === 'back') {
  await go(page, to);
  await page.waitForURL((u) => u.pathname === to);
  await settle();
}
await page.evaluate(() => {
  document.addEventListener('astro:before-swap', (e) => {
    e.viewTransition.ready.then(() =>
      requestAnimationFrame(() => {
        document.getAnimations().filter((x) => x.effect?.pseudoElement).forEach((x) => x.pause());
        window.__paused = true;
      }),
    );
  }, { once: true });
});
if (way === 'back') await page.evaluate(() => history.back());
else await go(page, to);
await page.waitForFunction(() => window.__paused, null, { timeout: 20000 });
for (const f of [0.25, 0.5, 0.75]) {
  await page.evaluate((f) => {
    document.getAnimations().filter((x) => x.effect?.pseudoElement).forEach((x) => {
      x.currentTime = x.effect.getComputedTiming().duration * f;
    });
  }, f);
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${out}-${Math.round(f * 100)}.png` });
}
console.log(`${out}-25/50/75.png`);
await b.close();
