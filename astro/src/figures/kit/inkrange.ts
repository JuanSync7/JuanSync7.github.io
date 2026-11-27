import { ridge, type Pt } from './brush';
import { pine, sapling } from './inkflora';
import { chunkRng, type InkWorld } from './inkland';
import { Ink, swell, type Mark } from './inkpath';
import { mountainTemple } from './inkshrine';
import { river } from './inkriver';
import { distant, fog, hatch } from './inkshade';
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

/** One mountain: hides what is behind it, a brushed ridge, its shading (kit/inkshade.ts), and
 *  nearer spurs standing in front of it. Returns the ridge. */
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
  hatch(k, noise, top, L.base, i + L.salt, w.u, folds > 0);
  // Nearer ridges: spurs standing in front of the peak. Each takes a stretch of the ridge's own
  // shape, lowered down the face, with both ends run down to the foot, so it is a hill of its
  // own: it hides the face behind it, has its own brushed outline, and is shaded like the peak.
  for (let f = 1; f <= folds; f++) {
    const a = Math.floor(top.length * (0.1 + 0.3 * (f - 1) + 0.05 * (1 + noise(i + f, 5.5))));
    const part = top.slice(a, a + Math.floor(top.length * (0.3 + 0.075 * (1 + noise(i * 3 + f, 6.6)))));
    const first = part[0];
    if (part.length < 6 || !first) continue;
    const drop = (L.base - first[1]) * (0.25 + 0.15 * f);
    const spur = part.map((p, j): Pt => {
      const v = j / (part.length - 1);
      const y = p[1] + drop + 0.01 * w.u * f;
      return [p[0] + 0.012 * w.u * f, y + (L.base - y) * Math.pow(Math.abs(2 * v - 1), 3)];
    });
    if (spur.some((p) => p[1] > L.base)) continue;
    k.cover([...spur, ...[...spur].reverse().map((p): Pt => [p[0], L.base + 0.02 * w.u])]);
    k.stroke(spur, L.width * 0.8, swell, 0.5, i + f);
    hatch(k, noise, spur, L.base, i * 7 + f, w.u, true);
  }
  return top;
}

/** Far ranges: pale, half-length shading, and the minute marks of distant trees. */
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
    distant(k, noise, range(k, noise, i, L, w, 0), i, w.u);
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
      // A river rises in the lowest saddle of the middle of the ridge, or failing one, on a flank.
      const mid = top.slice(Math.floor(top.length * 0.25), Math.floor(top.length * 0.75));
      const sad = mid.filter(
        (q, j) => j > 2 && j < mid.length - 3 && q[1] >= (mid[j - 3]?.[1] ?? 0) && q[1] >= (mid[j + 3]?.[1] ?? 0),
      );
      const p = sad.reduce<Pt | null>((m, q) => (!m || q[1] > m[1] ? q : m), null) ?? at(0.15, 0.3);
      out.push(river(new Ink(noise), rng, p[0], p[1] + 0.02 * w.u, L.base + 0.004 * w.u, w.u));
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

/** Fog across the far ranges, a strip of its own between them and the near ranges. */
export function fogChunk(w: InkWorld, noise: Noise2, base: number): (i: number) => Mark[] {
  const span = 0.9 * w.u;
  return (i) => {
    const k = new Ink(noise);
    fog(k, chunkRng(base, 5, i), i * span, span, w.water - 0.42 * w.u, w.water - 0.1 * w.u, w.u);
    return [k.done(null, 0.14, 0, 0, 0)];
  };
}
