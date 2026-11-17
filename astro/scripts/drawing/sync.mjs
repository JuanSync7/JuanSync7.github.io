// Bring the engineering drawing playbook in from its one source, the experience vault's
// Playbooks/drawing (R-DRW-22): SKILL, RULES, LOOK and STANDARDS into .claude/skills/drawing.
// The LEGO-specific drawing rules stay in .claude/skills/lego/drawing and are edited here.
//   npm run drawing:sync -- <vault>          copy
//   npm run drawing:sync -- <vault> --check  fail if any copy differs from the vault
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const [vault, flag] = process.argv.slice(2);
if (!vault) {
  console.error('usage: npm run drawing:sync -- <path to experience-vault> [--check]');
  process.exit(2);
}
const here = (p) => new URL(`../../../${p}`, import.meta.url).pathname;
const FILES = ['SKILL.md', 'RULES.md', 'LOOK.md', 'STANDARDS.md'].map((f) => [f, `.claude/skills/drawing/${f}`]);
const differ = [];
mkdirSync(here('.claude/skills/drawing'), { recursive: true });
for (const [from, to] of FILES) {
  const src = join(vault, 'Playbooks/drawing', from);
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
    console.error(`drawing: differs from the vault: ${differ.join(', ')}. Change the vault, then sync.`);
    process.exit(1);
  }
  console.log(`drawing: ${FILES.length} files match the vault`);
} else console.log(`drawing: synced ${FILES.length} files from the vault`);
