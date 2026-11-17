// A specimen sheet of the lettering, for review: npm run lettering:sheet
// Writes figures-out/lettering-specimen.png: every character large on its grid, then drawing
// text at the ISO heights. Needs Playwright's Chromium (PLAYWRIGHT_BROWSERS_PATH as for sheets).
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';

const font = readFileSync(new URL('../../public/fonts/iso-lettering-b.otf', import.meta.url)).toString('base64');
const chars = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', ...'0123456789', ...'-.,:/()=+\'"#!?%Ø±°×'];
const cap = (h) => `${(h / 0.7).toFixed(3)}mm`;
const html = `<html><head><style>
@font-face{font-family:iso;src:url(data:font/otf;base64,${font})}
body{margin:0;padding:12mm;background:#0b0c10;color:#d6d9e2;font-family:iso;width:380mm}
.grid{display:grid;grid-template-columns:repeat(14,1fr);gap:2mm}
.c{border:0.2mm solid #2a2e3a;font-size:${cap(10)};line-height:1;padding:3mm 0 2mm;text-align:center;
 background-image:linear-gradient(#1a1e28 0.2mm,transparent 0.2mm);background-size:100% 1mm}
p{margin:4mm 0;line-height:1.4}
</style></head><body>
<div class="grid">${chars.map((c) => `<div class="c">${c.replace('<', '&lt;')}</div>`).join('')}</div>
${[7, 5, 3.5, 2.5].map((h) => `<p style="font-size:${cap(h)}">${h} MM: SIDE ELEVATION  SECTION A-A (1:5)  1126  547  Ø 12 ± 0.5  45°  REAR WING, 2026 RULES</p>`).join('')}
</body></html>`;
mkdirSync(new URL('../../figures-out/', import.meta.url), { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
await p.setContent(html);
await p.evaluate(() => document.fonts.ready);
await p.screenshot({
  path: new URL('../../figures-out/lettering-specimen.png', import.meta.url).pathname,
  fullPage: true,
});
await b.close();
console.log('lettering: wrote figures-out/lettering-specimen.png');
