// Component blueprints, measured from the components as they render on /design-system/.
//   npm run blueprint -- <id> [--store] [--url=…]   the A3 sheet: figures-out/blueprint-<id>.png, or with
//                                                   --store public/blueprints/<id>.png (the design system's copy)
//   npm run blueprint:check [-- --url=…]                        every spec against its component
// Needs the dev server and Playwright's Chromium (PLAYWRIGHT_BROWSERS_PATH as for other sheets).
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const url = (args.find((a) => a.startsWith('--url=')) ?? '--url=http://127.0.0.1:4321').slice(6);
const check = args.includes('--check');
const selftest = args.includes('--selftest');
const id = args.find((a) => !a.startsWith('--'));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(`${url}/design-system/`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.load("10px 'ISO Lettering B'"));
if (selftest) {
  // Each fixture breaks one spec on purpose; the check must catch it.
  const caught = await page.evaluate(async () => {
    const { BLUEPRINTS } = await import('/src/blueprints/index.ts');
    const { measure } = await import('/src/blueprints/measure.ts');
    const spec = BLUEPRINTS['paper-action'];
    const fixtures = {
      'a size set by the wrong token': (b) => (b.sizes[1].token = '--pa-padding-x'),
      'a part that fills marked hug': (b) => (b.parts[1].sizing = 'hug'),
      'a slot that hugs marked fill': (b) => (b.parts[2].sizing = 'fill'),
    };
    return Object.entries(fixtures).map(([name, breakIt]) => {
      const broken = structuredClone(spec);
      breakIt(broken);
      BLUEPRINTS['paper-action'] = broken;
      const found = measure('paper-action').problems.length > 0;
      BLUEPRINTS['paper-action'] = spec;
      return { name, found };
    });
  });
  await browser.close();
  for (const c of caught) console.log(`blueprint selftest: ${c.found ? 'ok' : 'MISSED'} - ${c.name}`);
  process.exit(caught.every((c) => c.found) ? 0 : 1);
}
if (check) {
  const results = await page.evaluate(async () => {
    const { BLUEPRINTS } = await import('/src/blueprints/index.ts');
    const { measure } = await import('/src/blueprints/measure.ts');
    return Object.keys(BLUEPRINTS).map((k) => ({ id: k, problems: measure(k).problems }));
  });
  await browser.close();
  const bad = results.filter((r) => r.problems.length);
  for (const r of results) console.log(`blueprint: ${r.id} ${r.problems.length ? 'FAILS' : 'matches its spec'}`);
  for (const r of bad) for (const p of r.problems) console.error(`  ${r.id}: ${p}`);
  process.exit(bad.length ? 1 : 0);
}
if (!id) {
  console.error('usage: npm run blueprint -- <id> | npm run blueprint:check');
  process.exit(2);
}
const data = await page.evaluate(async (k) => (await import('/src/blueprints/sheet.ts')).blueprintSheet(k), id);
await browser.close();
// --store keeps the sheet with the design system, linked from its blueprint on /design-system/.
const out = args.includes('--store') ? `public/blueprints/${id}.png` : `figures-out/blueprint-${id}.png`;
mkdirSync(out.slice(0, out.lastIndexOf('/')), { recursive: true });
writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
console.log(`wrote ${out}`);
