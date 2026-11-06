/** Project browser regressions. Runs in normal CI; never starts a managed-runtime browser fallback. */
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { chromium } from 'playwright';
import { contract, color, composite, luminance, separation } from './check.mjs';

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
  assert(values.title > values.body && values.body > values.comment, 'The computed hierarchy stays ordered');
  assert(separation(values.title, values.body) >= contract.minTitleBodyLuminanceRatio);
  assert(separation(values.body, values.comment) >= contract.minBodyCommentLuminanceRatio);
  assert(styles.titleSize > styles.bodySize && styles.bodySize > styles.commentSize, 'Computed text sizes preserve the three-role hierarchy');
}

async function heroGeometry(page, width) {
  await page.locator('.vault-stack-stage').scrollIntoViewIfNeeded();
  const geometry = await page.locator('.vault-stack-stage').evaluate((stage) => {
    const actions = [...stage.querySelectorAll('[data-paper-action]')];
    return {
      actions: actions.map((action) => {
        const label = action.querySelector('strong');
        const bounds = label?.getBoundingClientRect();
        const hit = bounds && document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        return {
          label: label?.textContent, reachable: Boolean(hit && action.contains(hit)), bottom: action.getBoundingClientRect().bottom,
          labelBounds: bounds?.toJSON(), hit: hit && `${hit.tagName}.${hit.className}`,
          hitStack: bounds && document.elementsFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
            .slice(0, 6).map((node) => `${node.tagName}.${node.className}`),
        };
      }),
      captionTop: stage.querySelector('.vault-stack-caption')?.getBoundingClientRect().top,
      scrollY, viewportHeight: innerHeight,
    };
  });
  assert.equal(geometry.actions.length, 3, `${width}px: all three paper links are present`);
  for (const action of geometry.actions) assert(action.reachable, `${width}px: the ${action.label} label is exposed and hits its own action: ${JSON.stringify(geometry)}`);
  assert(Number.isFinite(geometry.captionTop), 'The stack has a readable caption');
  assert(geometry.captionTop >= Math.max(...geometry.actions.map((action) => action.bottom)), `${width}px: the caption stays below every paper-link box`);
  const lines = await page.locator('.vault-hero h1').evaluate((heading) => Math.round(heading.getBoundingClientRect().height / parseFloat(getComputedStyle(heading).lineHeight)));
  assert(lines > 0 && lines <= contract.maxHeroHeadlineLines, `${width}px: headline uses ${lines} lines; maximum is ${contract.maxHeroHeadlineLines}`);
}

try {
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1360, height: 960 }, reducedMotion: 'no-preference' });
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
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: join(output, `vault-${width}.png`), fullPage: true });
  }

  // A scoped Astro swap must release the previous page, not leave its motion owners alive.
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

  for (const slug of contract.guideSlugs) {
    await page.locator(`main a[href="/vault/${slug}/"]`).first().click();
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
  assert(await still.locator('[data-reveal]').evaluateAll((nodes) => nodes.every((node) => Number(getComputedStyle(node).opacity) > 0 && getComputedStyle(node).visibility !== 'hidden')));
  await noOverflow(still, 'Reduced-motion landing');
  await still.screenshot({ path: join(output, 'vault-reduced-390.png'), fullPage: true });
  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 960 } });
  const staticPage = watch(await nojs.newPage());
  await staticPage.goto(`${base}/vault/`);
  assert(await staticPage.locator('h1').isVisible());
  assert(await staticPage.locator('[data-reveal]').evaluateAll((nodes) => nodes.every((node) => Number(getComputedStyle(node).opacity) > 0 && getComputedStyle(node).visibility !== 'hidden')));
  assert(await staticPage.locator('main a[data-paper-action]').first().isVisible());
  await noOverflow(staticPage, 'No-JavaScript landing');
  await staticPage.screenshot({ path: join(output, 'vault-nojs-390.png'), fullPage: true });
  await staticPage.goto(`${base}/vault/search/`);
  assert(await staticPage.locator('.vsd-context h3').isVisible());
  assert(await staticPage.locator('noscript p').last().isVisible());
  assert.deepEqual(errors, [], 'Presentation routes produce no runtime errors');
  assert(requests.every((url) => {
    const parsed = new URL(url);
    return parsed.origin === new URL(base).origin || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(parsed.hostname);
  }), 'Presentation visits request only site assets and the existing public webfonts');
  console.log('Presentation browser checks: responsive pages, computed hierarchy, scoped motion disposal, paper actions, graph focus, reduced motion and no-JavaScript content passed.');
} catch (error) {
  if (currentPage && !currentPage.isClosed()) await currentPage.screenshot({ path: join(output, 'failure.png'), fullPage: true }).catch(() => {});
  throw error;
} finally {
  await browser?.close();
  preview?.child.kill();
}
