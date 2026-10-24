import type { Vec3 } from './camera';
import { beam, cone, cuboid, diamond, frustum, loft, ring, type Tris } from './bodies';

/** Solid shapes for the parts that were wire only, in the part's own frame like
 *  `kit/bodies.ts`: trees and bushes as faceted crowns on trunks, rock and mineral nodes,
 *  lattice towers as tapered posts, and machines built from blocks and beams. Each follows
 *  its wire outline (`kit/shells.ts`, `kit/rigs.ts`, `kit/plant.ts`), so it reads as the same
 *  thing, now hiding what stands behind it. */

const TAU = Math.PI * 2;
type Shape = (o: Tris, w: number, d: number, h: number) => void;
const trunk = (o: Tris, w: number, h: number): void => frustum(o, 4, w * 0.07, w * 0.07, 0, w * 0.05, w * 0.05, h);

/** A tapered square tower, its corners where the wire lattice puts its legs. */
const tower = (o: Tris, w: number, d: number, h: number, top: number): void =>
  frustum(o, 4, w / 2, d / 2, 0, (w / 2) * top, (d / 2) * top, h);

/** How far each of a boulder's seven sides stands out: a fixed lumpiness, turned with it. */
const LUMP = [1, 0.8, 0.95, 0.72, 0.9, 0.84, 0.7];
const lumpy = (r: Vec3[], cx = 0, cz = 0): Vec3[] =>
  r.map(([x, y, z], i): Vec3 => [cx + x * (LUMP[i % 7] ?? 1), y, cz + z * (LUMP[(i + 3) % 7] ?? 1)]);

