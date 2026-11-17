// Compares our catalogue pieces with the real LEGO parts they stand for, as a reference only:
// for each shape `ldraw-parts.json` names a part for, the part is read from a local copy of the
// LDraw Parts Library, turned to fit, and measured against our own geometry. It must be the same
// size, carry its studs where our catalogue does, and its top surface (the underside of an
// inverted slope) must lie within TOL of ours. Nothing from the library is written or shipped:
// the site draws only our own geometry (kit/legomesh.ts), so the library's licence never applies
// to the site. Run it when a piece's geometry changes.
//
//   npm run lego:reference -- <ldraw dir>   (the folder holding parts/ and p/)
//   LDDEBUG=kind,w,d,h,hand,number npm run lego:reference -- <dir>   prints one fit's height grids
//
// The library: https://library.ldraw.org, or the GitHub mirror gkjohnson/ldraw-parts-library.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { body } from '../../src/figures/kit/legomesh.ts';
import { cellsOf, partKey, studsOf } from '../../src/figures/kit/legoset.ts';
import { build } from '../../src/figures/kit/legoswap.ts';
import { LEGO_MODELS, LEGO_STANDS } from '../../src/figures/kit/legomodels.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const LIB = process.argv[2];
if (!LIB || !existsSync(join(LIB, 'parts'))) {
  console.error('usage: npm run lego:reference -- <ldraw dir with parts/ and p/>');
  process.exit(2);
}
const TABLE = JSON.parse(readFileSync(join(ROOT, 'scripts/lego/ldraw-parts.json'), 'utf8')).parts;
const LDU = 1 / 20; // one stud is 20 LDraw units; a plate is 8
const PLATE = 0.4;
const UNDER = ['inv45']; // shapes told apart by their underside
const BEYOND = ['bracket', 'hinge', 'wedge']; // shapes with something past their cells, or short of them
const TOL = 0.05; // studs: the mean height difference our piece may show against the real part

// ---- reading LDraw: every triangle of a part, and where its top studs stand -------------------
const files = new Map();
function lines(ref) {
  const r = ref.toLowerCase().replace(/\\/g, '/');
  if (!files.has(r)) {
    const at = ['parts', 'p', 'parts/s'].map((d) => join(LIB, d, r)).find(existsSync);
    if (!at) throw new Error(`LDraw file not found: ${r}`);
    files.set(
      r,
      readFileSync(at, 'utf8')
        .split(/\r?\n/)
        .map((l) => l.trim().split(/\s+/)),
    );
  }
  return files.get(r);
}
const mul = (a, b) => [0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => a[r][0] * b[0][c] + a[r][1] * b[1][c] + a[r][2] * b[2][c] + (c === 3 ? a[r][3] : 0))); // prettier-ignore
const apply = (m, [x, y, z]) => [0, 1, 2].map((r) => m[r][0] * x + m[r][1] * y + m[r][2] * z + m[r][3]);
const det = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]); // prettier-ignore
const I = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0]]; // prettier-ignore

function flatten(ref, m = I, invert = false, out = { tris: [], studs: [] }) {
  let ccw = true;
  let invNext = false;
  for (const s of lines(ref)) {
    if (s[0] === '0' && s[1] === 'BFC') {
      if (s.includes('CW')) ccw = false;
      if (s.includes('CCW')) ccw = true;
      if (s.includes('INVERTNEXT')) invNext = true;
    } else if (s[0] === '1') {
      const v = s.slice(2, 14).map(Number);
      const local = [[v[3], v[4], v[5], v[0]], [v[6], v[7], v[8], v[1]], [v[9], v[10], v[11], v[2]]]; // prettier-ignore
      const child = s.slice(14).join(' ').toLowerCase().replace(/\\/g, '/');
      const w = mul(m, local);
      let inv = invert !== invNext;
      invNext = false;
      const up = apply([[w[0][0], w[0][1], w[0][2], 0], [w[1][0], w[1][1], w[1][2], 0], [w[2][0], w[2][1], w[2][2], 0]], [0, -1, 0]); // prettier-ignore
      if (child === 'stud.dat' && up[1] < -0.9) {
        out.studs.push([w[0][3], w[1][3], w[2][3]]);
        continue;
      }
      if (det(local) < 0) inv = !inv;
      flatten(child, w, inv, out);
    } else if (s[0] === '3' || s[0] === '4') {
      const n = Number(s[0]);
      const pts = [0, 1, 2, 3].slice(0, n).map((k) => apply(m, s.slice(2 + 3 * k, 5 + 3 * k).map(Number)));
      const flip = !ccw !== invert;
      for (const t of n === 3 ? [[0, 1, 2]] : [[0, 1, 2], [0, 2, 3]]) out.tris.push((flip ? [...t].reverse() : t).map((k) => pts[k])); // prettier-ignore
    }
  }
  return out;
}

