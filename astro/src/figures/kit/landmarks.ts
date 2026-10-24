import type { Vec3 } from './camera';
import { beam, bevelled, cone, cuboid, diamond, frustum, gable, loft, ring, type Tris } from './bodies';
import { BUILDINGS } from './buildings';

/** Landmarks and the tops of tall buildings, as solids in the part's own frame like
 *  `kit/bodies.ts`: a stadium bowl, an observation needle, a Ferris wheel, a gateway arch,
 *  a museum under a dome, the stock exchange's columned front, a glass pyramid, a twisting
 *  tower, zebra crossings, the nuclear plant's turbine hall and vent stack, hills and pits.
 *  These kinds have no hand-drawn wire: their wire is the fold lines of the solid
 *  (`kit/folds.ts`).
 *  `crowned` gives every skyscraper a top of its own. */

const TAU = Math.PI * 2;
type Shape = (o: Tris, w: number, d: number, h: number) => void;

export const LANDMARKS: Record<string, Shape> = {
  ...BUILDINGS,
  // A bowl of tiers stepping down to the pitch, an outer wall, and a roof ring over the seats.
  stadium: (o, w, d, h) => {
    loft(o, [ring(24, w / 2, d / 2, 0), ring(24, w / 2, d / 2, h * 0.8)], false);
    loft(
      o,
      [0.8, 0.62, 0.44, 0.26].map((f, i) => ring(24, w * (0.5 - i * 0.05), d * (0.5 - i * 0.05), h * f)),
      false,
    );
    loft(o, [ring(24, w * 0.32, d * 0.32, h * 0.12), ring(24, w * 0.32, d * 0.32, h * 0.13)]);
    loft(o, [ring(24, w * 0.52, d * 0.52, h), ring(24, w * 0.4, d * 0.4, h * 0.94)], false);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      const at = (r: number, y: number): Vec3 => [Math.cos(a) * w * r, y, Math.sin(a) * d * r];
      beam(o, at(0.5, h * 0.8), at(0.5, h), 0.006);
    }
  },
  // An observation tower: a tapering shaft, the pod with its deck, an antenna.
  needle: (o, w, d, h) => {
    frustum(o, 6, w * 0.3, d * 0.3, 0, w * 0.12, d * 0.12, h * 0.72);
    loft(o, [
      ring(12, w * 0.15, d * 0.15, h * 0.68),
      ring(12, w * 0.5, d * 0.5, h * 0.74),
      ring(12, w * 0.5, d * 0.5, h * 0.78),
      ring(12, w * 0.3, d * 0.3, h * 0.82),
    ]);
    frustum(o, 8, w * 0.06, d * 0.06, h * 0.82, w * 0.02, d * 0.02, h);
  },
  // A Ferris wheel standing across x: its rim, spokes, cabins, and the two A-frame legs.
  wheel: (o, w, d, h) => {
    const [r, cy] = [h * 0.46, h * 0.52];
    const rim = (k: number): Vec3 => [Math.cos((k / 16) * TAU) * r, cy + Math.sin((k / 16) * TAU) * r, 0];
    for (let k = 0; k < 16; k++) {
      beam(o, rim(k), rim(k + 1), Math.max(0.004, h * 0.025));
      if (k % 2 === 0) beam(o, [0, cy, 0], rim(k), Math.max(0.003, h * 0.012));
      const [x, y] = rim(k);
      cuboid(o, x - h * 0.03, y - h * 0.07, -d * 0.18, x + h * 0.03, y - h * 0.02, d * 0.18);
    }
    for (const s of [-1, 1]) for (const z of [-d / 2, d / 2]) beam(o, [s * w * 0.3, 0, z], [0, cy, z * 0.2], h * 0.03);
  },
  // A gateway arch: a parabola of square section, thinning as it rises.
  arch: (o, w, d, h) => {
    const at = (u: number): Vec3 => [u * (w / 2), h * (1 - u * u), 0];
    for (let i = 0; i < 16; i++) {
      const [u0, u1] = [-1 + i / 8, -1 + (i + 1) / 8];
      beam(o, at(u0), at(u1), Math.max(0.006, d * (0.5 - 0.3 * (1 - Math.abs(u0)))));
    }
  },
  // A museum: a stepped podium, a colonnade round the hall, a drum and a dome.
  museum: (o, w, d, h) => {
    for (let k = 0; k < 3; k++)
      cuboid(
        o,
        -w / 2 + k * 0.008,
        k * 0.006,
        -d / 2 + k * 0.008,
        w / 2 - k * 0.008,
        (k + 1) * 0.006,
        d / 2 - k * 0.008,
      );
    bevelled(o, w * 0.78, d * 0.78, h * 0.45, 0.004);
    for (let i = 0; i < 10; i++)
      for (const z of [-d * 0.44, d * 0.44]) {
        const x = -w * 0.44 + (i / 9) * w * 0.88;
        frustum(o, 6, 0.005, 0.005, 0.018, 0.004, 0.004, h * 0.45, x, z);
      }
    cuboid(o, -w * 0.47, h * 0.45, -d * 0.47, w * 0.47, h * 0.5, d * 0.47);
    frustum(o, 16, w * 0.24, w * 0.24, h * 0.5, w * 0.24, w * 0.24, h * 0.62);
    loft(
      o,
      [0, 0.3, 0.6, 0.85, 1].map((f) =>
        ring(
          16,
          w * 0.24 * Math.cos(f * 1.45),
          w * 0.24 * Math.cos(f * 1.45),
          h * 0.62 + Math.sin(f * 1.45) * h * 0.38,
        ),
      ),
    );
  },
  // The stock exchange: a temple front of tall columns under a pediment, on steps.
  bourse: (o, w, d, h) => {
    for (let k = 0; k < 3; k++) cuboid(o, -w / 2, k * 0.005, -d / 2 - 0.015 + k * 0.005, w / 2, (k + 1) * 0.005, d / 2);
    bevelled(o, w * 0.94, d * 0.7, h * 0.8, 0.003);
    for (let i = 0; i < 6; i++)
      frustum(o, 8, 0.006, 0.006, 0.015, 0.005, 0.005, h * 0.8, -w * 0.4 + (i / 5) * w * 0.8, d * 0.44);
    cuboid(o, -w * 0.47, h * 0.8, -d * 0.36, w * 0.47, h * 0.86, d * 0.48);
    gable(o, w * 0.94, d * 0.84, h * 0.86, h * 0.14);
  },
  // A glass pyramid on a low plinth, its panes ruled across each face.
  pyramid: (o, w, d, h) => {
    cuboid(o, -w / 2, 0, -d / 2, w / 2, h * 0.06, d / 2);
    loft(o, [ring(4, w * 0.62, d * 0.62, h * 0.06, Math.PI / 4), ring(4, 0.001, 0.001, h, Math.PI / 4)], false);
  },
  // A twisting tower: slab on slab, each turned a little further, under a crown.
  twist: (o, w, d, h) => {
    const n = 14;
    loft(
      o,
      Array.from({ length: n + 1 }, (_, i) =>
        ring(4, (w / 2) * Math.SQRT2, (d / 2) * Math.SQRT2, (i / n) * h * 0.95, Math.PI / 4 + (i / n) * 1.2),
      ),
    );
    frustum(o, 4, w * 0.2, d * 0.2, h * 0.95, w * 0.05, d * 0.05, h);
  },
  // Zebra stripes across a street, w along the walk, d across the road.
  zebra: (o, w, d) => {
    for (let i = 0; i < 5; i++) {
      const x = -w / 2 + ((i + 0.25) / 5) * w;
      cuboid(o, x, 0, -d / 2, x + w * 0.11, 0.002, d / 2);
    }
  },
  // A turbine hall: a long tall hall, its stepped roof, the generator bay, louvres.
  turbinehall: (o, w, d, h) => {
    bevelled(o, w, d, h * 0.75, 0.004);
    cuboid(o, -w * 0.48, h * 0.75, -d * 0.3, w * 0.48, h, d * 0.3);
    cuboid(o, w * 0.5, 0, -d * 0.3, w * 0.62, h * 0.5, d * 0.3);
    for (let x = -w * 0.4; x < w * 0.4; x += w * 0.1) cuboid(o, x, h, -d * 0.08, x + w * 0.05, h * 1.06, d * 0.08);
  },
  // A vent stack: a slender tapering chimney braced by a lattice frame half its height.
  ventstack: (o, w, d, h) => {
    frustum(o, 10, w * 0.3, d * 0.3, 0, w * 0.2, d * 0.2, h);
    frustum(o, 4, w / 2, d / 2, 0, w * 0.3, d * 0.3, h * 0.55);
  },
  // A hill: a long low mound, flattest on top.
  hill: (o, w, d, h) =>
    loft(o, [
      ring(12, w / 2, d / 2, 0, 0.1),
      ring(12, w * 0.42, d * 0.4, h * 0.45, 0.35),
      ring(12, w * 0.26, d * 0.22, h * 0.85, 0.6),
      ring(12, w * 0.1, d * 0.08, h, 0.9),
    ]),
  // An open pit: benches stepping down inside a rim of spoil.
  pit: (o, w, d, h) => {
    loft(o, [ring(16, w / 2, d / 2, 0), ring(16, w * 0.46, d * 0.46, h), ring(16, w * 0.4, d * 0.4, h * 0.6)], false);
    for (let k = 0; k < 4; k++) {
      const f = 0.4 - k * 0.08;
      loft(
        o,
        [ring(16, w * f, d * f, h * (0.6 - k * 0.15)), ring(16, w * (f - 0.04), d * (f - 0.04), h * (0.6 - k * 0.15))],
        false,
      );
    }
  },
};

