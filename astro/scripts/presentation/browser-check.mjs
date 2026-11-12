/** Project browser regressions. Runs in normal CI; never starts a managed-runtime browser fallback. */
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { chromium } from 'playwright';
import { contract, color, composite, luminance, separation } from './check.mjs';
import { captureCabinetPoster } from './cabinet-poster-capture.mjs';
import { checkScrollJourney } from './scroll-check.mjs';

if (process.env.SITES_MANAGED_LINUX_CONTAINER === '1' && !process.env.CI) {
  throw new Error('Presentation browser checks run in the existing GitHub-hosted CI browser job, not as a managed preview workaround.');
}

async function startPreview(site) {
  const reservation = createServer();
  await new Promise((ready, fail) => { reservation.once('error', fail); reservation.listen(0, '127.0.0.1', ready); });
  const address = reservation.address();
  assert(address && typeof address !== 'string');
  const port = address.port;
  await new Promise((ready) => reservation.close(ready));
  const child = spawn(process.execPath,
    ['node_modules/astro/astro.js', 'preview', '--host', '127.0.0.1', '--port', String(port)],
    { cwd: site, env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  for (const stream of [child.stdout, child.stderr]) stream.on('data', (data) => { output = `${output}${data}`.slice(-2000); });
  const url = `http://127.0.0.1:${port}`;
  try {
    const deadline = Date.now() + 20000;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) throw new Error(`Preview exited: ${output}`);
      try { if ((await fetch(`${url}/vault/`)).ok) return { child, url }; } catch { /* Still starting. */ }
      await new Promise((ready) => setTimeout(ready, 200));
    }
    throw new Error(`Preview did not become ready: ${output}`);
  } catch (error) {
    child.kill();
    throw error;
  }
}

const site = fileURLToPath(new URL('../../', import.meta.url));
const supplied = process.argv.find((arg) => arg.startsWith('--url='))?.slice(6);
const preview = supplied ? null : await startPreview(site);
const base = supplied ?? preview.url;
const output = join(site, 'presentation-out');
await mkdir(output, { recursive: true });
let browser;
let currentPage;
const errors = [];
const requests = [];

function watch(page) {
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => requests.push(request.url()));
  currentPage = page;
  return page;
}

async function ready(page, expected) {
  await page.locator('[data-presentation]').waitFor();
  await page.waitForFunction(() => {
    const state = document.querySelector('[data-presentation]')?.getAttribute('data-presentation-motion');
    return state === 'ready' || state === 'reduced' || state === 'failed';
  });
  const actual = await page.locator('[data-presentation]').getAttribute('data-presentation-motion');
  assert.notEqual(actual, 'failed', 'The presentation engine must initialize successfully');
  if (expected) assert.equal(actual, expected);
  await page.evaluate(() => document.fonts.ready);
  // Astro's new DOM is ready before the old/new visual snapshots finish crossfading.
  await page.waitForFunction(() => !document.documentElement.hasAttribute('data-astro-transition')
    && !document.documentElement.hasAttribute('data-astro-transition-fallback'));
}

