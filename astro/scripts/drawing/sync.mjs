// Bring the engineering drawing playbook in from its one source, the experience vault's
// Playbooks/drawing (R-DRW-22): SKILL, RULES, LOOK and STANDARDS into .claude/skills/drawing, and
// the kernel (the code that lays out and renders the drawings) into src/figures/kit/drawing. The
// kernel's host.ts is the site's own and never synced. The LEGO-specific drawing rules stay in
// .claude/skills/lego/drawing and are edited here.
//   npm run drawing:sync -- <vault>          copy
//   npm run drawing:sync -- <vault> --check  fail if any copy differs from the vault
import { copyFileSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { mustReveal, record } from '../playbooks/copies.mjs';

const [vault, flag] = process.argv.slice(2);
if (!vault) {
  console.error('usage: npm run drawing:sync -- <path to experience-vault> [--check]');
  process.exit(2);
}
const here = (p) => new URL(`../../../${p}`, import.meta.url).pathname;
const KERNEL = 'astro/src/figures/kit/drawing';
const kernel = readdirSync(join(vault, 'Playbooks/drawing/kernel')).filter((f) => f.endsWith('.ts') && f !== 'host.ts');
const FILES = [
  ...['SKILL.md', 'RULES.md', 'LOOK.md', 'STANDARDS.md'].map((f) => [f, `.claude/skills/drawing/${f}`]),
  ...kernel.map((f) => [`kernel/${f}`, `${KERNEL}/${f}`]),
];
mustReveal(
  vault,
  'drawing',
  FILES.map(([from]) => from),
);
const differ = [];
mkdirSync(here('.claude/skills/drawing'), { recursive: true });
mkdirSync(here(KERNEL), { recursive: true });
const ours = new Set([...kernel, 'host.ts']);
for (const f of readdirSync(here(KERNEL))) if (!ours.has(f)) differ.push(`${KERNEL}/${f} (not in the vault)`);
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
} else {
  record(
    'drawing',
    FILES.map(([, to]) => here(to)),
  );
  console.log(`drawing: synced ${FILES.length} files from the vault`);
}
