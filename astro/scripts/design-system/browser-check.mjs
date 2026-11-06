import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { chromium } from 'playwright';

async function startPreview(site) {
  const reservation = createServer();
  await new Promise((ready, fail) => {
    reservation.once('error', fail);
    reservation.listen(0, '127.0.0.1', ready);
  });
  const address = reservation.address();
  assert.ok(address && typeof address !== 'string');
  const port = address.port;
  await new Promise((ready) => reservation.close(ready));
  const child = spawn(
    process.execPath,
    ['node_modules/astro/astro.js', 'preview', '--host', '127.0.0.1', '--port', String(port)],
    {
      cwd: site,
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  let output = '';
  child.stdout.on('data', (data) => {
    output = `${output}${data}`.slice(-2000);
  });
  child.stderr.on('data', (data) => {
    output = `${output}${data}`.slice(-2000);
  });
  const url = `http://127.0.0.1:${port}`;
  try {
    const deadline = Date.now() + 20000;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) throw new Error(`Preview exited: ${output}`);
      try {
        if ((await fetch(`${url}/design-system/`)).ok) return { child, url };
      } catch {
        /* Server is still starting. */
      }
      await new Promise((ready) => setTimeout(ready, 200));
    }
    throw new Error(`Preview did not become ready: ${output}`);
  } catch (error) {
    child.kill();
    throw error;
  }
}

const site = fileURLToPath(new URL('../..', import.meta.url));
const supplied = process.argv.find((arg) => arg.startsWith('--url='))?.slice(6);
const preview = supplied ? null : await startPreview(site);
const base = supplied ?? preview.url;
const out = join(site, 'design-system-out');
await mkdir(out, { recursive: true });
let browser;
const errors = [];
try {
  browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    permissions: ['clipboard-read', 'clipboard-write'],
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${base}/design-system/`);
  await page.waitForFunction(() => document.querySelector('[data-design-system]')?.dataset.ready === 'true');
  assert.equal(await page.locator('h1').count(), 1);
  assert.equal(await page.locator('section[data-ds-section]').count(), 7);
  await page.screenshot({ path: join(out, 'desktop.png') });
  for (const id of ['foundations', 'components']) {
    await page.locator(`#${id}`).evaluate((section) => section.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: join(out, `desktop-${id}.png`) });
  }

  // The copied payload must equal the complete file, including Astro fences and CSS.
  const starter = page
    .locator('.ds-code')
    .filter({ has: page.locator('summary', { hasText: 'Night page · starter.astro' }) });
  const expected = await starter.locator('code').textContent();
  await starter.getByRole('button').click();
  await page.getByRole('status').filter({ hasText: 'Copied to clipboard.' }).waitFor();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), expected);
  const token = page.getByRole('button', { name: 'Copy var(--nt-signal)', exact: true });
  await token.click();
  await page.waitForFunction(() => navigator.clipboard.readText().then((text) => text === 'var(--nt-signal)'));

  // Source is read from the production file; the panel copies one file at a time.
  const heading = page
    .locator('.ds-code')
    .filter({ has: page.locator('summary', { hasText: 'Source · src/components/ui/SectionHead.astro' }) });
  await heading.locator('summary').focus();
  await page.keyboard.press('Enter');
  assert.equal(await heading.getAttribute('open'), '');
  await heading.getByRole('button').click();
  await page.waitForFunction(
    (text) => navigator.clipboard.readText().then((value) => value === text),
    (await readFile(join(site, 'src/components/ui/SectionHead.astro'), 'utf8')).trim(),
  );

  // Open the preserved library with the keyboard. Reduced motion keeps its timers off.
  const legacy = page.locator('details.ds-legacy');
  await legacy.locator(':scope > summary').focus();
  await page.keyboard.press('Enter');
  await page.locator('.ds-motion-preview').first().scrollIntoViewIfNeeded();
  await page.locator('.ds-motion-preview .ds-note').first().waitFor();
  assert.equal(await legacy.locator('canvas').count(), 0);

  // Astro navigation must reattach copy handlers when returning to the reference.
  await page.getByRole('link', { name: 'juan_kok, home' }).click();
  await page.waitForURL(`${base}/`);
  await page.locator('footer').getByRole('link', { name: 'design system', exact: true }).click();
  await page.waitForURL(/design-system/);
  await page.waitForFunction(() => document.querySelector('[data-design-system]')?.dataset.ready === 'true');
  await page.getByRole('button', { name: 'Copy var(--nt-ground)', exact: true }).click();
  await page.waitForFunction(() => navigator.clipboard.readText().then((text) => text === 'var(--nt-ground)'));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => document.querySelector('[data-copy-status]')?.textContent === '');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: join(out, 'phone.png') });
  await page.locator('#foundations').evaluate((section) => section.scrollIntoView({ block: 'start' }));
  await page.screenshot({ path: join(out, 'phone-foundations.png') });
  await page
    .locator('#patterns .ds-code')
    .first()
    .evaluate((panel) => panel.scrollIntoView({ block: 'start' }));
  await page.screenshot({ path: join(out, 'phone-code.png') });
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    'Phone page must not scroll sideways',
  );
  assert.equal(
    await page
      .locator('.ds-terminal pre')
      .first()
      .evaluate((pre) => getComputedStyle(pre).whiteSpace),
    'pre-wrap',
  );
  assert.deepEqual(errors, [], 'No runtime errors');
  await context.close();

  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const staticPage = await nojs.newPage();
  await staticPage.goto(`${base}/design-system/`);
  assert.ok((await staticPage.locator('#patterns pre code').first().textContent()).startsWith('---'));
  await staticPage.locator('#components .ds-code summary').first().click();
  assert.ok(
    await staticPage.locator('#components .ds-code pre').first().isVisible(),
    'Native code panels work without JavaScript',
  );
  await nojs.close();
  console.log(
    'Design system: clipboard payloads, token copying, source parity, keyboard disclosure, reduced motion, Astro return navigation, phone width and no-JavaScript code panels pass.',
  );
} finally {
  await browser?.close();
  preview?.child.kill();
}
