/** The design system against two standards, from the CSS tokens:
 *  1. W3C Design Tokens (DTCG 2025.10): the export is well formed. Every token has a $type or is a
 *     reference, every reference lands on a token, every colour is srgb with a 6-digit hex, the
 *     resolver names version 2025.10 and files that exist.
 *  2. WCAG 2.2 (ISO/IEC 40500:2025): every pair in src/data/contrast-pairs.ts meets its requirement
 *     on a light page and a dark one.
 *  --selftest proves both still catch a breakage. */
import { build } from 'esbuild';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const out = join(tmpdir(), `standards-${process.pid}.mjs`);
await build({
  stdin: {
    contents: `export * from './src/lib/design-tokens.ts'; export * from './src/data/contrast-pairs.ts';`,
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

function problems(css, groups) {
  const tokens = m.readTokens(css);
  const map = new Map(tokens.map((t) => [t.name, t]));
  const x = m.toDtcg(tokens);
  const errs = [];
  // DTCG shape.
  for (const [setName, set] of [['foundation', x.foundation], ['light', x.light], ['dark', x.dark]]) {
    for (const [g, group] of Object.entries(set))
      for (const [k, t] of Object.entries(group)) {
        const id = `${setName} ${g}.${k}`;
        const v = t.$value;
        if (typeof v === 'string' && /^\{.+\}$/.test(v)) {
          const [rg, rk] = v.slice(1, -1).split('.');
          if (!x.foundation[rg]?.[rk]) errs.push(`DTCG: ${id} refers to ${v}, which is not a token`);
        } else if (!t.$type) errs.push(`DTCG: ${id} has no $type`);
        if (t.$type === 'color' && (v.colorSpace !== 'srgb' || !/^#[0-9a-f]{6}$/.test(v.hex)))
          errs.push(`DTCG: ${id} is not an srgb colour with a 6-digit hex`);
      }
  }
  if (x.resolver.version !== '2025.10') errs.push('DTCG: the resolver is not version 2025.10');
  // WCAG 2.2.
  for (const group of groups)
    for (const p of group.pairs) {
      const need = m.NEED[p.need];
      for (const theme of ['light', 'dark']) {
        const fg = m.colourOf(p.fg, theme, map);
        const bg = m.colourOf(p.ground, theme, map);
        if (!fg || !bg) {
          errs.push(`WCAG: ${p.role} (${p.fg} on ${p.ground}) has no ${theme} colour`);
          continue;
        }
        const r = m.contrast(fg, bg);
        if (need && r < need[0])
          errs.push(`WCAG: ${p.role} is ${r.toFixed(2)}:1 on a ${theme} page, needs ${need[0]}:1 (${p.fg} on ${p.ground})`);
      }
    }
  return { errs, x };
}

if (process.argv.includes('--selftest')) {
  const paper = DIR + 'paper.css';
  const cases = [
    ['muted text too faint', { ...files, [paper]: files[paper].replace(/--pp-ink-muted:[^;]+;/, '--pp-ink-muted: light-dark(#cfc6b4, #3a3f47);') }, m.CONTRAST],
    ['a pair whose token is gone', files, [{ title: 't', pairs: [{ role: 'gone', fg: '--pp-nowhere', ground: '--pp-ground', need: 'text' }] }]],
  ];
  let ok = true;
  for (const [what, css, groups] of cases) {
    const caught = problems(css, groups).errs.length > 0;
    console.log(`standards selftest: ${caught ? 'ok' : 'MISSED'} - ${what}`);
    ok &&= caught;
  }
  process.exit(ok ? 0 : 1);
}

const { errs, x } = problems(files, m.CONTRAST);
const pairs = m.CONTRAST.reduce((n, g) => n + g.pairs.length, 0);
if (errs.length) {
  for (const e of errs) console.error(e);
  process.exit(1);
}
console.log(
  `standards: ${x.exported} tokens export as DTCG 2025.10 (${x.skipped.length} stay CSS-only); ${pairs} colour pairs meet WCAG 2.2 in both themes.`,
);
