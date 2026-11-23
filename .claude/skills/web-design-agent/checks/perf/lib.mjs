// Shared by the performance probes: Playwright from the site's own install, Chrome from CHROME if
// set (Playwright's own Chromium otherwise), and a click on an in-site link the router intercepts.
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

export function browser(siteDir) {
  const require = createRequire(resolve(siteDir, 'package.json'));
  const { chromium } = require('playwright');
  return chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
}

export async function go(page, href) {
  await page.evaluate((h) => {
    const a = document.createElement('a');
    a.href = h;
    document.body.append(a);
    a.click();
  }, href);
}

export function args(usage) {
  const [siteDir, base, from, to] = process.argv.slice(2);
  if (!siteDir || !base || !from || !to) {
    console.error(`usage: node ${usage} <site astro dir> <base url> <from path> <to path>`);
    process.exit(2);
  }
  return { siteDir, base: base.replace(/\/$/, ''), from, to };
}
