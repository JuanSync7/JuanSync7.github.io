// How smooth a real page turn looks: the distinct pictures the screen shows from the turn's start
// to its end, and the longest gap between them, with the landing page building as it normally does.
// node smooth.mjs <site astro dir> <base url> <from path> <to path>
import { args, browser, go } from './lib.mjs';

const { siteDir, base, from, to } = args('smooth.mjs');
const b = await browser(siteDir);
const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(base + from, { waitUntil: 'load' });
await page.waitForTimeout(3500);
const cdp = await page.context().newCDPSession(page);
const frames = [];
cdp.on('Page.screencastFrame', (f) => {
  frames.push([Date.now(), f.data]);
  cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 50, maxWidth: 640 });
await page.evaluate(() => {
  document.addEventListener('astro:before-swap', (e) => {
    e.viewTransition.ready.then(() => (window.__r = Date.now()));
    e.viewTransition.finished.then(() => (window.__f = Date.now()));
  }, { once: true });
});
await go(page, to);
await page.waitForFunction(() => window.__f, null, { timeout: 20000 });
const [r, f] = await page.evaluate(() => [window.__r, window.__f]);
await cdp.send('Page.stopScreencast');
const during = frames.filter(([t]) => t >= r && t <= f);
const gaps = during.slice(1).map((x, i) => x[0] - during[i][0]);
console.log(`${from} -> ${to}: ${new Set(during.map((x) => x[1])).size} distinct pictures in ${f - r} ms, longest gap ${gaps.length ? Math.max(...gaps) : '-'} ms`);
await b.close();
