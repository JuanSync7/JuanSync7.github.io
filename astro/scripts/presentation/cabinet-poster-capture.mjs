import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { posterManifest } from './cabinet-poster.mjs';

/** Export the actual renderer, with no bench controls or separately maintained geometry. */
export async function captureCabinetPoster(context, base, output) {
  const page = await context.newPage();
  try {
    await page.goto(`${base}/figures/?only=vault-cabinet&w=500&t=1.2`);
    const bench = page.locator('[data-bench-figure="vault-cabinet"]');
    await bench.waitFor();
    await bench.evaluate((node) => { node.style.width = '500px'; node.style.height = '560px'; node.style.aspectRatio = 'auto'; });
    await page.waitForFunction(() => {
      const canvas = document.querySelector('[data-bench-figure="vault-cabinet"] canvas');
      return canvas?.dataset.ready === '1' && canvas.width === 1000 && canvas.height === 1120;
    });
    assert.equal(await bench.locator('canvas').getAttribute('data-error'), null);
    await bench.locator('.figure-readout').evaluate((node) => { node.style.visibility = 'hidden'; });
    const bytes = await bench.locator('canvas').screenshot({ path: join(output, 'cabinet-poster.png') });
    await writeFile(join(output, 'cabinet-poster-source.json'), `${JSON.stringify(posterManifest(bytes), null, 2)}\n`);
  } finally {
    await page.close();
  }
}
