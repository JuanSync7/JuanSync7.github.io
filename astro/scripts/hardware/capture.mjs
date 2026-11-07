import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';

const base = process.argv.find(a => a.startsWith('--url='))?.slice(6) ?? 'http://127.0.0.1:4387';
const name = process.argv.find(a => a.startsWith('--name='))?.slice(7) ?? 'after';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1120, height: 900 }, reducedMotion: 'reduce' });
  for (const mode of ['isometric','wireframe','exploded']) {
    await page.setContent(await readFile(`hardware-out/sheet-${mode}.svg`, 'utf8'));
    await page.locator('body').evaluate(b => b.style.margin = '0');
    await page.locator('svg').first().screenshot({ path: `hardware-out/${name}-${mode}.png` });
  }
  for (const [object, part, isolate] of [['accelerator',3,0],['accelerator',4,0],['server',1,1],['board',0,1],['sensor',4,1]]) {
    await page.goto(`${base}/lab/icon-kit/?object=${object}&part=${part}&isolate=${isolate}&open=1`);
    await page.locator('.atlas-stage canvas[data-ready="1"]').waitFor();
    await page.waitForFunction(o => new URL(location.href).searchParams.get('object') === o && document.querySelector('.atlas-stage canvas').getAttribute('aria-label').toLowerCase().includes(o === 'sensor' ? 'camera' : o),object);
    await page.waitForTimeout(100);
    await page.locator('.atlas-stage').screenshot({ path: `hardware-out/${name}-${object}-${part}.png` });
  }
} finally { await browser.close(); }
