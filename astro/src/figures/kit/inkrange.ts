import { ridge, type Pt } from './brush';
import { pine, sapling } from './inkflora';
import { chunkRng, type InkWorld } from './inkland';
import { Ink, sample, swell, type Mark } from './inkpath';
import { mountainTemple } from './inkshrine';
import { stream } from './inkwater';
import type { Noise2 } from './noise';
import { between, type Rng } from './rng';

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

/** Forest on a mountain: a few pines on the ridge, then groves of saplings laid along the
 *  contours (the ridge's own shape, lowered down the face) with foliage dots among them,
 *  sparser and smaller toward the foot. Returns the forest's middle, for the pointer. */
function forest(g: Ink, rng: Rng, top: readonly Pt[], base: number, u: number): Pt {
  let [sx, sy, n] = [0, 0, 0];
  for (let j = 1 + Math.floor(rng() * 4); j > 0; j--) {
    const p = top[Math.floor(between(rng, 0.1, 0.9) * top.length)];
    if (p) pine(g, rng, p[0], p[1] + 0.004 * u, between(rng, 0.015, 0.035) * u);
  }
  for (let grove = 3 + Math.floor(rng() * 4); grove > 0; grove--) {
    const j0 = Math.floor(rng() * top.length * 0.85);
    const reach = between(rng, 0.04, 0.6);
    const thick = between(rng, 0.01, 0.035) * u;
    for (let k = 0; k < 5 + rng() * 10; k++) {
      const q = top[j0 + Math.floor(k * 0.7)];
      if (!q) break;
      // Two or three trees per step, stacked down the slope, so a grove is a clump, not a row.
      for (let r = Math.floor(between(rng, 1, 3.5)); r > 0; r--) {
        const y = q[1] + reach * (base - q[1]) + between(rng, -0.4, 1) * thick;
        if (rng() < 0.15 || y > base - 0.012 * u) continue;
        const x = q[0] + between(rng, -0.012, 0.012) * u;
        sapling(g, rng, x, y, between(rng, 0.016, 0.036) * u * (1 - reach * 0.35));
        if (rng() < 0.4) g.dab(x + between(rng, -0.02, 0.02) * u, y + 0.005 * u, 0.007 * u, 0.004 * u, rng());
        [sx, sy, n] = [sx + x, sy + y, n + 1];
      }
    }
  }
  return n ? [sx / n, sy / n] : (top[Math.floor(top.length / 2)] ?? [0, 0]);
}

/** Near ranges: a mountain with, by chance, a stream down a flank, forest on its ridge and
 *  faces, and a temple or pagoda set into the face or standing at its foot. */
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
    const g = new Ink(noise);
    const c = forest(g, rng, top, L.base, w.u);
    out.push(g.done('forest', 0.6, c[0], c[1], 0.08 * w.u));
    // The temple comes after the forest, so it hides the trees behind it and stands in a grove.
    const shrine = rng() < w.odds.temple ? mountainTemple(noise, rng, w, top, L.base) : null;
    if (shrine) out.push(shrine);
    return out;
  };
}
