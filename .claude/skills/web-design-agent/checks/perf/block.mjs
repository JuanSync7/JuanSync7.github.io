// Is the page turn played by the compositor? Blocks the main thread for 700 ms in the middle of a
// turn and counts the distinct pictures the screen shows meanwhile (screencast frames). A turn on
// the compositor keeps drawing new pictures; one on the main thread shows one or two.
// node block.mjs <site astro dir> <base url> <from path> <to path>
import { args, browser, go } from './lib.mjs';

const { siteDir, base, from, to } = args('block.mjs');
const b = await browser(siteDir);
const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(base + from, { waitUntil: 'load' });
await page.waitForTimeout(3000);
const cdp = await page.context().newCDPSession(page);
const frames = [];
cdp.on('Page.screencastFrame', (f) => {
  frames.push([Date.now(), f.data]);
  cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 50, maxWidth: 640 });
await page.evaluate(() => {
  document.addEventListener('astro:before-swap', (e) => {
    e.viewTransition.ready.then(() => setTimeout(() => {
      window.__b0 = Date.now();
      const t = performance.now();
      while (performance.now() - t < 700) {}
      window.__b1 = Date.now();
    }, 120));
  }, { once: true });
});
await go(page, to);
await page.waitForFunction(() => window.__b1, null, { timeout: 20000 });
const [b0, b1] = await page.evaluate(() => [window.__b0, window.__b1]);
await cdp.send('Page.stopScreencast');
const during = frames.filter(([t]) => t > b0 + 100 && t < b1 - 100);
const distinct = new Set(during.map((f) => f[1])).size;
console.log(`${from} -> ${to}: ${distinct} distinct pictures while the main thread was blocked for 700 ms`);
await b.close();
process.exit(distinct >= 3 ? 0 : 1);