// ---- fitting a part to its catalogue shape --------------------------------------------------
/** LDraw to our frame (studs, y up), turned k quarter turns: a reflection, so windings reverse. */
const toOurs = ([x, y, z], k) => {
  const [a, b] = [[x, z], [-z, x], [-x, -z], [z, -x]][k]; // prettier-ignore
  return [a * LDU, -y * LDU, b * LDU];
};
const boundsOf = (pts) => [0, 1, 2].map((c) => [Math.min(...pts.map((p) => p[c])), Math.max(...pts.map((p) => p[c]))]);
/** Heights where a vertical line at (x, z) meets the triangles: [lowest, highest] or null. */
function hits(tris, x, z) {
  let lo = Infinity;
  let hi = -Infinity;
  for (const [a, b, c] of tris) {
    const d = (b[2] - c[2]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[2] - c[2]);
    if (Math.abs(d) < 1e-9) continue;
    const l1 = ((b[2] - c[2]) * (x - c[0]) + (c[0] - b[0]) * (z - c[2])) / d;
    const l2 = ((c[2] - a[2]) * (x - c[0]) + (a[0] - c[0]) * (z - c[2])) / d;
    const l3 = 1 - l1 - l2;
    if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) continue;
    const y = l1 * a[1] + l2 * b[1] + l3 * c[1];
    lo = Math.min(lo, y);
    hi = Math.max(hi, y);
  }
  return lo === Infinity ? null : [lo, hi];
}
/** Which way round a part (a) sits best on its catalogue shape (b): the mean height difference,
 *  in studs, over a 4 x 4 grid of samples per stud where the part has material (the full height where the
 *  shape has none). Holes the hand-made shape lacks cost nothing. This picks the turn. */
function mismatch(
  a,
  b,
  p,
  area = [
    [0, p.w],
    [0, p.d],
  ],
  top = p.h * PLATE,
) {
  // Under a stud the body's top is the stud's own business (a hollow stud is a hole): skip it.
  const studs = studsOf({ ...p, x: 0, y: 0, z: 0, rot: 0 }).at;
  const underStud = (x, z) => studs.some(([i, j]) => Math.hypot(x - i - 0.5, z - j - 0.5) < 0.32);
  let sum = 0;
  let n = 0;
  for (const [x, z] of samples(area)) {
    if (!UNDER.includes(p.kind) && underStud(x, z)) continue;
    const [ha, hb] = [hits(a, x, z), hits(b, x, z)];
    if (!ha) continue;
    n++;
    if (!hb) sum += top;
    else if (!UNDER.includes(p.kind)) sum += Math.abs(Math.min(ha[1], top) - Math.min(hb[1], top));
    else if (hb[0] > 0.01) sum += Math.abs(ha[0] - hb[0]);
    // Where our underside sits flat on the base, the real part's hollow there does not count.
    else n--;
  }
  return n ? sum / n : Infinity;
}
/** Sample points, four to a stud each way, over [[x0, x1], [z0, z1]] (whole studs). */
function samples([[x0, x1], [z0, z1]]) {
  const out = [];
  for (let x = Math.floor(x0 * 4) / 4 + 0.125; x < x1; x += 0.25)
    for (let z = Math.floor(z0 * 4) / 4 + 0.125; z < z1; z += 0.25) out.push([x, z]);
  return out;
}
/** Samples where the part has material outside the cells the catalogue gives its shape: there it
 *  could cut into a neighbour the checks believe is clear. A stud may rise above its own cell. */
