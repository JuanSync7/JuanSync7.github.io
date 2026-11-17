// Draws one stage of a LEGO model as a sheet for review: `npm run lego:sheet -- <model> <stage>`
// with stage wire (plan, four views), solid (isometric model, 360°), lego (pieces, 360°) or
// catalogue; for a reference sketch (kit/legosketches.ts) sketch, sketch3d, compare, drawing (an A3
// first-angle drawing) or parts (a general arrangement's parts list). Needs the dev server (`--url=`, default http://127.0.0.1:4321); writes
// figures-out/lego-<model>-<stage>.png. `--only=45,top` picks views, `--tile=1000` sizes them. Read the sheet before going on to the next stage.
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const url = (args.find((a) => a.startsWith('--url=')) ?? '--url=http://127.0.0.1:4321').slice(6);
const [model = 'f1', stage = 'lego'] = args.filter((a) => !a.startsWith('--'));
const opt = (k, d) => (args.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split('=')[1];
const tile = Number(opt('tile', 360));
const only = opt('only', '');
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage();
await page.goto(`${url}/figures/`);
// Drawing sheets letter in the site's ISO 3098 font: have it loaded before any canvas uses it.
await page.evaluate(() => document.fonts.load("10px 'ISO Lettering B'"));
const data = await page.evaluate(
  async ([m, s, t, o]) => (await import('/src/figures/kit/legostudio.ts')).sheet(m, s, t, o),
  [model, stage, tile, only],
);
await browser.close();
mkdirSync('figures-out', { recursive: true });
const out = `figures-out/lego-${model}-${stage}${only ? `-${only.replace(/,/g, '_')}` : ''}.png`;
writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
console.log(`wrote ${out}`);
