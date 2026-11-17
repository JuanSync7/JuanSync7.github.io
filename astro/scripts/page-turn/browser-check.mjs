// The page turn in a real browser, against rules PT-9..PT-14 of .claude/skills/page-turn/RULES.md.
// Builds nothing: run after `npm run build`. Starts `astro preview` unless --url= is given.
//   PT-9  layers     only root, pp-under, pp-curl and names on both pages exist; every animated
//                    pseudo-element animates only transform and opacity
//   PT-10 pixels     mid-turn, the kept part shows the page that turns, the revealed part the page
//                    underneath, and the paper back the page's own ground, in both themes
//   PT-11 order      figures load after the turn finishes; the token and pp-under name are gone;
//                    no long animation frame from the site's own scripts during the turn
//   PT-12 compositor a 400ms block of the main thread mid-turn does not stop the curl
//   PT-13 cases      back lays the page down; a second click mid-turn gets a full turn; reduced
//                    motion turns nothing; a theme toggle mid-turn waits for the turn
//   PT-14 tall       a long post read halfway down turns as it was on screen
// Writes a contact sheet per scenario to figures-out/page-turn/ for a person to read.
// Usage: node scripts/page-turn/browser-check.mjs [--url=http://127.0.0.1:4321] [--only=name]
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { ease, fold, folded, side } from '../../src/components/layout/curl-kernel.ts';

const site = fileURLToPath(new URL('../..', import.meta.url));
const OUT = join(site, 'figures-out/page-turn');
const W = 1280;
const H = 800;
const STEPS = [0.15, 0.3, 0.45, 0.6, 0.75, 0.9];
const MATCH = 0.85; // share of sample points that must match, so a live figure cannot fail it
const TOL = 24; // per channel, for the page comparisons
const GROUND_TOL = 4; // per channel, for the paper back against the ground
const SAFE = 48; // px kept clear of the fold, the flap's edge and its shadow
const LONG_SCRIPT_MS = 50;
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);

