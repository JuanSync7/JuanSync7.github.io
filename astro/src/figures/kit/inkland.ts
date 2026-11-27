import type { Pt } from './brush';
import { leafy, pine, reeds, willow } from './inkflora';
import { bonsai, pond, rock } from './inkgarden';
import { Ink, swell, type Mark } from './inkpath';
import { bankTemple } from './inkshrine';
import { boat, ripples, type BoatKind } from './inkwater';
import type { Noise2 } from './noise';
import { between, mulberry32, pick, type Rng } from './rng';

/** An ink landscape that never ends: four strips (far ranges, near ranges, the water, the
 *  near bank) cut into numbered chunks; the two ranges are built in `inkrange.ts`. A chunk is built from its own seeded stream the first
 *  time it scrolls in, so chunk 40 is the same picture whenever it comes round, and nothing
 *  is built until it is needed. */

export type TreeKind = 'pine' | 'leafy' | 'willow';

export interface InkWorld {
  /** The frame's height in pixels: every size below is a share of it. */
  u: number;
  bottom: number;
  /** Where the water starts under the ranges, and where the near bank begins. */
  water: number;
  shore: number;
  /** Height and sharpness of the near ranges. */
  rise: number;
  peak: number;
  odds: { temple: number; pagoda: number; stream: number; boat: number; bonsai: number; pond: number };
  trees: readonly TreeKind[];
  boats: readonly BoatKind[];
}

/** One strip: chunks `span` px wide, built on demand and dropped once far behind. */
export class Strip {
  private readonly cache = new Map<number, Mark[]>();

  constructor(
    readonly span: number,
    /** Share of the scroll this strip moves: far is slow, near is fast. */
    readonly speed: number,
    private readonly build: (i: number) => Mark[],
  ) {}

  /** Marks that can show when the strip has moved `off` px, in draw order. */
  marks(off: number, w: number): Mark[] {
    const first = Math.floor(off / this.span) - 2;
    const last = Math.floor((off + w) / this.span) + 1;
    for (const key of this.cache.keys()) if (key < first - 2) this.cache.delete(key);
    const out: Mark[] = [];
    for (let i = first; i <= last; i++) {
      let got = this.cache.get(i);
      if (!got) {
        got = this.build(i);
        this.cache.set(i, got);
      }
      for (const m of got) if (m.x1 - off > -4 && m.x0 - off < w + 4) out.push(m);
    }
    return out;
  }
}

export const chunkRng = (base: number, salt: number, i: number): Rng =>
  mulberry32(base ^ Math.imul(i + 7919 * salt, 0x9e3779b1));

/** The water: ripples, the far waterline, and now and then a boat. */
export function waterChunk(w: InkWorld, noise: Noise2, base: number): (i: number) => Mark[] {
  const span = w.u;
  return (i) => {
    const rng = chunkRng(base, 3, i);
    const k = new Ink(noise);
    const x0 = i * span;
    ripples(k, rng, x0, x0 + span, w.water + 0.01 * w.u, w.shore, 18, w.u);
    k.stroke(
      [
        [x0, w.water + 0.006 * w.u],
        [x0 + span * 0.6, w.water + 0.006 * w.u],
      ],
      0.003 * w.u,
    );
    const out = [k.done(null, 0.3, 0, 0, 0)];
    if (rng() < w.odds.boat) {
      const d = between(rng, 0.25, 0.85);
      const y = w.water + (w.shore - w.water) * d;
      const x = x0 + between(rng, 0.2, 0.8) * span;
      const s = (0.11 + 0.09 * d) * w.u;
      const b = new Ink(noise);
      const kind = pick(rng, w.boats);
      boat(b, kind, x, y, s);
      out.push(b.done(kind, 0.7, x, y - 0.1 * s, s * 0.7, rng() * 6));
    }
    return out;
  };
}

/** The near bank: its edge and ground, then trees, rocks, a bonsai, a pond or reeds, scattered. */
export function shoreChunk(w: InkWorld, noise: Noise2, base: number): (i: number) => Mark[] {
  const span = 0.9 * w.u;
  const bank = (x: number): number => w.shore + noise(x / w.u, 77) * 0.02 * w.u;
  return (i) => {
    const rng = chunkRng(base, 4, i);
    const x0 = i * span;
    const k = new Ink(noise);
    const edge = Array.from({ length: 13 }, (_, j): Pt => [x0 - 2 + ((span + 4) * j) / 12, bank(x0 + (span * j) / 12)]);
    k.cover([...edge, [x0 + span + 2, w.bottom], [x0 - 2, w.bottom]]);
    k.stroke(edge.slice(0, 8), 0.012 * w.u, swell, 0.5, i);
    k.stroke(edge.slice(9), 0.008 * w.u, swell, 0.5, i + 3);
    const out = [k.done(null, 0.6, 0, 0, 0)];
    // Things land where they land: a random count at random places, not one per slot.
    const xs = Array.from({ length: Math.floor(rng() * 4) }, () => x0 + between(rng, 0.04, 0.96) * span).sort(
      (a, b) => a - b,
    );
    for (const x of xs) {
      const y = bank(x) + 0.008 * w.u;
      const t = new Ink(noise);
      const roll = rng();
      let kind: string;
      let cy = y;
      let r = 0.06 * w.u;
      if (roll < w.odds.temple * 0.06) {
        out.push(bankTemple(noise, rng, w, x, y));
        continue;
      } else if (roll < w.odds.pond) {
        const py = between(rng, y + 0.06 * w.u, w.bottom - 0.035 * w.u);
        pond(t, rng, x, py, between(rng, 0.16, 0.28) * w.u);
        [kind, cy] = ['pond', py];
      } else if (roll < w.odds.pond + w.odds.bonsai) {
        const lift = rock(t, noise, rng, x, y, 0.11 * w.u);
        bonsai(t, rng, x, y - lift + 0.004 * w.u, 0.085 * w.u);
        [kind, cy] = ['bonsai', y - lift - 0.04 * w.u];
      } else if (roll < w.odds.pond + w.odds.bonsai + 0.45) {
        // A grove of one to three, each its own kind, size and lean; now and then one tall tree.
        kind = pick(rng, w.trees);
        let tallest = 0;
        for (let g = 1 + Math.floor(rng() * rng() * 3); g > 0; g--) {
          const s = (rng() < 0.12 ? between(rng, 0.2, 0.28) : between(rng, 0.06, 0.17)) * w.u;
          const gx = x + between(rng, -0.07, 0.07) * w.u;
          const sort = g === 1 ? kind : pick(rng, w.trees);
          (sort === 'pine' ? pine : sort === 'willow' ? willow : leafy)(t, rng, gx, bank(gx) + 0.008 * w.u, s);
          tallest = Math.max(tallest, s);
        }
        [cy, r] = [y - tallest * 0.6, Math.max(tallest * 0.4, 0.05 * w.u)];
      } else if (roll < 0.88) {
        rock(t, noise, rng, x, y, between(rng, 0.06, 0.14) * w.u);
        kind = 'rock';
      } else {
        reeds(t, rng, x, y, between(rng, 0.05, 0.08) * w.u);
        kind = 'reeds';
      }
      out.push(t.done(kind, 0.75, x, cy, r));
    }
    return out;
  };
}
