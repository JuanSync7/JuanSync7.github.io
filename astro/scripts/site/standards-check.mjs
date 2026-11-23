/** The design system against two standards, from the CSS tokens, using the checks of frontend-kit's
 *  design-tokens package (synced into src/lib/tokens by tokens:sync):
 *  1. W3C Design Tokens (DTCG 2025.10): the export the site publishes at /tokens/ is well formed.
 *  2. WCAG 2.2 (ISO/IEC 40500:2025): every pair in src/data/contrast-pairs.ts meets its requirement
 *     on a light page and a dark one.
 *  --selftest proves both still catch a breakage on the site's own tokens. */
import { build } from 'esbuild';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const out = join(tmpdir(), `standards-${process.pid}.mjs`);
await build({
  stdin: {
    contents: [
      `export * from './src/lib/tokens/index.ts';`,
      `export * from './src/data/contrast-pairs.ts';`,
      `export * from './src/data/token-export.ts';`,
    ].join(' '),
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  logLevel: 'error',
});
const m = await import(out);

const DIR = 'src/styles/tokens/';
const files = Object.fromEntries(
  readdirSync(DIR)
    .filter((f) => f.endsWith('.css') && f !== 'index.css')
    .map((f) => [DIR + f, readFileSync(DIR + f, 'utf8')]),
);
const check = (css, groups) => m.checkTokens(m.readTokens(css), groups, m.TOKEN_EXPORT);

if (process.argv.includes('--selftest')) {
  const paper = DIR + 'paper.css';
  const faint = files[paper].replace(/--pp-ink-muted:[^;]+;/, '--pp-ink-muted: light-dark(#cfc6b4, #3a3f47);');
  const gone = [{ title: 't', pairs: [{ role: 'gone', fg: '--pp-nowhere', ground: '--pp-ground', need: 'text' }] }];
  const cases = [
    ['muted text too faint', check({ ...files, [paper]: faint }, m.CONTRAST).errs],
    ['a pair whose token is gone', check(files, gone).errs],
  ];
  let ok = true;
  for (const [what, errs] of cases) {
    console.log(`standards selftest: ${errs.length ? 'ok' : 'MISSED'} - ${what}`);
    ok &&= errs.length > 0;
  }
  process.exit(ok ? 0 : 1);
}

const { errs, dtcg, pairs } = check(files, m.CONTRAST);
if (errs.length) {
  for (const e of errs) console.error(e);
  process.exit(1);
}
console.log(
  `standards: ${dtcg.exported} tokens export as DTCG 2025.10 (${dtcg.skipped.length} stay CSS-only); ${pairs} colour pairs meet WCAG 2.2 in both themes.`,
);
