// Bring the token code in from its one source, the design-tokens package in JuanSync7/frontend-kit:
// design-tokens/src/*.ts into src/lib/tokens/, all but its command line. The site keeps what is its
// own beside it: the token files, the pairs (src/data/contrast-pairs.ts) and the export's names
// (src/data/token-export.ts). The code is changed in frontend-kit, checked there, then synced here.
//   npm run tokens:sync -- <frontend-kit>          copy, then run standards:check
//   npm run tokens:sync -- <frontend-kit> --check  fail if any copy differs from frontend-kit
import { copyFileSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const [kit, flag] = process.argv.slice(2);
if (!kit) {
  console.error('usage: npm run tokens:sync -- <path to frontend-kit> [--check]');
  process.exit(2);
}
const here = (p) => new URL(`../../${p}`, import.meta.url).pathname;
const src = join(kit, 'design-tokens/src');
const FILES = readdirSync(src)
  .filter((f) => f.endsWith('.ts') && f !== 'cli.ts')
  .map((f) => [join(src, f), `src/lib/tokens/${f}`]);
const differ = [];
mkdirSync(here('src/lib/tokens'), { recursive: true });
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
const extra = readdirSync(here('src/lib/tokens')).filter((f) => !FILES.some(([, to]) => to.endsWith(`/${f}`)));
if (extra.length) differ.push(...extra.map((f) => `src/lib/tokens/${f} (not in frontend-kit)`));
if (flag === '--check') {
  if (differ.length) {
    console.error(`tokens: differs from frontend-kit: ${differ.join(', ')}. Change frontend-kit/design-tokens, then sync.`);
    process.exit(1);
  }
  console.log(`tokens: ${FILES.length} files match frontend-kit/design-tokens`);
} else {
  if (extra.length) console.error(`tokens: not in frontend-kit, remove: ${extra.join(', ')}`);
  console.log(`tokens: synced ${FILES.length} files from frontend-kit/design-tokens; now run standards:check`);
}