/** Whether a part is a tall building that gets a top of its own: its windows stop below it. */
export const tall = (p: { kind: string; h: number; y?: number }): boolean =>
  ['block', 'tower', 'hex', 'tri'].includes(p.kind) && p.h >= 0.2 && !p.y;
/** Its style, fixed by where it stands. */
export const styleOf = (x: number, z: number): number =>
  Math.floor(Math.abs(Math.sin(x * 12.99 + z * 78.23) * 43758.5) % 5);

/** A tall building's top, by style: 0 stepped back to a mast, 1 a pyramid roof and spire,
 *  2 a sloped crown, 3 an open crown frame round a helipad, 4 chamfered with roof plant. The
 *  shaft stops at `at`; the windows (`kit/citylife.ts`) stop there too. */
export function crowned(o: Tris, sides: number, w: number, d: number, h: number, style: number): void {
  const at = h * 0.8;
  const k = sides === 4 ? 1 : 0.9;
  if (sides === 4) bevelled(o, w, d, at, Math.min(0.006, w * 0.1));
  else frustum(o, sides, w / 2, d / 2, 0, w / 2, d / 2, at);
  const s = style % 5;
  // A box's corners sit on a ring a turn of an eighth round, √2 further out.
  const [r, a0] = sides === 4 ? [Math.SQRT2, Math.PI / 4] : [1, 0];
  if (s === 0) {
    frustum(o, sides, w * 0.38 * k, d * 0.38 * k, at, w * 0.38 * k, d * 0.38 * k, h * 0.9);
    frustum(o, sides, w * 0.24 * k, d * 0.24 * k, h * 0.9, w * 0.24 * k, d * 0.24 * k, h * 0.97);
    frustum(o, 6, 0.004, 0.004, h * 0.97, 0.002, 0.002, h * 1.12);
  } else if (s === 1) {
    cone(o, sides, (w / 2) * r, (d / 2) * r, at, h, 0, 0, a0);
    frustum(o, 6, 0.003, 0.003, h, 0.001, 0.001, h * 1.18);
  } else if (s === 2) {
    // The roof slopes up from one face to the other.
    const base = ring(sides, (w / 2) * r, (d / 2) * r, at, a0);
    loft(o, [base, base.map(([x, , z]): Vec3 => [x, at + (h - at) * (0.3 + 0.7 * (x / w + 0.5)), z])]);
  } else if (s === 3) {
    frustum(o, sides, w * 0.42 * k, d * 0.42 * k, at, w * 0.42 * k, d * 0.42 * k, h * 0.86);
    const c = ring(4, w * 0.48, d * 0.48, 0, Math.PI / 4);
    c.forEach(([x, , z], i) => {
      const [nx, , nz] = c[(i + 1) % 4] ?? [x, 0, z];
      beam(o, [x, at, z], [x, h, z], 0.005);
      beam(o, [x, h, z], [nx, h, nz], 0.005);
    });
    loft(o, [ring(12, w * 0.2, d * 0.2, h * 0.86), ring(12, w * 0.2, d * 0.2, h * 0.875)]);
  } else {
    frustum(o, 8, w * 0.5, d * 0.5, at, w * 0.4, d * 0.4, h * 0.88);
    for (const x of [-w * 0.15, w * 0.12])
      cuboid(o, x - w * 0.08, h * 0.88, -d * 0.12, x + w * 0.08, h * 0.95, d * 0.12);
    diamond(o, 4, 0.004, 0.004, h * 0.88, h * 0.9, h * 1.05);
  }
}
