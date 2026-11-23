// Does the back of the page turn's flap match the page? Pauses a turn half way, finds a point on
// the flap well clear of its crease and sheen (the fold geometry of the page-turn recipe), and
// compares that pixel with the page's own ground colour (--pp-ground), in the light and dark
// themes, going forward and back. Exit 1 on any mismatch. --selftest paints the flap red and
// expects every case to fail, which proves the sample lands on the flap and not on the page.
// node flap-colour.mjs <site astro dir> <base url> <from path> <to path> [--selftest]
import { args, browser, go } from '../../../checks/perf/lib.mjs';

const SELFTEST = process.argv.includes('--selftest');
const RED = 'html[data-pp-turn]::view-transition-image-pair(pp-curl) { background-color: rgb(255, 0, 0) !important; }';

const { siteDir, base, from, to } = args('flap-colour.mjs');
const TOLERANCE = 9; // summed difference over R, G and B, out of 765

/** The point to sample at progress 0.5 on a w by h page, by the page-turn recipe's geometry. */
function sample(w, h) {
  const p = 0.5;
  const b = w - p * (1.2 * w + 0.15 * h);
  const a = b + h * (0.55 - 0.4 * p);
  const k = 0.85 - 0.3 * p;
  const len = Math.hypot(a - b, h);
  const u = [(a - b) / len, -h / len];
  const n = [-u[1], u[0]];
  // A point of the lifted page t up the fold and s past it, mirrored over the fold and
  // foreshortened by k: well past the crease and the sheen, which end by 0.14 of the diagonal.
  const t = 0.375 * h;
  const s = 0.2 * Math.hypot(w, h);
  return [Math.round(b + t * u[0] - k * s * n[0]), Math.round(h + t * u[1] - k * s * n[1])];
}

const b = await browser(siteDir);
const problems = [];
for (const scheme of ['light', 'dark']) {
  for (const back of [false, true]) {
    const page = await b.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: scheme });
    await page.goto(base + from, { waitUntil: 'load' });
    if (back) {
      await go(page, to);
      await page.waitForURL((u) => u.pathname === to);
      await page.waitForTimeout(1500);
    }
    await page.waitForTimeout(1500);
    if (SELFTEST) {
      await page.evaluate((css) => {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(css);
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
      }, RED);
    }
    await page.evaluate(() => {
      document.addEventListener('astro:before-swap', (e) => {
        e.viewTransition.ready.then(() =>
          requestAnimationFrame(() => {
            const turn = document.getAnimations().filter((x) => x.effect?.pseudoElement);
            turn.forEach((x) => {
              x.pause();
              x.currentTime = x.effect.getComputedTiming().duration / 2;
            });
            window.__paused = turn.length;
          }),
        );
      }, { once: true });
    });
    if (back) await page.evaluate(() => history.back());
    else await go(page, to);
    await page.waitForFunction(() => window.__paused !== undefined, null, { timeout: 20000 });
    await page.waitForTimeout(200);
    const ground = await page.evaluate(() => {
      const el = document.createElement('div');
      el.style.background = 'var(--pp-ground)';
      document.body.append(el);
      return getComputedStyle(el).backgroundColor;
    });
    const [x, y] = sample(1280, 800);
    const png = await page.screenshot({ clip: { x, y, width: 1, height: 1 } });
    const got = await page.evaluate(async (b64) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = c.height = 1;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      return [...g.getImageData(0, 0, 1, 1).data.slice(0, 3)];
    }, png.toString('base64'));
    const want = (ground.match(/[\d.]+/g) ?? []).slice(0, 3).map((v) => Math.round(ground.startsWith('color(') ? Number(v) * 255 : Number(v)));
    const diff = got.reduce((sum, v, i) => sum + Math.abs(v - want[i]), 0);
    const name = `${scheme}, ${back ? 'back' : 'forward'}`;
    console.log(`${name}: flap back rgb(${got.join(', ')}), page ground rgb(${want.join(', ')}), difference ${diff}`);
    if (diff > TOLERANCE) problems.push(name);
    await page.close();
  }
}
await b.close();
if (SELFTEST) {
  if (problems.length !== 4) {
    console.error(`selftest: a red flap passed in ${4 - problems.length} of 4 cases: the sample misses the flap`);
    process.exit(1);
  }
  console.log('flap-colour selftest: a red flap fails all 4 cases');
} else if (problems.length) {
  console.error(`the flap's back does not match the page: ${problems.join('; ')}`);
  process.exit(1);
}
