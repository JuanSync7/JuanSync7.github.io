// Bring the LEGO catalogue in from its one source, the bricks package in JuanSync7/frontend-kit
// (R-VOX-18): bricks/src/lego*.ts into src/figures/kit, and the real-part map into
// scripts/lego/ldraw-parts.json. The site keeps its models, scenes, sheets and drawings beside them.
// A piece is added or changed in frontend-kit, checked there (its selftest and reference compare),
// then synced here.
//   npm run lego:sync -- <frontend-kit>          copy, then run lego:check
//   npm run lego:sync -- <frontend-kit> --check  fail if any copy differs from frontend-kit
import { copyFileSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const [kit, flag] = process.argv.slice(2);
if (!kit) {
  console.error('usage: npm run lego:sync -- <path to frontend-kit> [--check]');
  process.exit(2);
}
const here = (p) => new URL(`../../${p}`, import.meta.url).pathname;
const src = join(kit, 'bricks/src');
const FILES = [
  ...readdirSync(src)
    .filter((f) => /^lego\w+\.ts$/.test(f))
    .map((f) => [join(src, f), `src/figures/kit/${f}`]),
  [join(kit, 'bricks/parts/ldraw-parts.json'), 'scripts/lego/ldraw-parts.json'],
];
const differ = [];
for (const [from, to] of FILES) {
  if (flag === '--check') {
    let same = false;
    try {
      same = readFileSync(from).equals(readFileSync(here(to)));
    } catch {
      same = false;
    }
    if (!same) differ.push(to);
  } else copyFileSync(from, here(to));
}
if (flag === '--check') {
  if (differ.length) {
    console.error(`lego: differs from frontend-kit: ${differ.join(', ')}. Change frontend-kit/bricks, then sync.`);
    process.exit(1);
  }
  console.log(`lego: ${FILES.length} files match frontend-kit/bricks`);
} else console.log(`lego: synced ${FILES.length} files from frontend-kit/bricks; now run lego:check`);
