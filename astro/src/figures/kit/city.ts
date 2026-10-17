import type { Rng } from './rng';

/** Cities as parts, for figures that draw districts: what stands where, and the traces
 *  (streets, buses, power straps) painted on the ground under it. Units are world units on a
 *  board about 2.5 wide and 1.5 deep, centred on the origin, ground at y = 0. A part is
 *  drawn by kind: solid blocks with outlines, wireframe apartments, round tanks and towers,
 *  low-poly trees, flat parks. */

export type PartKind =
  | 'cell'
  | 'macro'
  | 'rack'
  | 'wall'
  | 'block'
  | 'apartment'
  | 'tank'
  | 'tower'
  | 'tree'
  | 'pine'
  | 'park';

export interface Part {
  kind: PartKind;
  x: number;
  z: number;
  /** Footprint (a diameter for round kinds) and height. */
  w: number;
  d: number;
  h: number;
}

export interface District {
  parts: Part[];
  /** Ground lines as flat segments: x0, z0, x1, z1. */
  traces: [number, number, number, number][];
}

/** The overcity's street grid: walkers keep to these lines. */
export const STREETS = { x: [-0.95, -0.32, 0.32, 0.95], z: [-0.5, 0, 0.5] } as const;

const BOX: readonly PartKind[] = ['cell', 'macro', 'rack', 'wall', 'block'];
const ROUND: readonly PartKind[] = ['tank', 'tower'];
export const isBox = (k: PartKind): boolean => BOX.includes(k);
export const isRound = (k: PartKind): boolean => ROUND.includes(k);

function trees(rng: Rng, x: number, z: number, w: number, d: number, n: number, out: Part[]): void {
  out.push({ kind: 'park', x, z, w, d, h: 0 });
  for (let i = 0; i < n; i++) {
    const s = 0.05 + rng() * 0.04;
    out.push({
      kind: rng() > 0.5 ? 'tree' : 'pine',
      x: x + (rng() - 0.5) * w * 0.8,
      z: z + (rng() - 0.5) * d * 0.8,
      w: s,
      d: s,
      h: s * (1.4 + rng()),
    });
  }
}

