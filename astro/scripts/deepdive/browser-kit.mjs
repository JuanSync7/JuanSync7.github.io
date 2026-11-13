import { existsSync } from 'node:fs';
import { chromium } from 'playwright';
import { ROOT } from './load.mjs';

/** Own the server handle and use its bound address, never a guessed/fallback port. */
export async function browserEnvironment(args = process.argv.slice(2)) {
  const supplied = args.find((a) => a.startsWith('--url='))?.slice(6);
  let server;
  let url = supplied?.replace(/\/$/, '');
  if (!url) {
    process.env.ASTRO_TELEMETRY_DISABLED = '1';
    const { dev } = await import('astro');
    server = await dev({ root: ROOT, server: { port: 4398, host: '127.0.0.1' } });
    url = `http://127.0.0.1:${server.address.port}`;
  }
  const executablePath =
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
    (!process.env.PLAYWRIGHT_BROWSERS_PATH && existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  let browser;
  try {
    browser = await chromium.launch({ executablePath });
  } catch (error) {
    await server?.stop();
    throw error;
  }
  return {
    browser,
    url,
    close: async () => {
      try {
        await browser.close();
      } finally {
        await server?.stop();
      }
    },
  };
}

export async function newPage(browser, width = 1440, reducedMotion = 'reduce') {
  const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion, colorScheme: 'dark' });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) =>
    route.fulfill({ status: 200, contentType: 'text/css', body: '' }),
  );
  return page;
}
