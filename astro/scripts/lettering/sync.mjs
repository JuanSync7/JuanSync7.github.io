// Bring the ISO 3098 lettering in from its one source, the experience vault's playbook
// Playbooks/lettering (R-LET-4): its kernel into src/lib/lettering, its checks into scripts/lettering.
//   npm run lettering:sync -- <vault>          copy, then run lettering:build
//   npm run lettering:sync -- <vault> --check  fail if any copy differs from the vault
import { copyFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mustReveal, record } from '../playbooks/copies.mjs';

const [vault, flag] = process.argv.slice(2);
if (!vault) {
  console.error('usage: npm run lettering:sync -- <path to experience-vault> [--check]');
  process.exit(2);
}
const here = (p) => new URL(`../../${p}`, import.meta.url).pathname;
const FILES = [
  ...['glyphs.ts', 'metrics.ts', 'outline.ts', 'font.ts', 'index.ts', 'README.md'].map((f) => [`kernel/${f}`, `src/lib/lettering/${f}`]),
  ...['build.mjs', 'specimen.mjs'].map((f) => [`checks/${f}`, `scripts/lettering/${f}`]),
];
mustReveal(
  vault,
  'lettering',
  FILES.map(([from]) => from),
  FILES.map(([, to]) => here(to)),
);
const differ = [];
for (const [from, to] of FILES) {
  const src = join(vault, 'Playbooks/lettering', from);
  if (flag === '--check') {
    let same = false;
    try {
      same = readFileSync(src).equals(readFileSync(here(to)));
    } catch {
      same = false;
    }
    if (!same) differ.push(to);
  } else copyFileSync(src, here(to));
}
if (flag === '--check') {
  if (differ.length) {
    console.error(`lettering: differs from the vault: ${differ.join(', ')}. Change the vault, then sync.`);
    process.exit(1);
  }
  console.log(`lettering: ${FILES.length} files match the vault`);
} else {
  record(
    'lettering',
    FILES.map(([, to]) => here(to)),
  );
  console.log(`lettering: synced ${FILES.length} files from the vault; now run npm run lettering:build`);
}