function outside(
  tris,
  p,
  area = [
    [0, p.w],
    [0, p.d],
  ],
) {
  const cells = new Set(cellsOf({ ...p, x: 0, y: 0, z: 0, rot: 0 }));
  const studs = new Set(studsOf({ ...p, x: 0, y: 0, z: 0, rot: 0 }).at.map(([x, z]) => `${x},${z}`));
  const bad = [];
  for (const [x, z] of samples(area)) {
    const h = hits(tris, x, z);
    if (!h) continue;
    const [cx, cz] = [Math.floor(x), Math.floor(z)];
    let plates = 0;
    while (cells.has(`${cx},${plates},${cz}`)) plates++;
    const room = plates * PLATE + (studs.has(`${cx},${cz}`) ? 0.21 : 0) + 0.02;
    if (plates === 0 || h[1] > room || h[0] < -0.02) bad.push(`(${x}, ${z})`);
  }
  return bad;
}
const trisOf = (geo) => {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const a = g.attributes.position.array;
  const t = [];
  for (let k = 0; k < a.length; k += 9) t.push([0, 3, 6].map((o) => [a[k + o], a[k + o + 1], a[k + o + 2]]));
  return t;
};

/** A wheel or an axle turns, so only its size is compared: diameter, width or length, each within
 *  0.1 of a stud (a wheel's real width sits in its slot of whole studs). */
function roundFit(p, number) {
  const raw = flatten(`${number}.dat`);
  const ob = boundsOf(
    body(p, { studs: false, gap: 0 })
      .flatMap((q) => trisOf(q.geo))
      .flat(),
  );
  const ext = (b) => b.map(([lo, hi]) => hi - lo);
  const ours = ext(ob);
  for (let k = 0; k < 4; k++) {
    const real = ext(boundsOf(raw.tris.flat().map((v) => toOurs(v, k))));
    const off = Math.max(...real.map((v, c) => Math.abs(v - ours[c])));
    if (off <= 0.1) return { score: off };
  }
  const real = ext(boundsOf(raw.tris.flat().map((v) => toOurs(v, 0))));
  return { error: `${number} is ${real.map((v) => v.toFixed(2)).join(' x ')}, the shape ${ours.map((v) => v.toFixed(2)).join(' x ')}` }; // prettier-ignore
}

function fit(p, number) {
  if (p.kind === 'wheel' || p.kind === 'axle') return roundFit(p, number);
  const raw = flatten(`${number}.dat`);
  const ours = body(p, { studs: false, gap: 0 }).flatMap((q) => trisOf(q.geo));
  const want = new Set(studsOf({ ...p, x: 0, y: 0, z: 0, rot: 0 }).at.map(([x, z]) => `${x},${z}`));
  // The real part is laid where our own body lies (a bracket's flange stands in front of its base
  // cells, a hinge's knuckle beyond them), and must be the same size.
  const ob = boundsOf(ours.flat());
  const area = BEYOND.includes(p.kind)
    ? [ob[0], ob[2]]
    : [
        [0, p.w],
        [0, p.d],
      ];
  let best = null;
  for (let k = 0; k < 4; k++) {
    let tris = raw.tris.map((t) => t.map((v) => toOurs(v, k)).reverse());
    const b = boundsOf(tris.flat());
    const [x0, z0] = [area[0][0], area[1][0]];
    const shift = [x0 - b[0][0], -b[1][0], z0 - b[2][0]];
    tris = tris.map((t) => t.map((v) => v.map((c, i) => c + shift[i])));
    // A part's own extent, or its footprint where nothing of it reaches past the cells.
    const want = (c) => (BEYOND.includes(p.kind) ? ob[c][1] - ob[c][0] : c === 0 ? p.w : p.d);
    const size = (c) => Math.abs(b[c][1] - b[c][0] - want(c)) > 0.05;
    if (size(0) || size(2)) continue;
    // A stud between cells (a jumper's, a 2 x 2 dome's crown) is the piece's own: drawn, not joined.
    const between = (v) => Math.abs(v - Math.round(v)) < 0.1;
    const at = raw.studs.map((v) => toOurs(v, k)).map(([x, , z]) => [x + shift[0], z + shift[2]]);
    const studs = at.filter(([x, z]) => !between(x) || !between(z)).map(([x, z]) => `${Math.round(x - 0.5)},${Math.round(z - 0.5)}`); // prettier-ignore
    const score = mismatch(tris, ours, p, area, ob[1][1]);
    if (!best || score < best.score) best = { k, tris, studs, score, height: b[1][1] - b[1][0] };
  }
  if (!best)
    return {
      error: `${number} is not ${(ob[0][1] - ob[0][0]).toFixed(2)} x ${(ob[2][1] - ob[2][0]).toFixed(2)} studs`,
    };
  if (best.score > TOL) return { error: `${number} is not this shape (mean height off by ${best.score.toFixed(3)})` };
  const out = outside(best.tris, p, area);
  if (out.length)
    return {
      error: `${number} reaches outside the shape's cells at ${out.slice(0, 4).join(' ')}${out.length > 4 ? ` and ${out.length - 4} more` : ''}`,
    };
  // Studs: the plain ones were taken off (drawn shared, and hidden once covered); a hollow stud
  // stays in the part, where its top rises above the shape. Together they are the shape's studs.
  const top = ob[1][1];
  const own = [...want].filter((c) => {
    const [x, z] = c.split(',').map(Number);
    const h = hits(best.tris, x + 0.5 + 0.22, z + 0.5);
    return h && h[1] > top + 0.1;
  });
  const got = [...best.studs, ...own];
  if (got.length !== want.size || !got.every((c) => want.has(c)))
    return { error: `${number} has studs at ${got.join(' ')}, the shape at ${[...want].join(' ')}` };
  if (Math.abs(best.height - top - (own.length ? 0.2 : 0)) > 0.05)
    return { error: `${number} is ${best.height.toFixed(2)} high, the shape ${top}` };
  return best;
}

