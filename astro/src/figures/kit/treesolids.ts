import type { Tris } from './bodies';

/** Trees and bushes for the hidden-line district (`kit/districtsketch.ts`), built from profile
 *  vertices turned round the trunk. The boards' trees are faceted diamonds and cones, which in a
 *  line drawing show every facet as an edge and read as crystals on sticks. These are smooth:
 *  sixteen segments round, 22.5° apart, under the drawing kernel's 24° crease, so a crown is drawn
 *  by its silhouette and by the few places its profile breaks (a pine's tiers, the crown's
 *  underside), as a draughtsman draws a tree. Each kind has its own profile; a crown leans and
 *  swells by a phase taken from where the tree stands, so a stand of them is not a row of copies.
 *  All in the part's own frame: centred, ground at y = 0, w across, h tall. */

type Shape = (o: Tris, w: number, d: number, h: number) => void;
/** Segments round: under the 24° crease, so round surfaces show no facets. */
const ROUND = 16;
const TAU = Math.PI * 2;

/** A solid of revolution through profile points [radius, height], bottom to top, stretched to
 *  rx × rz, with its axis leaning by (lx, lz) per unit of height. Ends at radius 0 close it. */
function lathe(o: Tris, profile: [number, number][], rx: number, rz: number, lx = 0, lz = 0): void {
  const at = (r: number, y: number, a: number): [number, number, number] => [
    Math.cos(a) * r * rx + lx * y,
    y,
    Math.sin(a) * r * rz + lz * y,
  ];
  for (let k = 0; k + 1 < profile.length; k++) {
    const [[r0 = 0, y0 = 0] = [], [r1 = 0, y1 = 0] = []] = [profile[k], profile[k + 1]];
    for (let i = 0; i < ROUND; i++) {
      const [a, b] = [(i / ROUND) * TAU, ((i + 1) / ROUND) * TAU];
      const [p, q, r, s] = [at(r0, y0, a), at(r0, y0, b), at(r1, y1, b), at(r1, y1, a)];
      if (r0 > 0) o.push(...p, ...q, ...r);
      if (r1 > 0) o.push(...p, ...r, ...s);
    }
  }
}

/** A trunk from the ground to `top`, `r` across at its foot. */
const trunk = (o: Tris, r: number, top: number): void =>
  lathe(
    o,
    [
      [0, 0],
      [r, 0],
      [r * 0.7, top],
      [0, top],
    ],
    1,
    1,
  );

/** A crown's lean and swell for a tree, fixed by its size so neighbours differ. */
const habit = (w: number, h: number): { lx: number; lz: number; swell: number } => {
  const p = (Math.abs(Math.sin(w * 913.1 + h * 377.7)) * 1e4) % 1;
  return { lx: (p - 0.5) * 0.12, lz: (((p * 7.3) % 1) - 0.5) * 0.12, swell: 0.9 + p * 0.2 };
};

/** A rounded crown from y0 to y1, widest at `at` of the way up. */
const crown = (y0: number, y1: number, at: number): [number, number][] => {
  const ym = y0 + (y1 - y0) * at;
  return [
    [0, y0],
    [0.55, y0 + (ym - y0) * 0.25],
    [0.88, y0 + (ym - y0) * 0.7],
    [1, ym],
    [0.9, ym + (y1 - ym) * 0.35],
    [0.62, ym + (y1 - ym) * 0.72],
    [0.3, ym + (y1 - ym) * 0.94],
    [0, y1],
  ];
};

export const TREE_SOLIDS: Record<string, Shape> = {
  // A broadleaf: a short trunk and a round crown a little above half its height.
  tree: (o, w, d, h) => {
    const { lx, lz, swell } = habit(w, h);
    trunk(o, w * 0.07, h * 0.42);
    lathe(o, crown(h * 0.3, h, 0.42), (w / 2) * swell, (d / 2) * swell, lx, lz);
  },
  // An oak: a stout trunk and a broad, low, flattened crown.
  oak: (o, w, d, h) => {
    const { lx, lz, swell } = habit(w, h);
    trunk(o, w * 0.1, h * 0.4);
    lathe(o, crown(h * 0.32, h, 0.35), (w / 2) * 1.05 * swell, (d / 2) * 1.05 * swell, lx, lz);
  },
  // A birch: a slender trunk and a narrow oval crown, high.
  birch: (o, w, d, h) => {
    const { lx, lz } = habit(w, h);
    trunk(o, w * 0.05, h * 0.5);
    lathe(o, crown(h * 0.35, h, 0.5), w * 0.36, d * 0.36, lx, lz);
  },
  // A cypress: a tall flame, widest low down, to a point.
  cypress: (o, w, d, h) => {
    trunk(o, w * 0.06, h * 0.12);
    lathe(
      o,
      [
        [0, h * 0.08],
        [0.8, h * 0.18],
        [1, h * 0.35],
        [0.85, h * 0.6],
        [0.45, h * 0.85],
        [0, h],
      ],
      w * 0.38,
      d * 0.38,
    );
  },
  // A pine: three skirts of needles, each flaring out at its hem, the tiers breaking as creases.
  pine: (o, w, d, h) => {
    trunk(o, w * 0.06, h * 0.2);
    const tiers = [
      [0.14, 0.5, 1],
      [0.38, 0.74, 0.74],
      [0.6, 1, 0.48],
    ] as const;
    for (const [a, b, r] of tiers)
      lathe(
        o,
        [
          [0, h * a],
          [r, h * a],
          [r * 0.55, h * (a + (b - a) * 0.45)],
          [0, h * b],
        ],
        (w / 2) * 1,
        (d / 2) * 1,
      );
  },
  // A heap of ore or spoil: a smooth cone, its top rounded off, its foot spread.
  heap: (o, w, d, h) =>
    lathe(
      o,
      [
        [0, 0],
        [1, 0],
        [0.72, h * 0.3],
        [0.4, h * 0.75],
        [0.18, h * 0.95],
        [0, h],
      ],
      w / 2,
      d / 2,
    ),
  // A bush: a low dome on the ground.
  bush: (o, w, d, h) =>
    lathe(
      o,
      [
        [0, 0],
        [0.85, 0],
        [1, h * 0.35],
        [0.8, h * 0.75],
        [0.4, h * 0.97],
        [0, h],
      ],
      w / 2,
      d / 2,
    ),
};