async function startPreview() {
  const reservation = createServer();
  await new Promise((ready, fail) => { reservation.once('error', fail); reservation.listen(0, '127.0.0.1', ready); });
  const { port } = reservation.address();
  await new Promise((ready) => reservation.close(ready));
  const child = spawn(process.execPath, ['node_modules/astro/astro.js', 'preview', '--host', '127.0.0.1', '--port', String(port)], {
    cwd: site, env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (d) => { output = `${output}${d}`.slice(-2000); });
  child.stderr.on('data', (d) => { output = `${output}${d}`.slice(-2000); });
  const url = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Preview exited: ${output}`);
    try { if ((await fetch(`${url}/about/`)).ok) return { child, url }; } catch { /* still starting */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  child.kill();
  throw new Error(`Preview did not become ready: ${output}`);
}

// Runs in the page before anything else: records each turn as the browser sees it.
const RECORDER = () => {
  const named = () => new Set([...document.querySelectorAll('*')].map((el) => getComputedStyle(el).viewTransitionName).filter((n) => n && n !== 'none'));
  window.__turns = [];
  window.__loaf = [];
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) window.__loaf.push({ at: e.startTime, end: e.startTime + e.duration, scripts: (e.scripts || []).map((s) => ({ ms: s.duration, src: s.sourceURL || '', fn: s.sourceFunctionName || '', by: s.invoker || '', at: s.sourceCharPosition, start: s.startTime })) });
  }).observe({ type: 'long-animation-frame', buffered: false });
  document.addEventListener('astro:before-preparation', () => { window.__clicked = performance.now(); });
  document.addEventListener('astro:before-swap', (e) => {
    const t = { old: [...named()], token: document.documentElement.getAttribute('data-astro-pp-turn') };
    window.__turns.push(t);
    // After page-curl's own ready handler, which was added later in this same event.
    e.viewTransition.ready.then(() => new Promise((r) => setTimeout(r, 0))).then(() => {
      t.ready = performance.now();
      t.new = [...named()];
      t.anims = document.getAnimations().filter((a) => a.effect?.pseudoElement).map((a) => ({ pseudo: a.effect.pseudoElement, keys: [...new Set(a.effect.getKeyframes().flatMap((k) => Object.keys(k)))] }));
      t.figuresDuring = document.querySelectorAll('.pp-page canvas[data-kind]').length;
    }, () => { t.skipped = true; });
    e.viewTransition.finished.then(() => { t.finished = performance.now(); });
  });
};

const failures = [];
const expect = (ok, msg) => { if (!ok) failures.push(msg); };

const png = (buf) => PNG.sync.read(buf);
const px = (img, x, y) => { const i = (img.width * Math.round(y) + Math.round(x)) * 4; return [img.data[i], img.data[i + 1], img.data[i + 2]]; };
const close = (a, b, tol) => a.every((v, i) => Math.abs(v - b[i]) <= tol);

/** Where on screen a point is at progress p: kept, revealed or paper back, or near an edge.
 *  The paper back counts only beyond its sheen (`sheen` px from the fold, before foreshortening),
 *  where it is the plain ground. */
function region(p, r, sheen) {
  const f = fold(p, W, H);
  const s = side(f, H, r);
  const ux = Math.cos(f.phi);
  const uy = Math.sin(f.phi);
  const onFlap = (q) => {
    const sq = side(f, H, q);
    if (sq >= 0) return false;
    const along = (q.x - f.b) * ux + (q.y - H) * uy;
    const src = { x: f.b + along * ux + (-sq / f.k) * -uy, y: H + along * uy + (-sq / f.k) * ux };
    return src.x >= 0 && src.x <= W && src.y >= 0 && src.y <= H;
  };
  const near = [[SAFE, 0], [-SAFE, 0], [0, SAFE], [0, -SAFE], [SAFE, SAFE], [-SAFE, -SAFE], [SAFE, -SAFE], [-SAFE, SAFE]].map(([dx, dy]) => onFlap({ x: r.x + dx, y: r.y + dy }));
  if (Math.abs(s) < SAFE) return 'edge';
  if (onFlap(r)) return near.every(Boolean) && -s > sheen * f.k + SAFE / 4 ? 'flap' : 'edge';
  if (near.some(Boolean)) return 'edge';
  return s < 0 ? 'kept' : 'revealed';
}

const grid = () => { const out = []; for (let x = 24; x < W; x += 36) for (let y = 24; y < H; y += 36) out.push({ x, y }); return out; };

/** The page's ground as the screen shows it, and how far the paper back's sheen reaches. */
async function ground(page) {
  return page.evaluate(() => {
    const sheen = document.createElement('i');
    sheen.style.cssText = 'position:fixed;width:var(--pp-curl-sheen-out)';
    document.body.append(sheen);
    const reach = sheen.getBoundingClientRect().width;
    sheen.remove();
    const probe = document.createElement('i');
    probe.style.cssText = 'position:fixed;width:1px;height:1px;background:var(--pp-ground)';
    document.body.append(probe);
    const c = getComputedStyle(probe).backgroundColor;
    probe.remove();
    const cv = document.createElement('canvas').getContext('2d');
    cv.fillStyle = c;
    cv.fillRect(0, 0, 1, 1);
    return { rgb: [...cv.getImageData(0, 0, 1, 1).data.slice(0, 3)], sheen: reach };
  });
}

const pseudos = (page) => page.evaluate(() => document.getAnimations().filter((a) => a.effect?.pseudoElement && a.playState === 'running').length);

async function waitTurn(page) {
  for (let i = 0; i < 200; i += 1) {
    if ((await pseudos(page)) >= 4) return true;
    await page.waitForTimeout(10);
  }
  return false;
}

const seek = (page, frac) => page.evaluate((f) => {
  for (const a of document.getAnimations().filter((x) => x.effect?.pseudoElement)) {
    const end = a.effect.getComputedTiming().endTime;
    if (!Number.isFinite(end)) continue;
    a.pause();
    a.currentTime = end * f;
  }
}, frac);

const resume = (page) => page.evaluate(() => document.getAnimations().filter((x) => x.effect?.pseudoElement).forEach((a) => a.play()));

/** One turn, frozen at each step, on a fresh page each time: pixels against the pages before
 *  and after the turn (PT-10). Going back, the page that turns is the one arrived at. */
async function pixels(browser, base, scheme, name, from, to, { back = false, scroll = 0 } = {}) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, colorScheme: scheme });
  await ctx.addInitScript(RECORDER);
  const open = async () => {
    const page = await ctx.newPage();
    page.on('pageerror', (e) => failures.push(`${name}: page error ${e.message}`));
    await page.goto(new URL(from, base).href);
    await page.waitForLoadState('networkidle');
    if (back) {
      await page.click(`a[href="${to}"]`);
      await page.waitForFunction(() => window.__turns.at(-1)?.finished);
    }
    if (scroll) await page.evaluate((y) => window.scrollTo(0, document.documentElement.scrollHeight * y), scroll);
    await page.waitForTimeout(900);
    return page;
  };
  const go = (page) => (back ? page.goBack() : page.click(`a[href="${to}"]`));
  const first = await open();
  const before = png(await first.screenshot());
  const sheet = [{ label: back ? `on ${to}, going back` : `on ${from}`, png: await first.screenshot() }];
  const g = await ground(first);
  await go(first);
  await first.waitForFunction(() => window.__turns.at(-1)?.finished, null, { timeout: 15000 });
  await first.waitForTimeout(60);
  const after = png(await first.screenshot());
  const settled = await first.screenshot();
  await first.close();
  for (const frac of STEPS) {
    const page = await open();
    await go(page);
    if (!(await waitTurn(page))) {
      failures.push(`${name} ${scheme}: no turn started`);
      await page.close();
      continue;
    }
    await seek(page, frac);
    await page.waitForTimeout(150);
    const buf = await page.screenshot();
    sheet.push({ label: `${Math.round(frac * 100)}%`, png: buf });
    await page.close();
    const img = png(buf);
    const p = back ? 1 - ease(frac) : ease(frac);
    const tally = { kept: [0, 0], revealed: [0, 0], flap: [0, 0] };
    for (const r of grid()) {
      const where = region(p, r, g.sheen);
      if (where === 'edge') continue;
      const got = px(img, r.x, r.y);
      const ok = where === 'flap' ? close(got, g.rgb, GROUND_TOL) : close(got, px((where === 'kept') !== back ? before : after, r.x, r.y), TOL);
      tally[where][0] += ok ? 1 : 0;
      tally[where][1] += 1;
    }
    for (const [where, [ok, all]] of Object.entries(tally)) {
      if (!all) continue;
      const need = where === 'flap' ? 0.98 : MATCH;
      expect(ok / all >= need, `${name} ${scheme} at ${Math.round(frac * 100)}%: ${where} matches at ${Math.round((100 * ok) / all)}% of ${all} points, needs ${Math.round(need * 100)}%`);
    }
  }
  sheet.push({ label: back ? `on ${from}` : `on ${to}`, png: settled });
  await ctx.close();
  return sheet;
}

/** One live turn: layers, names, order of work, and the compositor (PT-9, PT-11, PT-12). */
async function live(browser, base, name, from, to) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H } });
  await ctx.addInitScript(RECORDER);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => failures.push(`${name}: page error ${e.message}`));
  await page.goto(new URL(from, base).href);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', (f) => {
    frames.push({ t: f.metadata.timestamp * 1000, data: f.data.length + f.data.slice(-64) });
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => undefined);
  });
  await page.evaluate(() => document.addEventListener('astro:before-swap', (e) => e.viewTransition.ready.then(() => setTimeout(() => {
    window.__blocked = [Date.now(), 0];
    const t = performance.now();
    while (performance.now() - t < 400) { /* the main thread is busy */ }
    window.__blocked[1] = Date.now();
  }, 300)), { once: true }));
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 30, everyNthFrame: 1 });
  await page.click(`a[href="${to}"]`);
  await page.waitForFunction(() => window.__turns.at(-1)?.finished, null, { timeout: 15000 });
  await page.waitForTimeout(2500);
  await cdp.send('Page.stopScreencast');
  const r = await page.evaluate(() => ({
    turn: window.__turns.at(-1),
    clicked: window.__clicked,
    blocked: window.__blocked,
    loaf: window.__loaf,
    marks: performance.getEntriesByType('mark').map((m) => ({ name: m.name, at: m.startTime })),
    token: document.documentElement.getAttribute('data-astro-pp-turn'),
    under: document.querySelector('.pp-page')?.style.viewTransitionName ?? '',
  }));
  const t = r.turn;
  const allowed = new Set(['pp-curl', 'pp-under', ...t.old.filter((n) => t.new.includes(n))]);
  for (const n of [...t.old, ...t.new]) expect(allowed.has(n), `${name}: ${n} is named on one page only and would float over the turn`);
  const want = ['::view-transition-group(root)', '::view-transition-image-pair(root)', '::view-transition-group(pp-curl)', '::view-transition-image-pair(pp-curl)'];
  for (const w of want) expect(t.anims.some((a) => a.pseudo === w), `${name}: ${w} is not animated`);
  for (const a of t.anims) for (const k of a.keys) expect(['transform', 'opacity', 'offset', 'composite', 'easing', 'computedOffset'].includes(k) || !a.pseudo.includes('root') && !a.pseudo.includes('pp-'), `${name}: ${a.pseudo} animates ${k}`);
  expect(t.figuresDuring === 0, `${name}: ${t.figuresDuring} figure(s) mounted before the turn finished`);
  const done = r.marks.filter((m) => m.name === 'pp-turn-finished' && m.at > r.clicked).at(0);
  expect(done, `${name}: the turn never marked itself finished`);
  const early = r.marks.filter((m) => m.name === 'pp-figure-load' && m.at > r.clicked && done && m.at < done.at);
  expect(!early.length, `${name}: ${early.length} figure(s) began loading during the turn`);
  expect(r.token === null, `${name}: data-astro-pp-turn is still set after the turn`);
  expect(r.under !== 'pp-under', `${name}: .pp-page still carries the pp-under name after the turn`);
  // Astro's swap runs in the update callback, before the first frame of the turn: it delays the
  // turn's start, it cannot stall the turn, so only scripts that start once the turn is running count.
  const heavy = r.loaf.flatMap((f) => f.scripts).filter((s) => s.start >= t.ready && s.start < t.finished && s.ms > LONG_SCRIPT_MS && s.src.includes('/_astro/'));
  expect(!heavy.length, `${name}: site script ran ${heavy.map((s) => `${Math.round(s.ms)}ms (${s.src.split('/').pop()}:${s.at} ${s.fn} via ${s.by})`).join(', ')} during the turn`);
  const [b0, b1] = r.blocked ?? [0, 0];
  const during = new Set(frames.filter((f) => f.t > b0 + 50 && f.t < b1).map((f) => f.data));
  expect(b1 > b0 && during.size >= 2, `${name}: the curl showed ${during.size} distinct frame(s) while the main thread was blocked for 400ms`);
  await ctx.close();
  return { done: Math.round(t.finished - t.ready), blockedFrames: during.size };
}

/** Back, a second click mid-turn, reduced motion, and a theme toggle mid-turn (PT-13). */
async function cases(browser, base) {
  {
    const ctx = await browser.newContext({ viewport: { width: W, height: H } });
    await ctx.addInitScript(RECORDER);
    const page = await ctx.newPage();
    await page.goto(new URL('/', base).href);
    await page.waitForLoadState('networkidle');
    await page.click('a[href="/about/"]');
    await page.waitForFunction(() => window.__turns.length === 1 && window.__turns[0].ready);
    await page.evaluate(() => document.querySelector('a[href="/learn/"]').click());
    await page.waitForFunction(() => window.__turns.length === 2 && window.__turns[1].finished, null, { timeout: 15000 });
    const t = await page.evaluate(() => window.__turns[1]);
    expect(t.token === 'forward' && t.anims?.some((a) => a.pseudo.includes('pp-curl')), 'second click mid-turn: the second turn is missing its token or its paper back');
    expect(await page.evaluate(() => !document.documentElement.hasAttribute('data-astro-pp-turn')), 'second click mid-turn: the token is left behind');
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, reducedMotion: 'reduce' });
    await ctx.addInitScript(RECORDER);
    const page = await ctx.newPage();
    await page.goto(new URL('/', base).href);
    await page.waitForLoadState('networkidle');
    await page.click('a[href="/about/"]');
    await page.waitForURL('**/about/');
    await page.waitForTimeout(800);
    const t = await page.evaluate(() => window.__turns.at(-1));
    expect(!t?.anims?.length, `reduced motion: ${t?.anims?.length} pseudo-element animation(s) ran`);
    expect(!t?.token, 'reduced motion: the turn token was set');
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, colorScheme: 'light' });
    await ctx.addInitScript(RECORDER);
    const page = await ctx.newPage();
    await page.goto(new URL('/', base).href);
    await page.waitForLoadState('networkidle');
    await page.click('a[href="/about/"]');
    await page.waitForFunction(() => window.__turns.at(-1)?.ready);
    await page.evaluate(() => {
      window.__theme = [];
      new MutationObserver(() => window.__theme.push({ theme: document.documentElement.dataset.theme ?? '', turning: document.documentElement.hasAttribute('data-astro-pp-turn'), brush: document.documentElement.classList.contains('pp-theming') }))
        .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
      document.querySelector('[data-theme-toggle]').click();
    });
    await page.waitForFunction(() => window.__turns.at(-1)?.finished);
    await page.waitForTimeout(1600);
    const log = await page.evaluate(() => window.__theme);
    expect(!log.some((e) => e.theme === 'dark' && e.turning), 'theme toggle mid-turn: the theme changed while the page was turning');
    expect(log.some((e) => e.theme === 'dark') && log.some((e) => e.brush), 'theme toggle mid-turn: the toggle was lost, or ran without its brush');
    await ctx.close();
  }
}

async function contact(browser, name, shots) {
  await mkdir(OUT, { recursive: true });
  const cells = shots.map((s) => `<figure><img src="data:image/png;base64,${s.png.toString('base64')}"><figcaption>${s.label}</figcaption></figure>`).join('');
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.setContent(`<!doctype html><style>body{margin:0;padding:20px;background:#000;color:#bbb;font:13px ui-monospace,monospace}
    h1{font:600 16px system-ui;color:#fff;margin:0 0 12px}div{display:flex;flex-wrap:wrap;gap:12px}figure{margin:0}
    img{width:320px;display:block;border:1px solid #333}</style><h1>${name}</h1><div>${cells}</div>`);
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true });
  await page.close();
}

const preview = arg('url') ? null : await startPreview();
const base = arg('url') ?? preview.url;
const only = arg('only');
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const report = [];
try {
  const longPost = '/learn/inference-end-to-end/';
  const scenarios = [
    ['forward-light', () => pixels(browser, base, 'light', 'forward', '/', '/about/')],
    ['forward-dark', () => pixels(browser, base, 'dark', 'forward', '/', '/about/')],
    ['back-light', () => pixels(browser, base, 'light', 'back', '/', '/about/', { back: true })],
    ['tall-post', () => pixels(browser, base, 'light', 'tall post', longPost, '/about/', { scroll: 0.45 })],
  ];
  for (const [name, run] of scenarios) {
    if (only && only !== name) continue;
    await contact(browser, name, await run());
    report.push(`${name}: sheet written`);
  }
  if (!only || only === 'live') {
    for (const [from, to] of [['/', '/learn/'], ['/blog/', '/'], ['/about/', '/blog/']]) {
      const r = await live(browser, base, `${from} → ${to}`, from, to);
      report.push(`${from} → ${to}: turn ${r.done}ms, ${r.blockedFrames} frames while the main thread was blocked`);
    }
  }
  if (!only || only === 'cases') await cases(browser, base);
} finally {
  await browser.close();
  preview?.child.kill();
}
await writeFile(join(site, 'figures-out/page-turn/report.txt'), [...report, ...failures.map((f) => `FAIL ${f}`)].join('\n') + '\n').catch(() => undefined);
console.log(report.join('\n'));
if (failures.length) {
  console.error(`\n${failures.length} failure(s):\n${failures.join('\n')}`);
  process.exit(1);
}
console.log('page turn: PT-9..PT-14 hold');
