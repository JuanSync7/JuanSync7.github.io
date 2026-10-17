#!/usr/bin/env node
/**
 * A seed sheet for one template: `node scripts/figures/seeds.mjs <template> [count] [--from=N] [--url=URL]`.
 * Captures instances <template>~N … at rest (t = restT, frozen) on the bench and lays them
 * out on one sheet, figures-out/<template>.seeds.png, labelled with its seed and its alt text. The
 * look checks three seeds; this is for reading the whole range of a template's grammar.
 * It needs a running dev server (--url, default http://127.0.0.1:4399).
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { FIX_TPL_DIR, ROOT, TPL_DIR, readMeta } from './source.mjs';
import { writeSheet } from './sheet.mjs';

const TH = JSON.parse(readFileSync(join(ROOT, 'scripts', 'figures', 'thresholds.json'), 'utf8'));
const args = process.argv.slice(2);
const [id, countArg] = args.filter((a) => !a.startsWith('--'));
const url = (args.find((a) => a.startsWith('--url='))?.slice(6) ?? 'http://127.0.0.1:4399').replace(/\/$/, '');
const from = Number(args.find((a) => a.startsWith('--from='))?.slice(7) ?? 1);
const count = Number(countArg ?? 12);
if (!id) {
  console.log('usage: seeds.mjs <template> [count] [--from=N] [--url=URL]');
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
const shots = [];
for (let seed = from; seed < from + count; seed++) {
  const inst = `${id}~${seed}`;
  await page.goto(`${url}/figures?only=${inst}&w=420&t=${TH.restT}`, { waitUntil: 'load' });
  const sel = `[data-bench-figure="${inst}"] canvas`;
  const ok = await page.waitForSelector(`${sel}[data-ready="1"], [data-bench-error]`, { timeout: 30000 }).then(() => page.$(sel)).catch(() => null);
  if (!ok) {
    console.log(`seed ${seed}: did not render`);
    continue;
  }
  const title = await page.$eval(sel, (c) => c.getAttribute('aria-label') ?? '');
  shots.push({ label: `seed ${seed}`, png: await ok.screenshot(), alt: title });
}
mkdirSync(join(ROOT, 'figures-out'), { recursive: true });
const out = join(ROOT, 'figures-out', `${id}.seeds.png`);
const src = [join(TPL_DIR, `${id}.ts`), join(FIX_TPL_DIR, `${id}.ts`)].find((f) => existsSync(f));
const meta = src ? readMeta(src) : {};
await writeSheet(browser, out, { id: `${id} · seeds ${from}–${from + count - 1}`, style: `template · ${meta.style ?? '?'}`, motion: 'rest frames', answers: Boolean(meta.answers), bleed: Boolean(meta.bleed) }, shots, shots.map((s) => ({ level: 'ok', text: `${s.label}: ${s.alt}` })));
await browser.close();
console.log(`wrote ${out}`);
