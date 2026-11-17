// Blueprints, measured on their real pages through /lab/blueprints/check/ (it works on the dev
// server and on the built site served by `astro preview`).
//   npm run blueprint:check                every spec against its component or page, every view
//   npm run blueprint:selftest             breaks specs and code on purpose; each must be caught
//   npm run blueprint -- <id> [--store]    the A3 sheets: figures-out/blueprint-<id>[-phone].png, or
//                                          with --store public/blueprints/ (the design system's copy)
//   npm run blueprint -- all --store       every sheet
// Options: --url=<server> (default http://127.0.0.1:4321). Needs Playwright's Chromium.
import { chromium } from 'playwright';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const url = (args.find((a) => a.startsWith('--url=')) ?? '--url=http://127.0.0.1:4321').slice(6);
const id = args.find((a) => !a.startsWith('--'));
const browser = await chromium.launch();

// Every blueprint's id, read from its spec file; one page each keeps a run from timing out.
const allIds = () =>
  readdirSync('src/blueprints')
    .map((f) => /\bid: '([\w-]+)',\s*kind:/.exec(readFileSync(`src/blueprints/${f}`, 'utf8'))?.[1])
    .filter(Boolean);

async function results(query) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', (e) => console.error(`page error: ${e.message}`));
  await page.goto(`${url}/lab/blueprints/check/?${query}`, { waitUntil: 'load' });
  await page.waitForSelector('#bp-results[data-done]', { timeout: 180000 });
  const r = JSON.parse(await page.textContent('#bp-results'));
  await page.close();
  return r;
}

if (args.includes('--selftest')) {
  const names = [
    'a size set by the wrong token',
    'a part that fills marked hug',
    'a slot that hugs marked fill',
    'a literal that equals the token',
    'a template part that is not there',
    'a fixed column marked fill',
  ];
  let missed = 0;
  for (const name of names) {
    const only = name.includes('template') || name.includes('column') ? 'blog-post' : 'paper-action';
    const r = await results(`only=${only}&break=${encodeURIComponent(name)}`);
    const found = r.some((x) => x.problems.length > 0);
    if (!found) missed++;
    console.log(`blueprint selftest: ${found ? 'ok' : 'MISSED'} - ${name}`);
  }
  await browser.close();
  process.exit(missed ? 1 : 0);
}
if (args.includes('--check')) {
  const r = [];
  for (const k of allIds()) r.push(...(await results(`only=${k}`)));
  await browser.close();
  for (const x of r) console.log(`blueprint: ${x.id} (${x.view}) ${x.problems.length ? 'FAILS' : 'matches its spec'}`);
  for (const x of r) for (const p of x.problems) console.error(`  ${x.id} (${x.view}): ${p}`);
  process.exit(r.some((x) => x.problems.length) ? 1 : 0);
}
if (!id) {
  console.error('usage: npm run blueprint -- <id|all> [--store] | blueprint:check | blueprint:selftest');
  process.exit(2);
}
const ids = id === 'all' ? allIds() : [id];
const r = [];
for (const k of ids) r.push(...(await results(`sheets&only=${k}`)));
await browser.close();
const dir = args.includes('--store') ? 'public/blueprints' : 'figures-out';
mkdirSync(dir, { recursive: true });
for (const x of r) {
  if (!x.sheet) continue;
  const name = `${args.includes('--store') ? '' : 'blueprint-'}${x.id}${x.view === 'desktop' ? '' : `-${x.view}`}.png`;
  writeFileSync(`${dir}/${name}`, Buffer.from(x.sheet.split(',')[1], 'base64'));
  console.log(`wrote ${dir}/${name}${x.problems.length ? ` (with ${x.problems.length} problem(s))` : ''}`);
}
