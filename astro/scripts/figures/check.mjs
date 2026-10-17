#!/usr/bin/env node
/**
 * The figure source check: `node scripts/figures/check.mjs [id ...] [--fixtures] [--selftest]`.
 * It reads the text of every figure in src/figures (or the ones named) and prints one line
 * per problem, then exits 1 if there was any. It catches what is mechanical; the look
 * (look.mjs) catches what only a picture shows. Each line starts with the check's code:
 *
 *   parse    the file parses as TypeScript (a syntax error otherwise surfaces only as a 500
 *            from the dev server, after the look has waited out its timeout)
 *   define   the file's default export is defineCanvasFigure(...) or defineThreeFigure(...)
 *   id       the id is the file name, in kebab-case
 *   meta     title, alt, idea, style, motion, answers, group, seed and aspect are all declared
 *   colour   no colour literal (hex, rgb, hsl, 0x...): every colour comes from kit/ink
 *   random   no Math.random: randomness comes from the seeded rng
 *   clock    no timers, frames or wall-clock reads: the loop owns time
 *   dom      no document, window, listeners or measuring: the loop owns input
 *   words    no text drawn on the canvas: names go to the read-out
 *   glow     no shadows, filters, gradients or blend modes: the signal is the only highlight
 *   width    no stroke wider than 1.5px: weight is opacity, not width
 *   imports  only the kit, the define helpers, the types and three
 *   length   at most 200 lines that aren't blank
 *   variety  within a group, no style covers more than a third (or two figures)
 *   covers   every post names a cover figure; no two posts share one; date neighbours differ in style
 *
 * --list prints every figure's id, group, style and motion, grouped, and exits: read it
 * before choosing a style, so a new figure differs from its neighbours.
 * --fixtures checks src/figures/fixtures instead. --selftest checks the fixtures and fails
 * unless each one reports exactly the codes its `// expect-check:` header lists.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'esbuild';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const FIG_DIR = join(ROOT, 'src', 'figures');
const FIX_DIR = join(FIG_DIR, 'fixtures');
const POSTS = join(ROOT, 'src', 'content', 'blog');
const SUPPORT = new Set(['types', 'define', 'defineThree', 'registry']);

const typesSrc = readFileSync(join(FIG_DIR, 'types.ts'), 'utf8');
const listOf = (name) => {
  const m = typesSrc.match(new RegExp(`export const ${name} = \\[([^\\]]*)\\]`));
  return m ? [...m[1].matchAll(/'([a-z0-9-]+)'/g)].map((x) => x[1]) : [];
};
const STYLES = listOf('FIGURE_STYLES');
const MOTIONS = listOf('FIGURE_MOTIONS');
const GROUPS = listOf('FIGURE_GROUPS');

/** Splits source into code with comments removed; `strings: false` also empties strings. */
function bare(src, strings = true) {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const d = src[i + 1];
    if (c === '/' && d === '/') {
      while (i < src.length && src[i] !== '\n') i++;
    } else if (c === '/' && d === '*') {
      const end = src.indexOf('*/', i + 2);
      i = end < 0 ? src.length : end + 2;
      out += ' ';
    } else if (c === '"' || c === "'" || c === '`') {
      const q = c;
      let j = i + 1;
      while (j < src.length && src[j] !== q) j += src[j] === '\\' ? 2 : 1;
      out += strings ? src.slice(i, j + 1) : q + q;
      i = j + 1;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

function parseError(raw) {
  try {
    transformSync(raw, { loader: 'ts' });
    return null;
  } catch (err) {
    const e = err.errors?.[0];
    return e ? `line ${e.location?.line}:${e.location?.column}: ${e.text}` : String(err.message).split('\n')[0];
  }
}

const RULES = [
  ['colour', (s) => /['"`][^'"`]*(#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\()/.test(s.withStrings) || /\b0x[0-9a-fA-F]{6}\b/.test(s.code), 'colour literal: take every colour from kit/ink (tone, ink, mix, hexOf)'],
  ['random', (s) => /Math\.random\b/.test(s.code), 'Math.random: use the seeded rng from setup or the frame'],
  ['clock', (s) => /\b(requestAnimationFrame|setTimeout|setInterval|Date\.now|performance\.now)\b/.test(s.code), 'own clock: use the frame’s t and dt'],
  ['dom', (s) => /\b(document|window)\.|getBoundingClientRect|addEventListener/.test(s.code), 'touches the DOM: the loop gives you size, pointer and pulses'],
  ['words', (s) => /\.(fillText|strokeText|measureText)\b/.test(s.code), 'text on the canvas: return the name as the read-out instead'],
  ['glow', (s) => /\b(shadowBlur|shadowColor|globalCompositeOperation|createLinearGradient|createRadialGradient)\b|\.filter\s*=/.test(s.code), 'glow or gradient: the signal stroke is the only highlight'],
  ['width', (s) => [...s.code.matchAll(/lineWidth\s*=\s*([\d.]+)/g)].some((m) => Number(m[1]) > 1.5), 'stroke wider than 1.5px: say weight with opacity'],
  ['imports', (s) => [...s.code.matchAll(/from\s+['"]([^'"]+)['"]/g)].some((m) => !/^(\.\.?\/)+(define|defineThree|types|kit\/[a-z]+)$|^three$/.test(m[1])), 'imports outside the kit'],
  ['length', (s) => s.raw.split('\n').filter((l) => l.trim()).length > 200, 'over 200 lines: a figure that long is usually two ideas'],
];

function checkFile(path, fixture) {
  const raw = readFileSync(path, 'utf8');
  const id = basename(path, '.ts');
  const s = { raw, code: bare(raw, false), withStrings: bare(raw, true) };
  const out = [];
  const fail = (code, msg) => out.push({ id, code, msg });
  const broken = parseError(raw);
  if (broken) fail('parse', broken);
  const isThree = /export default defineThreeFigure\s*(<[^>]*>)?\s*\(/.test(s.code);
  if (!isThree && !/export default defineCanvasFigure\s*(<[^>]*>)?\s*\(/.test(s.code)) fail('define', 'default export is not defineCanvasFigure(...) or defineThreeFigure(...)');
  // Meta lives in the default export's object, so read fields only after it: an interface
  // above it can have a field of the same name (`group: Group`).
  const spec = s.withStrings.slice(Math.max(0, s.withStrings.search(/export default define/)));
  const field = (k) => spec.match(new RegExp(`\\n\\s*${k}:\\s*('([^']*)'|[^,\\n]+)`));
  const str = (k) => field(k)?.[2];
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id) || str('id') !== id) fail('id', `id must be '${id}', the file name, in kebab-case`);
  const missing = [];
  if (!str('title')) missing.push('title');
  if ((str('alt') ?? '').length < 30) missing.push('alt (30+ characters)');
  if ((str('idea') ?? '').length < 30) missing.push('idea (30+ characters)');
  if (!isThree && !STYLES.includes(str('style') ?? '')) missing.push(`style (one of ${STYLES.join(', ')})`);
  if (!MOTIONS.includes(str('motion') ?? '')) missing.push(`motion (one of ${MOTIONS.join(', ')})`);
  if (!/^(true|false)$/.test(field('answers')?.[1]?.trim() ?? '')) missing.push('answers (true or false)');
  const group = str('group') ?? '';
  if (!GROUPS.includes(group) || (group === 'fixture') !== fixture) missing.push(fixture ? "group 'fixture'" : `group (one of ${GROUPS.filter((g) => g !== 'fixture').join(', ')})`);
  if (!/^\d+$/.test(field('seed')?.[1]?.trim() ?? '')) missing.push('seed (an integer)');
  if (!field('aspect')) missing.push('aspect');
  if (missing.length) fail('meta', `missing or invalid: ${missing.join('; ')}`);
  for (const [code, test, msg] of RULES) if (test(s)) fail(code, msg);
  return { id, style: isThree ? 'three' : str('style') ?? '', group, problems: out, expect: raw.match(/^\/\/ expect-check:\s*(.*)$/m)?.[1] };
}

const figureFiles = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.ts') && !SUPPORT.has(basename(f, '.ts'))).map((f) => join(dir, f)) : []);

function frontmatter(path) {
  const m = readFileSync(path, 'utf8').match(/^---\n([\s\S]*?)\n---/);
  const get = (k) => m?.[1].match(new RegExp(`^${k}:\\s*"?([^"\\n]*)"?`, 'm'))?.[1]?.trim();
  return { slug: basename(path).replace(/\.mdx?$/, ''), cover: get('cover'), date: get('date') ?? '' };
}

function crossChecks(results) {
  const out = [];
  const byGroup = new Map();
  for (const r of results) byGroup.set(r.group, [...(byGroup.get(r.group) ?? []), r]);
  for (const [group, rs] of byGroup) {
    const cap = Math.max(2, Math.ceil(rs.length / 3));
    const counts = new Map();
    rs.forEach((r) => counts.set(r.style, (counts.get(r.style) ?? 0) + 1));
    for (const [style, n] of counts) if (n > cap) out.push({ id: group, code: 'variety', msg: `${n} of ${rs.length} ${group} figures are ${style}; at most ${cap}` });
  }
  if (!existsSync(POSTS)) return out;
  const style = new Map(results.map((r) => [r.id, r]));
  const posts = readdirSync(POSTS).filter((f) => /\.mdx?$/.test(f)).map((f) => frontmatter(join(POSTS, f))).sort((a, b) => b.date.localeCompare(a.date));
  const used = new Map();
  posts.forEach((p, i) => {
    const fig = p.cover ? style.get(p.cover) : undefined;
    if (!p.cover) out.push({ id: p.slug, code: 'covers', msg: 'post has no `cover:` figure id in its frontmatter' });
    else if (!fig || fig.group !== 'cover') out.push({ id: p.slug, code: 'covers', msg: `cover '${p.cover}' is not a figure in group 'cover'` });
    if (p.cover && used.has(p.cover)) out.push({ id: p.slug, code: 'covers', msg: `cover '${p.cover}' is already used by ${used.get(p.cover)}` });
    if (p.cover) used.set(p.cover, p.slug);
    const prev = posts[i - 1];
    const prevFig = prev?.cover ? style.get(prev.cover) : undefined;
    if (fig && prevFig && fig.style === prevFig.style) out.push({ id: p.slug, code: 'covers', msg: `same style (${fig.style}) as the post before it, ${prev.slug}` });
  });
  return out;
}

const args = process.argv.slice(2);
const selftest = args.includes('--selftest');
const fixtures = selftest || args.includes('--fixtures');
const only = args.filter((a) => !a.startsWith('--'));
const files = figureFiles(fixtures ? FIX_DIR : FIG_DIR).filter((f) => only.length === 0 || only.includes(basename(f, '.ts')));
const results = files.map((f) => checkFile(f, fixtures));
const problems = [...results.flatMap((r) => r.problems), ...(fixtures || only.length ? [] : crossChecks(results))];

if (args.includes('--list')) {
  const rows = [...results].sort((a, b) => a.group.localeCompare(b.group) || a.style.localeCompare(b.style));
  for (const r of rows) console.log(`${r.group.padEnd(8)} ${r.style.padEnd(12)} ${r.id}`);
  process.exit(0);
}

if (selftest) {
  let bad = 0;
  // A fixture that does not parse would also break the bench and astro check, so the parse
  // check is proved here on a literal instead: the apostrophe that once cost a 25 s timeout.
  const parseCaught = parseError("const idea = 'the pointer's height';") !== null && parseError("const idea = 'ok';") === null;
  if (!parseCaught) bad++;
  console.log(`${parseCaught ? 'ok  ' : 'FAIL'}  ${'(inline parse)'.padEnd(16)} expected [parse]  got [${parseCaught ? 'parse' : ''}]`);
  for (const r of results) {
    const want = (r.expect ?? '').split(',').map((x) => x.trim()).filter((x) => x && x !== 'none').sort();
    const got = [...new Set(r.problems.map((p) => p.code))].sort();
    const ok = want.join() === got.join();
    if (!ok) bad++;
    console.log(`${ok ? 'ok  ' : 'FAIL'}  ${r.id.padEnd(16)} expected [${want.join(', ')}]  got [${got.join(', ')}]`);
  }
  console.log(bad ? `selftest failed: ${bad} fixture(s) not caught as expected` : `selftest passed: ${results.length} fixtures`);
  process.exit(bad ? 1 : 0);
}

for (const p of problems) console.log(`${p.code.padEnd(8)} ${p.id.padEnd(22)} ${p.msg}`);
console.log(problems.length ? `check failed: ${problems.length} problem(s) in ${results.length} figure(s)` : `check passed: ${results.length} figure(s)`);
process.exit(problems.length ? 1 : 0);
