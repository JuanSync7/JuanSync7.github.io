import { ridge, type Pt } from './brush';
import { hall, pagoda } from './inkbuild';
import { pine } from './inkflora';
import { chunkRng, type InkWorld } from './inkland';
import { Ink, sample, swell, type Mark } from './inkpath';
import { stream } from './inkwater';
import type { Noise2 } from './noise';
import { between } from './rng';

/** The mountain strips of an ink landscape: pale far ranges, and nearer ranges that carry
 *  temples, pagodas, ridge pines and streams. */

interface RangeSpec {
  span: number;
  base: number;
  height: number;
  peak: number;
  width: number;
  salt: number;
}

/** One mountain: hides what is behind it, a brushed ridge, dry strokes under it, and inner
 *  folds that repeat the ridge lower down. Returns the ridge. */
function range(k: Ink, noise: Noise2, i: number, L: RangeSpec, w: InkWorld, folds: number): Pt[] {
  const lift = 0.5 + 0.5 * noise(i * 0.71, L.salt);
  const broad = 0.5 + 0.5 * noise(i * 0.53 + 4.2, L.salt * 0.5);
  const width = L.span * (0.8 + 1.1 * broad);
  const x0 = i * L.span - width * 0.15;
  const peak = L.peak * (0.35 + 0.6 * lift);
  const top = ridge(noise, x0, x0 + width, L.base, L.height * (0.35 + 0.75 * lift), i * 13 + L.salt, w.u * 0.016, peak);
  const head = top[0];
  const tail = top[top.length - 1];
  if (!head || !tail) return top;
  k.cover([[head[0], w.bottom], ...top, [tail[0], w.bottom]]);
  k.stroke(top, L.width, swell, 0.5, i + L.salt);
  // Hemp-fibre cun strokes run down each face, between the ridge's normal and straight down,
  // with gaps where the noise leaves mist; moss dots sit along the nearer ridges.
  const every = folds ? 2 : 4;
  top.forEach((p, j) => {
    const n = noise(j * 0.9 + i, L.salt + 0.5);
    if (j % every || n < -0.25) return;
    const a = top[j - 1] ?? p;
    const b = top[j + 1] ?? p;
    const tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = (-(b[1] - a[1]) / tl) * (b[0] > a[0] ? -1 : 1);
    const len = (L.base - p[1]) * (0.12 + 0.4 * Math.abs(noise(p[0] * 0.05, 7.7)));
    const dx = nx * 0.45;
    const sway = noise(p[0] * 0.03, 2.2) * 0.25;
    k.line(sample(4, (u): Pt => [p[0] + (dx + sway * u) * len * u, p[1] + 2 + len * u * (0.9 - 0.2 * Math.abs(dx))]));
    if (folds && j % 5 === 0 && n > 0)
      k.dab(p[0] + nx * 0.004 * w.u, p[1] + 0.006 * w.u, 0.0045 * w.u, 0.0028 * w.u, n);
  });
  for (let f = 1; f <= folds; f++) {
    const a = Math.floor(top.length * (0.12 + 0.2 * f));
    const part = top.slice(a, a + Math.floor(top.length * 0.35));
    const drop = (L.base - (part[0]?.[1] ?? L.base)) * 0.3 * f;
    k.stroke(
      part.map((p): Pt => [p[0] + 0.01 * w.u * f, p[1] + drop]),
      L.width * 0.6,
      swell,
      0.5,
      i + f,
    );
  }
  return top;
}

/** Far ranges: pale, few strokes, nothing on them. */
export function farChunk(w: InkWorld, noise: Noise2): (i: number) => Mark[] {
  const L = {
    span: 0.75 * w.u,
    base: w.water - 0.02 * w.u,
    height: 0.56 * w.u,
    peak: 0.7,
    width: 0.005 * w.u,
    salt: 31,
  };
  return (i) => {
    const k = new Ink(noise);
    range(k, noise, i, L, w, 0);
    return [k.done(null, 0.24, 0, 0, 0)];
  };
}

/** Near ranges: a mountain with, by chance, a stream down a flank, a temple or pagoda on
 *  the ridge, and pines along it. */
export function midChunk(w: InkWorld, noise: Noise2, base: number): (i: number) => Mark[] {
  const L = {
    span: 0.6 * w.u,
    base: w.water + 0.01 * w.u,
    height: w.rise * w.u,
    peak: w.peak,
    width: 0.008 * w.u,
    salt: 101,
  };
  return (i) => {
    const rng = chunkRng(base, 2, i);
    const k = new Ink(noise);
    const top = range(k, noise, i, L, w, 2);
    const out = [k.done(null, 0.45, 0, 0, 0)];
    const at = (lo: number, hi: number): Pt => top[Math.floor(between(rng, lo, hi) * top.length)] ?? [0, 0];
    if (rng() < w.odds.stream) {
      const p = rng() < 0.5 ? at(0.12, 0.28) : at(0.72, 0.88);
      const s = new Ink(noise);
      stream(s, rng, p[0], p[1] + 0.03 * w.u, L.base + 0.004 * w.u, w.u);
      out.push(s.done('stream', 0.5, p[0], (p[1] + L.base) / 2, (L.base - p[1]) / 2));
    }
    let temple = Infinity;
    if (rng() < w.odds.temple) {
      const p = at(0.3, 0.7);
      const tower = rng() < w.odds.pagoda;
      const s = (tower ? between(rng, 0.06, 0.08) : between(rng, 0.12, 0.16)) * w.u;
      const foot = top.filter((q) => Math.abs(q[0] - p[0]) < s * 0.45).reduce((m, q) => Math.min(m, q[1]), p[1]);
      const b = new Ink(noise);
      const tall = tower
        ? pagoda(b, p[0], foot, s, 5 + Math.floor(rng() * 3))
        : hall(b, p[0], foot, s, rng() < 0.5 ? 1 : 2);
      out.push(b.done(tower ? 'pagoda' : 'temple', 0.65, p[0], foot - tall / 2, Math.max(s, tall) * 0.6));
      temple = p[0];
    }
    const g = new Ink(noise);
    const xs: number[] = [];
    let ys = 0;
    for (let n = 2 + Math.floor(rng() * 4); n > 0; n--) {
      const p = at(0.15, 0.85);
      if (Math.abs(p[0] - temple) < 0.1 * w.u) continue;
      pine(g, rng, p[0], p[1] + 0.004 * w.u, between(rng, 0.035, 0.06) * w.u);
      xs.push(p[0]);
      ys += p[1];
    }
    const mx = xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
    if (xs.length) out.push(g.done('pines', 0.5, mx, ys / Math.max(1, xs.length), 0.06 * w.u));
    return out;
  };
}
