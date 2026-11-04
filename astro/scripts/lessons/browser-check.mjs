import assert from 'node:assert/strict';
import { readFile, readdir, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';

async function startPreview(site) {
  const reservation = createServer();
  await new Promise((ready, fail) => { reservation.once('error', fail); reservation.listen(0, '127.0.0.1', ready); });
  const address = reservation.address();
  assert.ok(address && typeof address !== 'string');
  const port = address.port;
  await new Promise((ready) => reservation.close(ready));
  const child = spawn(process.execPath, ['node_modules/astro/astro.js', 'preview', '--host', '127.0.0.1', '--port', String(port)], {
    cwd: site, env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (data) => { output = `${output}${data}`.slice(-2000); });
  child.stderr.on('data', (data) => { output = `${output}${data}`.slice(-2000); });
  const url = `http://127.0.0.1:${port}`;
  try {
    const deadline = Date.now() + 20000;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) throw new Error(`Preview exited: ${output}`);
      try { if ((await fetch(`${url}/blog/lessons/`)).ok) return { child, url }; } catch { /* Server is still starting. */ }
      await new Promise((ready) => setTimeout(ready, 200));
    }
    throw new Error(`Preview did not become ready: ${output}`);
  } catch (error) {
    child.kill();
    throw error;
  }
}

const site = fileURLToPath(new URL('../..', import.meta.url));
const registry = JSON.parse(await readFile(join(site, 'src/config/lesson-taxonomy.json'), 'utf8'));
const directory = join(site, 'src/content/lessons');
const lessons = await Promise.all((await readdir(directory)).filter((name) => name.endsWith('.yaml')).map(async (name) => ({
  ...JSON.parse(await readFile(join(directory, name), 'utf8')), id: name.slice(0, -5),
})));
const suppliedUrl = process.argv.find((arg) => arg.startsWith('--url='))?.slice(6);
const preview = suppliedUrl ? null : await startPreview(site);
const base = suppliedUrl ?? preview.url;
const output = process.argv.find((arg) => arg.startsWith('--screenshots='))?.slice(14);
const url = new URL('/blog/lessons/', base).href;
let browser;
const failures = [];
const expected = (category = '', tags = []) => lessons.filter((lesson) => (!category || lesson.category === category)
  && tags.every((tag) => lesson.tags.includes(tag))).map((lesson) => lesson.id).sort();
const actual = async (page) => (await page.locator('[data-lesson]').evaluateAll((nodes) => nodes.map((node) => node.id))).sort();
const assertItems = async (page, category = '', tags = []) => assert.deepEqual(await actual(page), expected(category, tags));
const category = registry.categories.find((item) => lessons.some((lesson) => lesson.category === item.id));
assert.ok(category, 'A populated category is required');
const pair = lessons.find((lesson) => lesson.tags.length >= 2 && lesson.category === category.id);
assert.ok(pair, 'A lesson with two tags is required to test intersection');

