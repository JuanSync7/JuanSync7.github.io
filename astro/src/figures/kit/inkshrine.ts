import type { Pt } from './brush';
import { hall, pagoda, terrace } from './inkbuild';
import { pine } from './inkflora';
import type { InkWorld } from './inkland';
import { Ink, type Mark } from './inkpath';
import type { Noise2 } from './noise';
import { between, type Rng } from './rng';

/** Where a temple or pagoda stands in an ink landscape: on a terrace cut into a mountain face
 *  under its ridge, at the mountain's foot by the water, or on the near bank. Wherever it is,
 *  it stands on built ground (a terrace with a stair) with a pine or two beside it. */

interface Plan {
  tower: boolean;
  s: number;
  tiers: number;
  tall: number;
  half: number;
}

/** Decides the building and measures it; `scale` grows it as it comes nearer. */
function plan(noise: Noise2, rng: Rng, w: InkWorld, scale: number): Plan {
  const tower = rng() < w.odds.pagoda;
  const s = (tower ? between(rng, 0.045, 0.06) : between(rng, 0.09, 0.12)) * w.u * scale;
  const tiers = tower ? 5 + Math.floor(rng() * 3) : rng() < 0.5 ? 1 : 2;
  const tall = (tower ? pagoda : hall)(new Ink(noise), 0, 0, s, tiers);
  return { tower, s, tiers, tall, half: s * (tower ? 0.8 : 1) };
}

function raise(noise: Noise2, rng: Rng, w: InkWorld, p: Plan, x: number, foot: number, scale: number): Mark {
  const b = new Ink(noise);
  terrace(b, rng, x, foot, p.half * (1.6 - scale * 0.15), w.u);
  (p.tower ? pagoda : hall)(b, x, foot, p.s, p.tiers);
  for (const sd of [-1, 1])
    if (rng() < 0.7)
      pine(b, rng, x + sd * p.half * between(rng, 1.15, 1.5), foot, between(rng, 0.02, 0.04) * w.u * scale);
  return b.done(p.tower ? 'pagoda' : 'temple', 0.65, x, foot - p.tall / 2, Math.max(p.half, p.tall) * 0.7);
}

/** A temple for a mountain whose ridge is `top` and foot is `base`, or null when none fits.
 *  On the face, the whole building sits below the lowest point of the ridge above it, so the
 *  mountain rises behind its roof, and of a few spots tried the highest that fits wins, which
 *  tucks it under a peak or a saddle. At the foot it stands just above the water. */
export function mountainTemple(noise: Noise2, rng: Rng, w: InkWorld, top: readonly Pt[], base: number): Mark | null {
  const p = plan(noise, rng, w, 1);
  const at = (): Pt => top[Math.floor(between(rng, 0.15, 0.85) * top.length)] ?? [0, 0];
  if (rng() < 0.35) return raise(noise, rng, w, p, at()[0], base - between(rng, 0.006, 0.02) * w.u, 1);
  let best: Pt | null = null;
  for (let tries = 0; tries < 8; tries++) {
    const q = at();
    const low = top.filter((r) => Math.abs(r[0] - q[0]) < p.half * 1.2).reduce((m, r) => Math.max(m, r[1]), q[1]);
    const foot = low + p.tall + 0.02 * w.u;
    if (foot < base - 0.07 * w.u && (!best || foot < best[1])) best = [q[0], foot];
  }
  return best ? raise(noise, rng, w, p, best[0], best[1] + between(rng, 0, 0.03) * w.u, 1) : null;
}

/** A temple on the near bank, drawn larger because it is nearer. */
export function bankTemple(noise: Noise2, rng: Rng, w: InkWorld, x: number, y: number): Mark {
  const scale = between(rng, 1.3, 1.6);
  return raise(noise, rng, w, plan(noise, rng, w, scale), x, y, scale);
}
