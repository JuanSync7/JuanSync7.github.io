// Bring the blueprint kernel in from its one source, the experience vault's playbook
// Playbooks/blueprint (R-BP-9): its kernel into src/blueprints (the project keeps its specs, sheet,
// views, harness and index data beside it).
//   npm run blueprint:sync -- <vault>          copy, then run blueprint:check
//   npm run blueprint:sync -- <vault> --check  fail if any copy differs from the vault
import { copyFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const [vault, flag] = process.argv.slice(2);
if (!vault) {
  console.error('usage: npm run blueprint:sync -- <path to experience-vault> [--check]');
  process.exit(2);
}
const here = (p) => new URL(`../../${p}`, import.meta.url).pathname;
const FILES = [
  'types.ts',
  'dom.ts',
  'measure.ts',
  'sizing.ts',
  'drawing.ts',
  'catalogue.ts',
  'overlay.ts',
  'window.ts',
].map((f) => [`kernel/${f}`, `src/blueprints/${f}`]);
const differ = [];
for (const [from, to] of FILES) {
  const src = join(vault, 'Playbooks/blueprint', from);
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
    console.error(`blueprint: differs from the vault: ${differ.join(', ')}. Change the vault, then sync.`);
    process.exit(1);
  }
  console.log(`blueprint: ${FILES.length} files match the vault`);
} else console.log(`blueprint: synced ${FILES.length} files from the vault; now run npm run blueprint:check`);