try {
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', (error) => failures.push(error.message));
  await page.goto(url);
  await page.locator('[data-lesson-controls]').waitFor({ state: 'visible' });
  await assertItems(page);
  assert.equal(await page.locator('[data-lesson-group]').count(), new Set(lessons.map((lesson) => lesson.category)).size);
  const openLesson = page.locator('[data-lesson] .lesson-explanation').first();
  const openId = await openLesson.locator('..').getAttribute('id');
  await openLesson.locator('summary').click();
  await page.selectOption('[name="view"]', 'date');
  assert.ok((await page.locator(`[id="${openId}"] .lesson-explanation`).getAttribute('open')) !== null, 'Grouping preserves expanded explanations');
  const dates = await page.locator('[data-lesson]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-date')));
  assert.deepEqual(dates, [...dates].sort().reverse(), 'Date view is newest first');
  await page.selectOption('[name="category"]', category.id);
  await assertItems(page, category.id);
  await page.locator('.lesson-tag-picker > summary').click();
  for (const tag of pair.tags.slice(0, 2)) await page.locator(`[name="tag"][value="${tag}"]`).check();
  await assertItems(page, category.id, pair.tags.slice(0, 2));
  assert.equal(new URL(page.url()).searchParams.getAll('tag').length, 2);
  await page.goBack();
  await assertItems(page, category.id, pair.tags.slice(0, 1));
  await page.goForward();
  await assertItems(page, category.id, pair.tags.slice(0, 2));
  await page.reload();
  await page.locator('[data-lesson-controls]').waitFor({ state: 'visible' });
  await assertItems(page, category.id, pair.tags.slice(0, 2));
  await page.locator('.lesson-back').click();
  await page.waitForURL('**/blog/#lessons');
  await page.goBack();
  await page.locator('[data-lesson-controls]').waitFor({ state: 'visible' });
  await assertItems(page, category.id, pair.tags.slice(0, 2));
  // A jump to a distinct earlier visit must remain a router navigation, even at the same path.
  await page.locator('.lesson-back').click();
  await page.waitForURL('**/blog/#lessons');
  await page.locator('a[href="/blog/lessons/"]').click();
  await page.locator('[data-lesson-controls]').waitFor({ state: 'visible' });
  await page.selectOption('[name="category"]', category.id);
  await page.evaluate(() => window.history.go(-3));
  await page.waitForURL((location) => location.searchParams.getAll('tag').length === 2);
  await page.locator('[data-lesson-controls]').waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.querySelectorAll('[name="tag"]:checked').length === 2);
  await assertItems(page, category.id, pair.tags.slice(0, 2));
  await page.locator('.lesson-tag-picker > summary').click();
  await page.locator('[name="tag-search"]').fill('no-such-tag-in-the-registry');
  assert.ok(await page.locator('[data-tag-search-empty]').isVisible());
  await assertItems(page, category.id, pair.tags.slice(0, 2));
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await assertItems(page);
  assert.equal(await page.locator('[name="view"]').inputValue(), 'date', 'Clear filters preserves the grouping choice');
  assert.equal(new URL(page.url()).searchParams.getAll('tag').length, 0);
  const mismatch = registry.categories.flatMap((item) => registry.tags.map((tag) => ({ category: item.id, tag: tag.id })))
    .find((item) => expected(item.category).length > 0 && lessons.some((lesson) => lesson.tags.includes(item.tag)) && expected(item.category, [item.tag]).length === 0);
  assert.ok(mismatch, 'A zero-result intersection is required');
  await page.goto(`${url}?category=${mismatch.category}&tag=${mismatch.tag}`);
  await page.locator('[data-lesson-controls]').waitFor({ state: 'visible' });
  assert.equal(await page.locator('[data-lesson]').count(), 0);
  assert.ok(await page.locator('[data-lesson-empty]').isVisible());
  assert.match(await page.locator('[data-lesson-result]').innerText(), /^0 of /);
  await page.goto(`${url}?category=unknown&tag=unknown&view=unknown`);
  await page.locator('[data-lesson-controls]').waitFor({ state: 'visible' });
  await assertItems(page);
  assert.equal(await page.locator('[name="view"]').inputValue(), 'category');
  const firstSelect = page.locator('[name="view"]');
  await firstSelect.focus();
  assert.ok(await firstSelect.evaluate((node) => node === document.activeElement));
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `No overflow at ${width}px`);
    if (output) {
      await mkdir(resolve(output), { recursive: true });
      await page.screenshot({ path: join(resolve(output), `lessons-${width}.png`) });
    }
  }
  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
  const staticPage = await noJs.newPage();
  await staticPage.goto(url);
  await assertItems(staticPage);
  assert.equal(await staticPage.locator('[data-lesson-controls]').isVisible(), false);
  assert.ok(await staticPage.locator('noscript > p').isVisible());
  assert.ok(await staticPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await noJs.close();
  assert.deepEqual(failures, [], 'No browser page errors');
  console.log(`Lesson browser passed: ${lessons.length} entries; category/date grouping, tag intersections, URL/history, empty/reset/search, mobile and no-JS.`);
  await context.close();
} finally {
  await browser?.close();
  preview?.child.kill();
}
