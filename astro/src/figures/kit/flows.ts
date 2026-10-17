import type { Vec3 } from './camera';
import type { Rng } from './rng';
/** Workflows as stations on a floor: the layouts (a straight flow, a loop, a fan-out that
 *  joins again, a snake over two rows), the route one job takes through them, and the traces
 *  that join two stations. Workflow draws them as isometric stations. */

export const SHAPES = ['flow', 'loop', 'branch', 'zigzag'] as const;
export type Shape = (typeof SHAPES)[number];
export const GLYPHS = ['grid', 'bars', 'ring', 'stack', 'plain'] as const;
export type Glyph = (typeof GLYPHS)[number];

export interface Station {
  x: number;
  z: number;
  h: number;
  glyph: Glyph;
}

export function layout(shape: Shape, rng: Rng): { at: [number, number][]; edges: [number, number][] } {
  if (shape === 'flow') {
    const n = 5 + Math.floor(rng() * 2);
    return {
      at: Array.from({ length: n }, (_, i) => [i - (n - 1) / 2, (rng() - 0.5) * 0.7]),
      edges: Array.from({ length: n - 1 }, (_, i) => [i, i + 1]),
    };
  }
  if (shape === 'loop') {
    const n = 5;
    return {
      at: Array.from({ length: n }, (_, i) => [
        Math.cos((i / n) * Math.PI * 2 + Math.PI) * 1.8,
        Math.sin((i / n) * Math.PI * 2 + Math.PI) * 0.95,
      ]),
      edges: Array.from({ length: n }, (_, i) => [i, (i + 1) % n]),
    };
  }
  if (shape === 'branch') {
    return {
      at: [
        [-2.2, 0],
        [-1.1, 0],
        [0, -1],
        [0, 0],
        [0, 1],
        [1.1, 0],
        [2.2, 0],
      ],
      edges: [
        [0, 1],
        [1, 2],
        [1, 3],
        [1, 4],
        [2, 5],
        [3, 5],
        [4, 5],
        [5, 6],
      ],
    };
  }
  const at: [number, number][] = [];
  for (let i = 0; i < 8; i++) at.push([(i < 4 ? i : 7 - i) * 1.05 - 1.575, i < 4 ? -0.6 : 0.6]);
  return { at, edges: Array.from({ length: 7 }, (_, i) => [i, i + 1]) };
}

/** The route the job takes through cycle c: every station in order, choosing one arm of a fan. */
export function route(p: { shape: Shape; stations: readonly Station[] }, c: number): number[] {
  if (p.shape === 'branch') return [0, 1, 2 + (c % 3), 5, 6];
  if (p.shape === 'loop') return [...p.stations.map((_, i) => i), 0];
  return p.stations.map((_, i) => i);
}

/** A trace runs along x, then along z, on the floor between two stations' bases. */
export function trace(a: Station, b: Station): Vec3[] {
  return [
    [a.x, 0, a.z],
    [b.x, 0, a.z],
    [b.x, 0, b.z],
  ];
}
