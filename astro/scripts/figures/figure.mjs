#!/usr/bin/env node
/**
 * The tight loop for one figure: `npm run figure -- <id> [--url=URL]`.
 * Runs the source check on that figure, and only if it passes, the look, which writes
 * figures-out/<id>.png. Exits with the first failure's code. Read the sheet every time.
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const ids = args.filter((a) => !a.startsWith('--'));
if (ids.length === 0) {
  console.log('usage: npm run figure -- <id> [<id> ...] [--url=http://127.0.0.1:4321]');
  process.exit(2);
}
const run = (script, extra) => spawnSync(process.execPath, [join(here, script), ...extra], { stdio: 'inherit' }).status ?? 1;
const checked = run('check.mjs', ids);
if (checked !== 0) process.exit(checked);
process.exit(run('look.mjs', args));