async function noOverflow(page, label) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${label}: no sideways page scroll`);
}

async function revealAll(page) {
  const nodes = page.locator('[data-presentation] [data-reveal]');
  for (const node of await nodes.all()) {
    await node.scrollIntoViewIfNeeded();
    await node.evaluate((element) => new Promise((done, fail) => {
      const start = performance.now();
      const check = () => {
        const style = getComputedStyle(element);
        if (Number(style.opacity) >= 0.99 && style.visibility !== 'hidden') return done(true);
        if (performance.now() - start > 5000) return fail(new Error('A reveal did not become readable'));
        requestAnimationFrame(check);
      };
      check();
    }));
  }
}

async function roleContrast(page) {
  const styles = await page.locator('[data-presentation]').evaluate((root) => {
    const role = (name) => root.matches(`.pr-${name}`) ? root : root.querySelector(`.pr-${name}`);
    return {
      background: getComputedStyle(document.body).backgroundColor,
      title: role('title') && getComputedStyle(role('title')).color,
      body: role('body') && getComputedStyle(role('body')).color,
      comment: role('comment') && getComputedStyle(role('comment')).color,
      titleSize: role('title') && parseFloat(getComputedStyle(role('title')).fontSize),
      bodySize: role('body') && parseFloat(getComputedStyle(role('body')).fontSize),
      commentSize: role('comment') && parseFloat(getComputedStyle(role('comment')).fontSize),
    };
  });
  const background = color(styles.background);
  const values = {};
  for (const role of ['title', 'body', 'comment']) {
    assert(styles[role], `A visible ${role} role is part of the presentation template`);
    values[role] = luminance(composite(color(styles[role]), background));
    assert(separation(values[role], luminance(background)) >= contract.minNormalContrast, `${role}: computed AA contrast`);
  }
  // Ordered by contrast with the ground, so it holds on the cream notepad and the blackboard alike.
  const contrast = (role) => separation(values[role], luminance(background));
  assert(contrast('title') > contrast('body') && contrast('body') > contrast('comment'), 'The computed hierarchy stays ordered');
  assert(separation(values.title, values.body) >= contract.minTitleBodyLuminanceRatio);
  assert(separation(values.body, values.comment) >= contract.minBodyCommentLuminanceRatio);
  assert(styles.titleSize > styles.bodySize && styles.bodySize > styles.commentSize, 'Computed text sizes preserve the three-role hierarchy');
}

async function heroGeometry(page, width) {
  const cabinet = page.locator('[data-cabinet]');
  await cabinet.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('[data-cabinet]')?.dataset.cabinetReady === 'true');
  await page.locator('[data-cabinet] canvas[data-ready="1"]').waitFor();
  assert.equal(await page.locator('[data-cabinet] canvas').getAttribute('data-error'), null);
  assert.equal(await cabinet.locator('[data-cabinet-link]').count(), 3);
  for (const action of await cabinet.locator('[data-cabinet-link]').all()) {
    const box = await action.locator('[data-folder-label]').boundingBox();
    assert(box && box.width > 0 && box.height > 0);
    assert(await action.locator('[data-folder-label]').evaluate((label) => {
      const box = label.getBoundingClientRect();
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      return Boolean(hit && label.closest('a').contains(hit));
    }), `${width}px: each folder label hits its own real link`);
  }
  const lines = await page.locator('.vault-hero h1').evaluate((heading) => Math.round(heading.getBoundingClientRect().height / parseFloat(getComputedStyle(heading).lineHeight)));
  assert(lines > 0 && lines <= contract.maxHeroHeadlineLines);
}

const cabinetSelected = (page, index) => page.waitForFunction((expected) => {
  const cabinet = document.querySelector('[data-cabinet]');
  return Number(cabinet.dataset.cabinetFolder) === expected && Number(cabinet.dataset.cabinetLift) > 0.95;
}, index);

try {
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1360, height: 960 }, deviceScaleFactor: 2, reducedMotion: 'no-preference' });
  if (process.argv.includes('--cabinet-poster-only')) {
    await captureCabinetPoster(context, base, output);
    console.log('Cabinet poster and source manifest exported.');
  } else {
  const page = watch(await context.newPage());
  await page.goto(`${base}/vault/`);
  await ready(page, 'ready');
  assert.equal(await page.locator('[data-page-kind="landing"]').count(), 1);
  assert.equal(await page.locator('h1').count(), 1);
  assert(await page.locator('main a[data-paper-action]').first().isVisible(), 'The next action is visible');
  await roleContrast(page);
  await page.locator('#value').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('[data-section-link][href="#value"]')?.getAttribute('aria-current') === 'location');
  assert.equal(await page.locator('[data-section-link][href="#value"]').evaluate((link) => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--pr-label)';
    link.append(probe);
    const expected = getComputedStyle(probe).color;
    probe.remove();
    return getComputedStyle(link).color === expected;
  }), true, 'The current chapter uses the label highlight color');
  for (const width of contract.viewports) {
    await page.setViewportSize({ width, height: 960 });
    await revealAll(page);
    await noOverflow(page, `${width}px landing`);
    await page.mouse.move(0, 0);
    await heroGeometry(page, width);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForFunction(() => Number(document.querySelector('[data-cabinet]').dataset.cabinetDrawer) < 0.75);
    await page.screenshot({ path: join(output, `vault-${width}.png`), fullPage: true });
  }

  await page.locator('[data-cabinet] canvas').screenshot({ path: join(output, 'cabinet-rest.png') });

  await captureCabinetPoster(context, base, output);

  // A scoped Astro swap must release the previous page, not leave its motion owners alive.
  await checkScrollJourney(page, output, [contract.viewports[0], contract.viewports.at(-1)]);
  await page.setViewportSize({ width: 1360, height: 960 });
  const oldRoot = await page.locator('[data-presentation]').elementHandle();
  await page.locator('main a[href="/vault/architecture/"]').first().click();
  await page.waitForURL('**/vault/architecture/');
  await ready(page);
  assert.equal(await oldRoot.evaluate((root) => root.getAttribute('data-motion-disposed')), 'true', 'Astro navigation disposes the old motion owner');
  assert.equal(await page.locator('[data-page-kind="guide"]').count(), 1);
  await page.locator('main a[href="/vault/"]').first().click();
  await page.waitForURL('**/vault/');
  await ready(page, 'ready');

  for (const [index, slug] of ['architecture', 'knowledge-graph', 'search'].entries()) {
    const folder = page.locator(`[data-cabinet-link="${index}"]`);
    await page.keyboard.press('Tab');
    await folder.scrollIntoViewIfNeeded();
    await folder.focus();
    await cabinetSelected(page, index);
    assert(await folder.locator('[data-folder-label]').evaluate((label) => getComputedStyle(label).outlineStyle !== 'none'), 'A keyboard-selected folder has a visible focus ring');
    await page.keyboard.press('Enter');
    await page.waitForURL(`**/vault/${slug}/`);
    await ready(page);
    await page.locator('main a[href="/vault/"]').first().click();
    await page.waitForURL('**/vault/');
    await ready(page, 'ready');
  }

  // Pointer selection must release back to the folder that still owns keyboard focus.
  const systemFolder = page.locator('[data-cabinet-link="0"]');
  await systemFolder.scrollIntoViewIfNeeded();
  await systemFolder.focus();
  await cabinetSelected(page, 0);
  await page.locator('[data-cabinet-link="1"]').hover();
  await cabinetSelected(page, 1);
  await page.mouse.move(0, 0);
  await cabinetSelected(page, 0);
  assert(await systemFolder.evaluate((node) => node === document.activeElement), 'Leaving pointer hover restores the focused folder without moving focus');
  await systemFolder.evaluate((node) => node.blur());

  for (const slug of contract.guideSlugs) {
    const guideLink = page.locator(`main a[href="/vault/${slug}/"]`).first();
    // A reader scrolls a below-fold section into view before choosing its revealed link.
    await guideLink.scrollIntoViewIfNeeded();
    await guideLink.click();
    await page.waitForURL(`**/vault/${slug}/`);
    await ready(page);
    assert.equal(await page.locator('h1').count(), 1);
    assert(await page.locator('main a[href="/vault/"]').first().isVisible());
    await roleContrast(page);
    await noOverflow(page, `${slug} guide`);
    await page.screenshot({ path: join(output, `guide-${slug}-1360.png`), fullPage: true });
    await page.setViewportSize({ width: 390, height: 960 });
    await noOverflow(page, `390px ${slug} guide`);
    await page.screenshot({ path: join(output, `guide-${slug}-390.png`), fullPage: true });
    await page.setViewportSize({ width: 1360, height: 960 });
    await page.locator('main a[href="/vault/"]').first().click();
    await page.waitForURL('**/vault/');
    await ready(page);
  }

  // Inspect the actual reusable action faces, not a separately painted sample.
  await page.goto(`${base}/design-system/#paper-actions`);
  const specimen = page.locator('#paper-actions');
  await specimen.scrollIntoViewIfNeeded();
  for (const variant of contract.buttonVariants) {
    const action = specimen.locator(`[data-paper-action="${variant}"]`).first();
    assert.equal(await action.evaluate((node) => node.tagName), 'A');
    assert(await action.getAttribute('href'), `${variant}: a real link has a destination`);
    const face = action.locator('.pa-face');
    const values = await face.evaluate((node) => ({ ink: getComputedStyle(node).color, face: getComputedStyle(node).backgroundColor }));
    const background = color(values.face);
    assert(separation(luminance(composite(color(values.ink), background)), luminance(background)) >= contract.minNormalContrast);
    await page.keyboard.press('Tab');
    await action.focus();
    assert(await action.evaluate((node) => node === document.activeElement));
    assert(await action.evaluate((node) => getComputedStyle(node).outlineStyle !== 'none' && parseFloat(getComputedStyle(node).outlineWidth) > 0), 'Keyboard focus has a visible ring');
    await page.mouse.move(0, 0);
    const rest = await face.evaluate((node) => getComputedStyle(node).transform);
    await action.hover();
    await page.waitForFunction(({ selector, previous }) => {
      const face = document.querySelector(selector);
      return face && getComputedStyle(face).transform !== previous;
    }, { selector: `#paper-actions [data-paper-action="${variant}"] .pa-face`, previous: rest });
  }
  const disabled = specimen.locator('button[disabled]').first();
  assert(await disabled.isDisabled());
  assert.equal(await disabled.evaluate((button) => {
    button.addEventListener('click', () => { button.dataset.clicked = 'true'; }, { once: true });
    button.click();
    return button.dataset.clicked;
  }), undefined, 'A disabled native action does not dispatch a click');
  await specimen.getByRole('button', { name: 'Open a note', exact: true }).click();
  assert(await page.locator('#paper-action-note').isVisible(), 'The button specimen performs its declared action');
  await page.keyboard.press('Escape');
  await page.locator('#paper-action-note').waitFor({ state: 'hidden' });
  await page.mouse.move(0, 0);
  await specimen.screenshot({ path: join(output, 'paper-actions.png') });

  // The moved example still resolves an alias, preserves edge direction and follows source links.
  await page.goto(`${base}/vault/search/`);
  await ready(page);
  const query = page.locator('#vault-example-query');
  await query.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('#vault-example-query')?.disabled === false);
  await query.fill('duplicate work');
  await page.getByRole('button', { name: 'Find notes', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.vsd-context h3')?.textContent === 'Idempotency');
  assert.match(await page.locator('.vsd-results').innerText(), /alias: duplicate work/);
  await page.getByRole('button', { name: 'retry policy', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.vsd-context h3')?.textContent === 'Retries');
  const lesson = page.locator('.vsd-neighbors button').filter({ hasText: 'Bound retries' });
  assert.match(await lesson.innerText(), /incoming.*applies_to/s);
  await lesson.focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.activeElement === document.querySelector('.vsd-context h3') && document.activeElement.textContent === 'Bound retries');
  const source = page.locator('.vsd-neighbors button').filter({ hasText: 'Queue retry experiment' });
  assert.match(await source.innerText(), /outgoing.*supported_by/s);
  await source.focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.activeElement === document.querySelector('.vsd-context h3') && document.activeElement.textContent === 'Queue retry experiment');
  assert.match(await page.locator('.vsd-trust').innerText(), /Unreviewed example/);
  await query.fill('');
  await page.getByRole('button', { name: 'Find notes', exact: true }).click();
  assert.match(await page.locator('.vsd-results').innerText(), /0 matching/);
  assert.match(await page.locator('.vsd-context').innerText(), /Choose a matching note/);
  await page.getByRole('button', { name: 'retry policy', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 960 });
  await revealAll(page);
  await noOverflow(page, '390px search guide');
  await page.screenshot({ path: join(output, 'search-390.png'), fullPage: true });

  const reduced = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 960 } });
  const still = watch(await reduced.newPage());
  await still.goto(`${base}/vault/`);
  await ready(still, 'reduced');
  await still.locator('[data-cabinet] canvas[data-ready="1"]').waitFor();
  assert(await still.locator('[data-reveal]').evaluateAll((nodes) => nodes.every((node) => Number(getComputedStyle(node).opacity) > 0 && getComputedStyle(node).visibility !== 'hidden')));
  await noOverflow(still, 'Reduced-motion landing');
  await still.screenshot({ path: join(output, 'vault-reduced-390.png'), fullPage: true });
  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 960 } });
  const staticPage = watch(await nojs.newPage());
  await staticPage.goto(`${base}/vault/`);
  assert(await staticPage.locator('h1').isVisible());
  assert(await staticPage.locator('[data-reveal]').evaluateAll((nodes) => nodes.every((node) => Number(getComputedStyle(node).opacity) > 0 && getComputedStyle(node).visibility !== 'hidden')));
  assert(await staticPage.locator('main a[data-paper-action]').first().isVisible());
  assert(await staticPage.locator('.vc-poster').isVisible(), 'A missing script retains the physical cabinet');
  assert(await staticPage.locator('.vc-poster').evaluate((image) => image.complete && image.naturalWidth === 1000 && image.naturalHeight === 1120));
  for (const link of await staticPage.locator('[data-cabinet-link]').all()) {
    assert(await link.isVisible(), 'Static folder links remain available');
    assert.notEqual(await link.getAttribute('tabindex'), '-1');
  }
  await noOverflow(staticPage, 'No-JavaScript landing');
  await staticPage.screenshot({ path: join(output, 'vault-nojs-390.png'), fullPage: true });
  await staticPage.locator('[data-cabinet-link="1"]').click();
  await staticPage.waitForURL('**/vault/knowledge-graph/');
  assert(await staticPage.locator('h1').isVisible(), 'The static folder reaches its guide');
  await staticPage.goto(`${base}/vault/search/`);
  assert(await staticPage.locator('.vsd-context h3').isVisible());
  assert(await staticPage.locator('noscript p').last().isVisible());
  assert.deepEqual(errors, [], 'Presentation routes produce no runtime errors');
  assert(requests.every((url) => {
    const parsed = new URL(url);
    return parsed.origin === new URL(base).origin || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(parsed.hostname);
  }), 'Presentation visits request only site assets and the existing public webfonts');
  console.log('Presentation browser checks: responsive pages, computed hierarchy, scoped motion disposal, paper actions, graph focus, reduced motion and no-JavaScript content passed.');
  }
} catch (error) {
  if (currentPage && !currentPage.isClosed()) await currentPage.screenshot({ path: join(output, 'failure.png'), fullPage: true }).catch(() => {});
  throw error;
} finally {
  await browser?.close();
  preview?.child.kill();
}
