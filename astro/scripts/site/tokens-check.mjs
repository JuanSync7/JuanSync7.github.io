#!/usr/bin/env node
// Holds the "tokens only" rule on the code that pages actually reach.
//  1. Ratchet: counts colour literals (hex, rgb(), hsl()) and pixel literals of 10px or more in
//     every reached CSS / Astro / TSX file outside styles/tokens, and fails if any file has more
//     than scripts/site/tokens-baseline.json allows. A file can only go down; `--update` writes the
//     new, lower counts after a cleanup. @media lines are exempt (custom properties cannot be used
//     there), and so are files no page reaches (see reach.mjs).
//  2. One palette: a colour that differs by theme is one light-dark(day, night) token in
//     tokens/paper.css, never a second value in a night block; the two night blocks (system
//     setting and theme button) hold only non-colour values and say the same thing.
// Usage: node scripts/site/tokens-check.mjs [--update]
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const BASE = join(ROOT, 'scripts/site/tokens-baseline.json');
const unreached = new Set(JSON.parse(execFileSync('node', [join(ROOT, 'scripts/site/reach.mjs'), '--json'], { encoding: 'utf8' })));
const files = execFileSync('git', ['ls-files', 'src'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .filter((f) => /\.(css|astro|tsx)$/.test(f) && !f.startsWith('src/styles/tokens/') && !unreached.has(f) && existsSync(join(ROOT, f)));
const COLOUR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/g;
const PX = /(?<![\w.-])(?:[1-9]\d{1,})(?:\.\d+)?px/g;
const counts = {};
for (const f of files) {
  const lines = readFileSync(join(ROOT, f), 'utf8').split('\n').filter((l) => !/@media|@container/.test(l));
  const text = lines.join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
  const n = (text.match(COLOUR)?.length ?? 0) + (text.match(PX)?.length ?? 0);
  if (n) counts[f] = n;
}
const fail = [];
if (process.argv.includes('--update')) {
  writeFileSync(BASE, JSON.stringify(Object.fromEntries(Object.entries(counts).sort()), null, 2) + '\n');
  console.log(`baseline written: ${Object.keys(counts).length} file(s), ${Object.values(counts).reduce((a, b) => a + b, 0)} literal(s)`);
} else {
  const base = existsSync(BASE) ? JSON.parse(readFileSync(BASE, 'utf8')) : {};
  for (const [f, n] of Object.entries(counts)) if (n > (base[f] ?? 0)) fail.push(`${f}: ${n} literal colour/px value(s), baseline allows ${base[f] ?? 0}; use a token`);
}
// One palette.
const paper = readFileSync(join(ROOT, 'src/styles/tokens/paper.css'), 'utf8');
const media = paper.match(/:root:not\(\[data-theme='light'\]\) \{([\s\S]*?)\n  \}/)?.[1]?.replace(/\s+/g, ' ').trim();
const forced = paper.match(/:root\[data-theme='dark'\] \{\s*color-scheme: dark;([\s\S]*?)\n\}/)?.[1]?.replace(/\s+/g, ' ').trim();
if (media !== forced) fail.push('paper.css: the two night blocks differ; keep them identical');
for (const m of (media ?? '').matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(|color-mix\()/g))
  fail.push(`paper.css: night colour ${m[1]} sits in a night block; fold it into its day token as light-dark(day, night)`);
if (fail.length) {
  console.error(fail.join('\n'));
  process.exit(1);
}
console.log(`tokens check passed: ${files.length} reached file(s)`);
