#!/usr/bin/env node
// Which source files can a page reach? Walks static and dynamic imports (and CSS @import) from
// every file in src/pages, and lists files under src/components, src/styles, src/layouts and
// src/hooks that nothing reaches. Unreached code costs no bytes on the site, but it is where
// hard-coded colours and old patterns hide, and an agent copying from it copies the old system.
// Usage: node scripts/site/reach.mjs [--json]
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const SRC = join(ROOT, 'src');
const EXT = ['', '.ts', '.tsx', '.astro', '.css', '.mjs', '.js', '/index.ts', '/index.tsx'];
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const IMPORT = /(?:import|export)\s[^'"`]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]|@import\s+(?:url\()?['"]([^'"]+)['"]/g;
const GLOB = /import\.meta\.glob(?:<[^>]*>)?\(\s*(\[[\s\S]*?\]|['"][^'"]+['"])/g;

function resolveSpec(from, spec) {
  if (!spec.startsWith('.') && !spec.startsWith('/src')) return null;
  const base = spec.startsWith('/src') ? join(ROOT, spec) : resolve(dirname(from), spec);
  for (const e of EXT) if (existsSync(base + e) && statSync(base + e).isFile()) return base + e;
  return null;
}
function globFiles(from, pattern) {
  const abs = pattern.startsWith('/') ? join(ROOT, pattern) : resolve(dirname(from), pattern);
  const re = new RegExp('^' + abs.replace(/[.+^${}()|\\]/g, '\\$&').replace(/\*\*\//g, '(?:.*/)?').replace(/\*/g, '[^/]*').replace(/\{([^}]*)\}/g, (_, a) => `(?:${a.split(',').join('|')})`) + '$');
  return walk(SRC).filter((f) => re.test(f));
}
const all = walk(SRC);
const seen = new Set();
const queue = all.filter((f) => f.startsWith(join(SRC, 'pages')));
while (queue.length) {
  const f = queue.pop();
  if (!f || seen.has(f)) continue;
  seen.add(f);
  if (!/\.(ts|tsx|astro|css|mjs|js|mdx|md)$/.test(f)) continue;
  const text = readFileSync(f, 'utf8');
  for (const m of text.matchAll(IMPORT)) {
    const r = resolveSpec(f, m[1] ?? m[2] ?? m[3] ?? m[4] ?? '');
    if (r) queue.push(r);
  }
  for (const m of text.matchAll(GLOB)) for (const p of m[1].match(/['"]([^'"]+)['"]/g) ?? []) queue.push(...globFiles(f, p.slice(1, -1)));
}
// Content collections are loaded by the pages through astro:content.
for (const f of all) if (f.startsWith(join(SRC, 'content'))) seen.add(f);
const unreached = all
  .filter((f) => /^src\/(components|styles|layouts|hooks)\//.test(relative(ROOT, f)) && !seen.has(f))
  .map((f) => relative(ROOT, f))
  .sort();
if (process.argv.includes('--json')) console.log(JSON.stringify(unreached, null, 2));
else {
  for (const f of unreached) console.log(f);
  console.log(`${unreached.length} file(s) under components, styles, layouts and hooks reached by no page`);
}
