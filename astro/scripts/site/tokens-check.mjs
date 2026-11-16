// Holds the "tokens only" rule on the code that pages actually reach.
//  1. Ratchet, by kind: colour literals (hex, rgb(), hsl()), pixel lengths of 10px or more, small
//     pixel lengths (2px to 9px; 0 and 1px hairlines are allowed), gradient literals and time
//     literals (ms, s), counted in every reached CSS / Astro / TSX file outside styles/tokens.
//     A file fails if any kind rises above scripts/site/tokens-baseline.json; `--update` writes the
//     new, lower counts after a cleanup. @media and @container lines are exempt (custom properties
//     cannot be used there), and so are files no page reaches (see reach.mjs).
//  2. Zero list: shared components (components/ui), the page chrome (components/layout, layouts)
//     and every file a component blueprint names in its `source` hold no colour or pixel literal
//     at all. LEGACY files are named with their reason.
//  3. One palette: a colour that differs by theme is one light-dark(day, night) token in
//     tokens/paper.css, never a second value in a night block; the two night blocks (system
//     setting and theme button) hold only non-colour values and say the same thing.
// Usage: node scripts/site/tokens-check.mjs [--update | --selftest]
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const BASE = join(ROOT, 'scripts/site/tokens-baseline.json');
const KINDS = {
  colour: /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/g,
  px: /(?<![\w.-])(?:[1-9]\d{1,})(?:\.\d+)?px/g,
  small: /(?<![\w.-])[2-9](?:\.\d+)?px/g,
  gradient: /\b(?:linear|radial|conic)-gradient\(/g,
  time: /(?<![\w.#-])\d+(?:\.\d+)?m?s\b(?![\w-])/g,
};
const STRICT = ['colour', 'px', 'small'];
// Shown only in the design system's legacy gallery, kept as they were; they leave with it.
const LEGACY = new Set(
  [
    'cube-swap.css',
    'zoom-swap.css',
    'KineticWord.tsx',
    'Placeholder.tsx',
    'PurpleSkyTransition.tsx',
    'StarfieldStage.tsx',
  ].map((f) => `src/components/ui/${f}`),
);

/** Counts each kind in a file's text. CSS is read whole; in .astro only its <style> blocks and
 *  style attributes; time is not counted in TSX, where numbers are often milliseconds of code. */
export function count(file, raw) {
  let text = raw
    .split('\n')
    .filter((l) => !/@media|@container/.test(l))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  if (file.endsWith('.astro'))
    text = [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>|style=["{`]([^"}`]*)/g)]
      .map((m) => m[1] ?? m[2])
      .join('\n');
  const out = {};
  for (const [k, re] of Object.entries(KINDS)) {
    if (k === 'time' && file.endsWith('.tsx')) continue;
    const n = text.match(re)?.length ?? 0;
    if (n) out[k] = n;
  }
  return out;
}

if (process.argv.includes('--selftest')) {
  const cases = [
    ['a.css', '.x { color: #f04a0e; }', 'colour'],
    ['a.css', '.x { width: 188px; }', 'px'],
    ['a.css', '.x { inset: 3px; }', 'small'],
    ['a.css', '.x { background: linear-gradient(red, blue); }', 'gradient'],
    ['a.css', '.x { transition: color 250ms ease; }', 'time'],
    ['a.astro', '<style>.x { padding: 20px; }</style>', 'px'],
    ['a.astro', '<div style="margin-top: 12px"></div>', 'px'],
  ];
  const clean = ['a.css', '.x { border: 1px solid var(--line); width: var(--w); margin: 0; }'];
  let bad = 0;
  for (const [f, t, k] of cases) {
    const got = count(f, t)[k] ?? 0;
    console.log(`tokens selftest: ${got ? 'ok' : 'MISSED'} - ${k} in ${t}`);
    if (!got) bad++;
  }
  const extra = Object.keys(count(...clean));
  console.log(`tokens selftest: ${extra.length ? `FLAGGED ${extra.join(', ')} in` : 'ok - nothing in'} ${clean[1]}`);
  process.exit(bad || extra.length ? 1 : 0);
}

const unreached = new Set(
  JSON.parse(execFileSync('node', [join(ROOT, 'scripts/site/reach.mjs'), '--json'], { encoding: 'utf8' })),
);
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', 'src'], {
  cwd: ROOT,
  encoding: 'utf8',
})
  .split('\n')
  .filter(
    (f) =>
      /\.(css|astro|tsx)$/.test(f) &&
      !f.startsWith('src/styles/tokens/') &&
      !unreached.has(f) &&
      existsSync(join(ROOT, f)),
  );
// The source files of component blueprints (a template's page sources are held by the ratchet,
// and its named sizes by blueprint:check, which fails a size a literal sets).
const named = readdirSync(join(ROOT, 'src/blueprints'))
  .filter((f) => f.endsWith('.ts'))
  .map((f) => readFileSync(join(ROOT, 'src/blueprints', f), 'utf8'))
  .filter((t) => /kind: 'component'/.test(t))
  .flatMap((t) =>
    [...(/source:\s*\[([\s\S]*?)\],?\s*(?:\/\/[^\n]*)?\n/.exec(t)?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1]),
  );
const zero = (f) => !LEGACY.has(f) && (/^src\/(components\/(ui|layout)|layouts)\//.test(f) || named.includes(f));
const counts = {};
for (const f of files) {
  const c = count(f, readFileSync(join(ROOT, f), 'utf8'));
  if (Object.keys(c).length) counts[f] = c;
}
const fail = [];
for (const [f, c] of Object.entries(counts))
  if (zero(f))
    for (const k of STRICT)
      if (c[k])
        fail.push(`${f}: ${c[k]} ${k} literal(s) in a zero-list file (shared, chrome or blueprinted); use a token`);
if (process.argv.includes('--update')) {
  writeFileSync(BASE, JSON.stringify(Object.fromEntries(Object.entries(counts).sort()), null, 2) + '\n');
  const total = Object.values(counts).reduce((a, c) => a + Object.values(c).reduce((x, y) => x + y, 0), 0);
  console.log(`baseline written: ${Object.keys(counts).length} file(s), ${total} literal(s)`);
} else {
  const base = existsSync(BASE) ? JSON.parse(readFileSync(BASE, 'utf8')) : {};
  for (const [f, c] of Object.entries(counts))
    for (const [k, n] of Object.entries(c)) {
      const allowed = typeof base[f] === 'object' ? (base[f][k] ?? 0) : 0;
      if (n > allowed) fail.push(`${f}: ${n} ${k} literal(s), baseline allows ${allowed}; use a token`);
    }
}
// One palette.
const paper = readFileSync(join(ROOT, 'src/styles/tokens/paper.css'), 'utf8');
const media = paper
  .match(/:root:not\(\[data-theme='light'\]\) \{([\s\S]*?)\n  \}/)?.[1]
  ?.replace(/\s+/g, ' ')
  .trim();
const forced = paper
  .match(/:root\[data-theme='dark'\] \{\s*color-scheme: dark;([\s\S]*?)\n\}/)?.[1]
  ?.replace(/\s+/g, ' ')
  .trim();
if (media !== forced) fail.push('paper.css: the two night blocks differ; keep them identical');
for (const m of (media ?? '').matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(|color-mix\()/g))
  fail.push(
    `paper.css: night colour ${m[1]} sits in a night block; fold it into its day token as light-dark(day, night)`,
  );
if (fail.length) {
  console.error(fail.join('\n'));
  process.exit(1);
}
console.log(`tokens check passed: ${files.length} reached file(s)`);