/** Level k of the stack, bottom (silicon) to top (where people live). */
export function district(k: number, rng: Rng): District {
  const r = (a: number, b: number): number => a + rng() * (b - a);
  const parts: Part[] = [];
  const traces: District['traces'] = [];
  const grid = (xs: readonly number[], zs: readonly number[]): void => {
    xs.forEach((x) => traces.push([x, -0.7, x, 0.7]));
    zs.forEach((z) => traces.push([-1.2, z, 1.2, z]));
  };
  if (k === 0) {
    const macros: Part[] = [
      { kind: 'macro', x: 0.72, z: -0.34, w: 0.6, d: 0.36, h: 0.06 },
      { kind: 'macro', x: -0.68, z: 0.36, w: 0.52, d: 0.34, h: 0.06 },
    ];
    const free = (x: number, z: number): boolean =>
      macros.every((m) => Math.abs(x - m.x) > m.w / 2 + 0.03 || Math.abs(z - m.z) > m.d / 2 + 0.03);
    parts.push(...macros);
    for (let z = -0.58; z <= 0.58; z += 0.083) {
      for (let x = -1.08; x < 1.06; ) {
        const w = r(0.04, 0.12);
        if (free(x + w / 2, z)) parts.push({ kind: 'cell', x: x + w / 2, z, w: w * 0.82, d: 0.058, h: r(0.012, 0.03) });
        x += w;
      }
    }
    for (let x = -1.0; x <= 1.0; x += 0.25) traces.push([x, -0.62, x, 0.62]);
    // The die's edge: a power ring inside a ring of I/O pads, and a PLL in one corner.
    traces.push(
      [-1.12, -0.64, 1.12, -0.64],
      [1.12, -0.64, 1.12, 0.64],
      [1.12, 0.64, -1.12, 0.64],
      [-1.12, 0.64, -1.12, -0.64],
    );
    for (let x = -1.1; x <= 1.11; x += 0.11)
      parts.push(
        { kind: 'cell', x, z: -0.7, w: 0.06, d: 0.035, h: 0.04 },
        { kind: 'cell', x, z: 0.7, w: 0.06, d: 0.035, h: 0.04 },
      );
    for (let z = -0.6; z <= 0.61; z += 0.12)
      parts.push(
        { kind: 'cell', x: -1.2, z, w: 0.035, d: 0.06, h: 0.04 },
        { kind: 'cell', x: 1.2, z, w: 0.035, d: 0.06, h: 0.04 },
      );
    parts.push({ kind: 'tank', x: 1.0, z: 0.5, w: 0.12, d: 0.12, h: 0.05 });
  } else if (k === 1) {
    for (let z = -0.56; z <= 0.57; z += 0.28)
      for (let x = -1.05; x <= 0.5; x += 0.15)
        if (rng() > 0.1) parts.push({ kind: 'rack', x, z, w: 0.1, d: 0.16, h: r(0.12, 0.22) });
    for (const z of [-0.45, 0, 0.45])
      parts.push(
        { kind: 'tank', x: 0.95, z, w: 0.22, d: 0.22, h: r(0.16, 0.24) },
        { kind: 'tank', x: 0.7, z: z + 0.1, w: 0.12, d: 0.12, h: 0.1 },
      );
    // Cable trays between the rack rows, feeding a substation of transformers by the tanks.
    for (let z = -0.42; z <= 0.43; z += 0.28) traces.push([-1.15, z, 0.85, z]);
    traces.push([0.85, -0.6, 0.85, 0.6], [0.6, -0.68, 1.2, -0.68]);
    for (let i = 0; i < 4; i++) parts.push({ kind: 'block', x: 0.66 + i * 0.13, z: -0.62, w: 0.08, d: 0.07, h: 0.07 });
    parts.push({ kind: 'wall', x: -1.18, z: 0, w: 0.04, d: 1.3, h: 0.05 });
  } else if (k === 2) {
    for (let a = 0; a < 40; a++)
      if (a % 10 !== 5)
        parts.push({
          kind: 'wall',
          x: Math.cos((a / 40) * Math.PI * 2) * 0.92,
          z: Math.sin((a / 40) * Math.PI * 2) * 0.52,
          w: 0.1,
          d: 0.1,
          h: 0.07,
        });
    for (let g = 0; g < 4; g++) {
      const a = ((g * 10 + 5) / 40) * Math.PI * 2;
      for (const s of [-1, 1])
        parts.push({
          kind: 'tank',
          x: Math.cos(a + s * 0.09) * 0.92,
          z: Math.sin(a + s * 0.09) * 0.52,
          w: 0.07,
          d: 0.07,
          h: 0.15,
        });
      traces.push([0, 0, Math.cos(a) * 1.2, Math.sin(a) * 0.7]);
    }
    parts.push({ kind: 'tower', x: 0, z: 0, w: 0.2, d: 0.2, h: 0.32 });
  } else if (k === 3) {
    for (let i = -3; i <= 3; i++)
      for (let j = -2; j <= 2; j++)
        if (Math.abs(i) > 1 || Math.abs(j) > 1)
          parts.push({ kind: 'block', x: i * 0.32, z: j * 0.27, w: r(0.14, 0.22), d: r(0.12, 0.19), h: r(0.05, 0.2) });
    trees(rng, 0, 0, 0.5, 0.36, 9, parts);
    parts.push({ kind: 'tower', x: 0, z: 0, w: 0.12, d: 0.12, h: 0.24 });
    grid([-0.48, -0.16, 0.16, 0.48], [-0.4, -0.13, 0.13, 0.4]);
  } else if (k === 4) {
    for (let i = -3; i <= 3; i++) {
      for (let j = -2; j <= 2; j++) {
        if (rng() < 0.28) continue;
        const tall = rng() > 0.85;
        const x = i * 0.33 + r(-0.04, 0.04);
        const z = j * 0.27 + r(-0.03, 0.03);
        if (rng() > 0.75) parts.push({ kind: 'tower', x, z, w: 0.1, d: 0.1, h: tall ? 0.36 : r(0.1, 0.2) });
        else
          parts.push({
            kind: 'block',
            x,
            z,
            w: r(0.08, 0.17),
            d: r(0.08, 0.16),
            h: tall ? r(0.3, 0.38) : r(0.05, 0.17),
          });
      }
    }
    grid([-0.83, -0.17, 0.5], [-0.14, 0.4]);
  } else {
    // The overcity, where people live: wireframe apartment rows, two parks, a stadium.
    for (const [cx, cz] of [
      [-0.64, -0.25],
      [0, -0.25],
      [0.64, 0.25],
      [-0.64, 0.25],
    ] as const) {
      for (let i = 0; i < 3; i++)
        parts.push({ kind: 'apartment', x: cx + (i - 1) * 0.17, z: cz, w: 0.12, d: 0.14, h: r(0.14, 0.3) });
    }
    trees(rng, 0, 0.26, 0.5, 0.38, 10, parts);
    trees(rng, 1.12, -0.25, 0.26, 0.36, 5, parts);
    parts.push({ kind: 'tank', x: 0.64, z: -0.26, w: 0.42, d: 0.42, h: 0.05 });
    grid(STREETS.x, STREETS.z);
  }
  return { parts, traces };
}
