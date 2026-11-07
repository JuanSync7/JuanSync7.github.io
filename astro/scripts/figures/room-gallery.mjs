import { readFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';
const out = resolve(process.argv.find((a) => a.startsWith('--out='))?.slice(6) ?? 'figures-out');
mkdirSync(out, { recursive: true });
const themes = [
  ['dining', 'Dining · warm daylight'],
  ['work', 'Work · neutral daylight'],
  ['computer', 'Computer · cool night light'],
  ['storage', 'Storage · working light'],
  ['messy', 'Workshop · daylight and brick'],
  ['study', 'Study · warm reading light'],
  ['kitchen', 'Kitchen · clean task light'],
  ['bar', 'Bar · amber practical light'],
  ['lab', 'Lab · cool task light'],
];
const palette = readFileSync('src/styles/tokens/palette.ts', 'utf8')
  .split('export const night = {')[1]
  .split('} as const')[0];
const colours = Object.fromEntries([...palette.matchAll(/(\w+):\s*'(#[0-9a-fA-F]{6})'/g)].map((m) => [m[1], m[2]]));
const browser = await chromium.launch();
try {
  for (const mode of ['colour', 'monochrome']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 100 } });
    const cells = themes
      .map(
        ([id, label]) =>
          `<figure><img src="data:image/png;base64,${readFileSync(join('figures-out', `room-${mode}-webgl-${id}.png`)).toString('base64')}"><figcaption>${label}</figcaption></figure>`,
      )
      .join('');
    await page.setContent(
      `<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:24px;background:${colours.ground};color:${colours.inkStrong};font:13px/1.5 system-ui}h1{margin:0 0 4px;font-size:23px}p{margin:0 0 20px;color:${colours.inkMuted}}main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}figure{margin:0}img{display:block;width:100%;border:1px solid ${colours.line2};box-sizing:border-box}figcaption{padding-top:8px;font:12px/1.4 ui-monospace,monospace;color:${colours.inkSoft}}</style><h1>Seeded rooms · ${mode === 'colour' ? 'full colour' : 'monochrome'}</h1><p>Textured surfaces · themed lighting · consistent seeded geometry</p><main>${cells}</main>`,
    );
    await page.locator('img').evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
    await page.screenshot({ path: join(out, `room-${mode}-gallery.png`), fullPage: true });
    await page.close();
  }
  copyFileSync('figures-out/room-colour-webgl-study.png', join(out, 'room-colour-hero.png'));
  copyFileSync('figures-out/room-monochrome-webgl-study.png', join(out, 'room-monochrome-hero.png'));
  console.log(`Wrote room colour/monochrome galleries and hero images in ${out}`);
} finally {
  await browser.close();
}
