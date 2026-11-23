#!/usr/bin/env node
/**
 * The baked-figure audit: `node scripts/figures/plates.mjs [--selftest] [--no-sheet]`.
 * A baked figure (a plate) is drawn ahead of time by a playbook's kernel and registered by the
 * manifest it writes into src/figures/plates/. It is held to the same idea as a live figure: one
 * palette, one registry, an audit, and someone looks at its sheet. One line per problem, exit 1
 * if there was any. Each line starts with the check's code:
 *
 *   manifest  schema plate/1, id is the file name, title, alt, group, style, kernel and sources
 *   source    every theme and scale exists, decodes, and is the plate's size times its scale
 *   bytes     the manifest's byte counts are the files' (it was written by the kernel, after them)
 *   budget    each scale within plateBudgetKb in thresholds.json
 *   palette   every token it names is in tokens/paper.css, and the digest it was baked with is
 *             the digest of those declarations now: a changed token makes the plate stale
 *   colour    its kernel holds no colour literal: every colour comes from the tokens (a mask
 *             stencil's white, #fff, is not a colour)
 *   anchor    every anchor lies on the plate
 *   registry  no page names a plate's image: pages show it with <FigurePlate id>
 *
 * It then writes each plate's sheet (light over dark) to figures-out/<id>.png: read it.
 * --selftest audits scripts/figures/fixtures/plates/ and fails unless each fixture reports
 * exactly the codes its "expect" field lists.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import sharp from 'sharp';

const ROOT = new URL('../../', import.meta.url).pathname;
const args = process.argv.slice(2);
const SELFTEST = args.includes('--selftest');
const SHEET = !args.includes('--no-sheet') && !SELFTEST;
const FIX = join(ROOT, 'scripts/figures/fixtures/plates');
const limits = SELFTEST
  ? JSON.parse(readFileSync(join(FIX, 'limits.json'), 'utf8'))
  : JSON.parse(readFileSync(join(ROOT, 'scripts/figures/thresholds.json'), 'utf8')).plateBudgetKb;
const TOKENS_CSS = SELFTEST ? join(FIX, 'tokens.css') : join(ROOT, 'src/styles/tokens/paper.css');

/** The declarations of the token file's first :root block, raw text by name (as the kernels read them). */
function declarations(css) {
  const start = css.indexOf('{', css.indexOf(':root {'));
  let depth = 0;
  let end = start;
  for (let i = start; i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}') depth--;
    if (depth === 0) {
      end = i;
      break;
    }
  }
  const block = css.slice(start + 1, end).replace(/\/\*[\s\S]*?\*\//g, '');
  return new Map([...block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

function digest(decl, names) {
  const lines = [...new Set(names)].sort().map((n) => `${n}=${decl.get(n)}`);
  return createHash('sha256').update(lines.join('\n')).digest('hex');
}

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function numbers(v, out = []) {
  if (typeof v === 'number') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => numbers(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => numbers(x, out));
  return out;
}

async function audit(file, { publicDir, decl, pages }) {
  const problems = [];
  const say = (code, msg) => problems.push(`${code}  ${msg}`);
  const m = JSON.parse(readFileSync(file, 'utf8'));
  const id = file
    .split('/')
    .pop()
    .replace(/\.json$/, '');
  if (m.schema !== 'plate/1') say('manifest', `schema is ${m.schema}, not plate/1`);
  if (m.id !== id) say('manifest', `id '${m.id}' is not the file name '${id}'`);
  for (const k of ['title', 'alt', 'group', 'style', 'kernel'])
    if (typeof m[k] !== 'string' || !m[k]) say('manifest', `no ${k}`);
  const size = m.anchors?.size;
  if (!Array.isArray(size) || size.length !== 2) say('manifest', 'no anchors.size');
  for (const theme of ['light', 'dark']) {
    for (const k of ['1x', '2x']) {
      const src = m.sources?.[theme]?.[k];
      if (typeof src !== 'string') {
        say('manifest', `no ${theme} ${k} source`);
        continue;
      }
      const path = join(publicDir, src);
      if (!existsSync(path)) {
        say('source', `${theme} ${k}: ${src} is missing`);
        continue;
      }
      const meta = await sharp(path)
        .metadata()
        .catch(() => null);
      const scale = Number(k[0]);
      if (!meta) say('source', `${theme} ${k}: ${src} does not decode`);
      else if (size && (meta.width !== size[0] * scale || meta.height !== size[1] * scale)) {
        say('source', `${theme} ${k}: ${meta.width}x${meta.height}, not ${size[0] * scale}x${size[1] * scale}`);
      }
      const bytes = statSync(path).size;
      if (m.bytes?.[`${theme}-${k}`] !== bytes)
        say('bytes', `${theme} ${k}: manifest says ${m.bytes?.[`${theme}-${k}`]}, file is ${bytes}`);
      if (bytes > limits[k] * 1024) say('budget', `${theme} ${k}: ${Math.round(bytes / 1024)} KB over ${limits[k]} KB`);
    }
  }
  const names = Array.isArray(m.tokens) ? m.tokens : [];
  const missing = names.filter((n) => !decl.has(n));
  if (!names.length) say('palette', 'names no tokens');
  else if (missing.length) say('palette', `tokens not in tokens/paper.css: ${missing.join(', ')}`);
  else if (digest(decl, names) !== m.palette)
    say('palette', 'stale: its tokens changed since it was baked; run its kernel again');
  const kernel = join(ROOT, m.kernel ?? '');
  if (!m.kernel || !existsSync(kernel)) say('colour', `kernel ${m.kernel} not found`);
  else {
    for (const f of walk(kernel).filter((p) => p.endsWith('.py') && !p.includes('/checks/'))) {
      const text = readFileSync(f, 'utf8').replace(/#fff\b/gi, '');
      const hit = text.match(/["'](#[0-9a-fA-F]{3,8})["']|rgba?\(/);
      if (hit) say('colour', `${relative(ROOT, f)}: colour literal ${hit[0]}`);
    }
  }
  if (size) {
    const span = Math.max(...size);
    const off = numbers({ ...m.anchors, size: [] }).filter((n) => n < 0 || n > span);
    if (off.length) say('anchor', `off the plate: ${off.join(', ')}`);
  }
  for (const [page, text] of pages) {
    for (const theme of ['light', 'dark']) {
      for (const src of Object.values(m.sources?.[theme] ?? {}))
        if (text.includes(src)) say('registry', `${page} names ${src}`);
    }
  }
  return { id, m, problems };
}

async function sheet({ id, m }, publicDir) {
  const [w, h] = m.anchors.size;
  const layer = (theme) => sharp(join(publicDir, m.sources[theme]['1x'])).png().toBuffer();
  mkdirSync(join(ROOT, 'figures-out'), { recursive: true });
  await sharp({ create: { width: w, height: h * 2 + 8, channels: 3, background: '#808080' } })
    .composite([
      { input: await layer('light'), top: 0, left: 0 },
      { input: await layer('dark'), top: h + 8, left: 0 },
    ])
    .png()
    .toFile(join(ROOT, 'figures-out', `${id}.png`));
}

const decl = declarations(readFileSync(TOKENS_CSS, 'utf8'));
const dir = SELFTEST ? FIX : join(ROOT, 'src/figures/plates');
const publicDir = SELFTEST ? join(FIX, 'public') : join(ROOT, 'public');
const pageFiles = SELFTEST
  ? [join(dir, 'page.tsx')]
  : walk(join(ROOT, 'src')).filter((f) => /\.(astro|tsx?|css|mdx?)$/.test(f) && !f.includes('/figures/plates/'));
const pages = pageFiles.filter(existsSync).map((f) => [relative(ROOT, f), readFileSync(f, 'utf8')]);
const files = readdirSync(dir)
  .filter((f) => f.endsWith('.json') && f !== 'limits.json')
  .map((f) => join(dir, f));
let failed = false;
for (const file of files) {
  const r = await audit(file, { publicDir, decl, pages });
  if (SELFTEST) {
    const got = [...new Set(r.problems.map((p) => p.split(' ')[0]))].sort().join(',');
    const want = [...(r.m.expect ?? [])].sort().join(',');
    if (got !== want) {
      failed = true;
      console.log(`selftest  ${r.id}: expected [${want}], got [${got}]`);
      r.problems.forEach((p) => console.log(`          ${p}`));
    }
    continue;
  }
  for (const p of r.problems) console.log(`${p}  (${r.id})`);
  if (r.problems.length) failed = true;
  else if (SHEET) await sheet(r, publicDir);
}
if (SELFTEST) console.log(failed ? 'plates selftest FAILED' : `plates selftest: ${files.length} fixtures caught`);
else
  console.log(failed ? 'plates: problems above' : `plates: ${files.length} baked figures pass; sheets in figures-out/`);
process.exit(failed ? 1 : 0);