export const SHAPES: Record<string, Shape> = {
  // A boulder: widest a third of the way up, its top worn flat and off-centre. Rocks piled
  // on rocks run together into one mass of stone.
  rock: (o, w, d, h) =>
    loft(o, [
      lumpy(ring(7, w * 0.42, d * 0.42, 0)),
      lumpy(ring(7, w * 0.5, d * 0.5, h * 0.3, 0.4)),
      lumpy(ring(7, w * 0.36, d * 0.34, h * 0.72, 0.9), w * 0.06, -d * 0.04),
      lumpy(ring(7, w * 0.14, d * 0.12, h, 1.3), w * 0.12, -d * 0.1),
    ]),
  tree: (o, w, d, h) => {
    trunk(o, w, h * 0.4);
    diamond(o, 6, w / 2, d / 2, h * 0.32, h * 0.6, h * 0.95);
  },
  pine: (o, w, d, h) => {
    trunk(o, w, h * 0.2);
    cone(o, 7, w / 2, d / 2, h * 0.12, h * 0.7);
    cone(o, 7, w * 0.36, d * 0.36, h * 0.45, h);
  },
  birch: (o, w, d, h) => {
    trunk(o, w * 0.8, h * 0.55);
    diamond(o, 5, w * 0.32, d * 0.32, h * 0.42, h * 0.7, h);
  },
  cypress: (o, w, d, h) => {
    trunk(o, w, h * 0.15);
    cone(o, 6, w * 0.4, d * 0.4, h * 0.1, h * 0.65);
    cone(o, 6, w * 0.3, d * 0.3, h * 0.5, h);
  },
  oak: (o, w, d, h) => {
    trunk(o, w, h * 0.42);
    loft(o, [
      ring(7, w * 0.22, d * 0.22, h * 0.32),
      ring(7, w * 0.4, d * 0.4, h * 0.42, 0.3),
      ring(7, w * 0.5, d * 0.5, h * 0.66),
      ring(7, w * 0.3, d * 0.3, h * 0.95, 0.3),
    ]);
  },
  bush: (o, w, d, h) =>
    loft(o, [ring(7, w * 0.4, d * 0.4, 0), ring(7, w * 0.5, d * 0.5, h * 0.35, 0.4), ring(7, w * 0.3, d * 0.3, h)]),
  // A mineral node: a low outcrop of rock with hexagonal crystal shafts growing out of it,
  // their roots lost in the stone, so the shafts never cross in the open.
  crystal: (o, w, d, h) => {
    loft(o, [
      ring(7, w * 0.55, d * 0.55, 0, 0.2),
      ring(7, w * 0.48, d * 0.45, h * 0.12, 0.6),
      ring(7, w * 0.25, d * 0.28, h * 0.24, 1.1),
    ]);
    const shafts: [number, number, number][] = [
      [0, 0, 1],
      [0.5, 0.3, 0.7],
      [-0.4, 0.5, 0.6],
      [0.2, -0.5, 0.55],
      [-0.5, -0.3, 0.45],
    ];
    for (const [tx, tz, f] of shafts) {
      const [ex, ey, ez] = [tx * w * 0.5, f * h * 0.82, tz * d * 0.5];
      const s = w * 0.11;
      const at = (t: number, y: number): Vec3[] => ring(6, s, s, y, 0.2, t * ex, t * ez);
      loft(o, [at(0.15, h * 0.08), at(1, ey)], false);
      cone(o, 6, s, s, ey, ey + f * h * 0.18, ex, ez, 0.2);
    }
  },
  pylon: (o, w, d, h) => {
    tower(o, w * 0.6, d * 0.6, h, 0.35);
    for (const f of [0.8, 1]) beam(o, [-w * 0.9, f * h, 0], [w * 0.9, f * h, 0], Math.max(0.004, h * 0.05));
  },
  headframe: (o, w, d, h) => {
    tower(o, w, d, h, 0.4);
    const r = w * 0.32;
    loft(
      o,
      [ring(12, r, r, -0.006, 0), ring(12, r, r, 0.006, 0)].map((q) => q.map(([x, y, z]): Vec3 => [x, h + r + z, y])),
    );
  },
  turbine: (o, w, d, h) => {
    frustum(o, 8, w / 2, d / 2, 0, w * 0.18, d * 0.18, h);
    cuboid(o, -0.012, h - 0.008, -0.025, 0.012, h + 0.012, 0.03);
  },
  solar: (o, w, d, h) => {
    const [hw, hd, lo] = [w / 2, d / 2, h * 0.35];
    loft(o, [
      [
        [-hw, lo, hd],
        [hw, lo, hd],
        [hw, h, -hd],
        [-hw, h, -hd],
      ],
      [
        [-hw, lo - 0.006, hd],
        [hw, lo - 0.006, hd],
        [hw, h - 0.006, -hd],
        [-hw, h - 0.006, -hd],
      ],
    ]);
    for (const x of [-hw * 0.8, hw * 0.8]) {
      beam(o, [x, 0, hd * 0.8], [x, lo, hd * 0.8], 0.006);
      beam(o, [x, 0, -hd * 0.8], [x, h * 0.9, -hd * 0.8], 0.006);
    }
  },
  gantry: (o, w, d, h) => {
    const t = Math.max(0.006, w * 0.25);
    for (const s of [-1, 1]) beam(o, [0, 0, (s * d) / 2], [0, h, (s * d) / 2], t);
    beam(o, [0, h, -d / 2 - t / 2], [0, h, d / 2 + t / 2], t);
    beam(o, [0, h, 0], [w / 2, h * 0.6, 0.02], t * 0.7);
    beam(o, [w / 2, h * 0.6, 0.02], [w * 0.2, h * 0.3, 0], t * 0.6);
  },
  crane: (o, w, d, h) => {
    const t = Math.max(0.006, h * 0.06);
    for (const x of [-w / 2, w / 2]) for (const z of [-d / 2, d / 2]) beam(o, [x, 0, z], [x, h, 0], t);
    for (const z of [-0.04, 0.04]) beam(o, [-w * 0.58, h, z * d], [w * 0.58, h, z * d], t);
    cuboid(o, w * 0.07, h, -d * 0.06, w * 0.18, h * 1.08, d * 0.06);
    beam(o, [w * 0.125, h, 0], [w * 0.125, h * 0.35, 0], t * 0.3);
  },
  hopper: (o, w, d, h) => {
    loft(o, [ring(4, w * 0.18, d * 0.18, h * 0.45, Math.PI / 4), ring(4, w * 0.71, d * 0.71, h, Math.PI / 4)]);
    for (const [x, z] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ] as const)
      beam(o, [x * w * 0.3, 0, z * d * 0.3], [x * w * 0.3, h * 0.5, z * d * 0.3], Math.max(0.005, w * 0.06));
    beam(o, [0, h * 0.45, 0], [w * 0.2, h * 0.2, 0], w * 0.08);
  },
  excavator: (o, w, d, h) => {
    const [hw, hd] = [w / 2, d / 2];
    for (const s of [-1, 1])
      cuboid(o, -hw * 0.75, 0, s > 0 ? hd * 0.55 : -hd, hw * 0.55, h * 0.16, s > 0 ? hd : -hd * 0.55);
    cuboid(o, -hw * 0.8, h * 0.16, -hd * 0.6, hw * 0.25, h * 0.48, hd * 0.6);
    cuboid(o, hw * 0.05, h * 0.48, -hd * 0.6, hw * 0.3, h * 0.66, -hd * 0.1);
    const t = Math.max(0.006, h * 0.1);
    beam(o, [hw * 0.2, h * 0.4, 0], [hw * 0.95, h, 0], t);
    beam(o, [hw * 0.95, h, 0], [hw * 0.75, h * 0.35, 0], t * 0.8);
    cuboid(o, hw * 0.62, h * 0.12, -hd * 0.25, hw, h * 0.36, hd * 0.25);
  },
  drill: (o, w, d, h) => {
    cuboid(o, -w / 2, 0, -d / 2, w / 2, h * 0.1, d / 2);
    cuboid(o, w * 0.175, h * 0.1, -d * 0.45, w * 0.475, h * 0.22, -d * 0.1);
    frustum(o, 4, w * 0.2, d * 0.2, h * 0.1, w * 0.09, d * 0.09, h * 0.98);
    cuboid(o, -w * 0.08, h * 0.96, -d * 0.08, w * 0.08, h, d * 0.08);
  },
  kiln: (o, w, d, h) => {
    const [hw, r] = [w / 2, Math.min(d / 2, h * 0.4)];
    const y = (x: number): number => h - r - (x + hw) * 0.08;
    loft(
      o,
      [-hw, hw].map((x) =>
        Array.from(
          { length: 10 },
          (_, k): Vec3 => [x, y(x) + Math.sin((k / 10) * TAU) * r, Math.cos((k / 10) * TAU) * r],
        ),
      ),
    );
    for (const f of [-0.6, 0, 0.6]) cuboid(o, f * hw - 0.01, 0, -r * 0.6, f * hw + 0.01, y(f * hw) - r, r * 0.6);
  },
  flare: (o, w, d, h) => {
    frustum(o, 6, w * 0.125, d * 0.125, 0, w * 0.125, d * 0.125, h);
    cone(o, 5, w * 0.1, d * 0.1, h, h + w * 0.6);
  },
  park: (o, w, d) => cuboid(o, -w / 2, 0, -d / 2, w / 2, 0.003, d / 2),
  lake: (o, w, d) => loft(o, [ring(20, w / 2, d / 2, -0.001), ring(20, w / 2, d / 2, 0.002)]),
};

/** Kinds whose wire outline would not lie on their solid: drawn by their folds alone. */
export const OWN_LINES = new Set([
  ...['tree', 'pine', 'birch', 'cypress', 'oak', 'bush', 'crystal', 'gantry', 'crane', 'hopper', 'excavator'],
  ...['drill', 'turbine', 'park', 'lake', 'rock'],
]);
/** How much light a kind's faces take: water stays dark, grass a little lighter. */
export const DIM: Record<string, number> = { lake: 0.22, park: 0.5 };