if (process.env.LDDEBUG) {
  const [kind, w, d, h, hand, number] = process.env.LDDEBUG.split(',');
  const p = { kind, w: +w, d: +d, h: +h, hand: hand || undefined, x: 0, y: 0, z: 0, rot: 0, tone: 'ink' };
  const raw = flatten(`${number}.dat`);
  const ours = body(p, { studs: false, gap: 0 }).flatMap((q) => trisOf(q.geo));
  const at = (t, i, j) => hits(t, (i + 0.5) / 4, (j + 0.5) / 4);
  const grid = (t, f) => [...Array(p.d * 4)].map((_, j) => [...Array(p.w * 4)].map((_, i) => { const r = at(t, i, j); return r ? f(r).toFixed(2).padStart(5) : '    -'; }).join(' ')).join('\n'); // prettier-ignore
  console.log(`ours top\n${grid(ours, (r) => r[1])}\nours bottom\n${grid(ours, (r) => r[0])}`);
  for (let k = 0; k < 4; k++) {
    let tris = raw.tris.map((t) => t.map((v) => toOurs(v, k)).reverse());
    const b = boundsOf(tris.flat());
    tris = tris.map((t) => t.map((v) => [v[0] - b[0][0], v[1] - b[1][0], v[2] - b[2][0]]));
    console.log(`turn ${k} off ${mismatch(tris, ours, p).toFixed(3)}\n${grid(tris, (r) => r[1])}\n--bottom\n${grid(tris, (r) => r[0])}`); // prettier-ignore
  }
  process.exit(0);
}

const shapeKey = partKey;
const seen = new Set();
const unmatched = new Map();
let failed = 0;
let compared = 0;
const stands = Object.entries(LEGO_STANDS).map(([id, s]) => [`${id} stand`, s]);
for (const [model, shapes] of [...Object.entries(LEGO_MODELS), ...stands]) {
  for (const p of build(shapes)) {
    const id = shapeKey(p);
    if (seen.has(id)) continue;
    seen.add(id);
    const number = TABLE[shapeKey(p)];
    if (!number) {
      unmatched.set(shapeKey(p), [...(unmatched.get(shapeKey(p)) ?? []), model]);
      continue;
    }
    compared++;
    const f = fit(p, number);
    if (f.error) {
      console.log(`FAIL  ${shapeKey(p).padEnd(20)} ${number.padEnd(6)} (${model}): ${f.error}`);
      failed++;
    } else console.log(`ok    ${shapeKey(p).padEnd(20)} ${number.padEnd(6)} off ${f.score.toFixed(3)}`);
  }
}
console.log(`\n${compared - failed} of ${compared} shapes match their real part`);
console.log(`no real part named: ${[...unmatched].map(([k, m]) => `${k} (${[...new Set(m)].join(', ')})`).join('; ')}`);
process.exit(failed ? 1 : 0);
