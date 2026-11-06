import { Draft } from './hardware/primitives';
import type { Surface } from './hardware/types';
import type { Vec3 } from './camera';
import { beam } from './bodies';

export type FurnitureFinish = 'top' | 'frame' | 'panel' | 'metal' | 'recess' | 'inlay' | 'foot' | 'tile';
export interface TableSurface extends Surface {
  finish?: FurnitureFinish;
}
/** The hardware atlas's bevelled solids, extended with turned vessels and curved handles.
 * One model supplies both WebGL and the canvas fallback. */
export class TableDraft extends Draft {
  constructor() {
    super();
    this.part('Tabletop object', 'A physical tabletop assembly.');
  }
  material(kind: FurnitureFinish, build: () => void): void {
    const surfaces = this.parts[0]?.surfaces;
    if (!surfaces) return;
    const start = surfaces.length;
    build();
    for (const surface of surfaces.slice(start)) if (!('finish' in surface)) Object.assign(surface, { finish: kind });
  }
  face(points: Vec3[]): void {
    this.parts[0]?.surfaces.push({ solid: 10000, face: true, points });
  }
  lathe(profile: readonly (readonly [number, number])[], x = 0, z = 0, n = 16): void {
    for (let k = 0; k + 1 < profile.length; k++) {
      const a = profile[k],
        b = profile[k + 1];
      if (!a || !b) continue;
      for (let i = 0; i < n; i++) {
        const point = (r: number, y: number, j: number): Vec3 => [
          x + Math.cos((j * Math.PI * 2) / n) * r,
          y,
          z + Math.sin((j * Math.PI * 2) / n) * r,
        ];
        this.face([point(a[0], a[1], i), point(a[0], a[1], i + 1), point(b[0], b[1], i + 1), point(b[0], b[1], i)]);
      }
    }
  }
  handle(x: number, y: number, radius: number, tube = 0.035): void {
    const point = (a: number, b: number): Vec3 => [
      x + (radius + Math.cos(b) * tube) * Math.cos(a),
      y + (radius + Math.cos(b) * tube) * Math.sin(a),
      Math.sin(b) * tube,
    ];
    for (let i = 0; i < 16; i++)
      for (let j = 0; j < 6; j++) {
        const a = (i * Math.PI) / 8,
          b = (j * Math.PI) / 3;
        this.face([
          point(a, b),
          point(a + Math.PI / 8, b),
          point(a + Math.PI / 8, b + Math.PI / 3),
          point(a, b + Math.PI / 3),
        ]);
      }
  }
  rod(a: Vec3, b: Vec3, width = 0.035): void {
    const triangles: number[] = [];
    beam(triangles, a, b, width);
    for (let i = 0; i < triangles.length; i += 9)
      this.face([
        [triangles[i] ?? 0, triangles[i + 1] ?? 0, triangles[i + 2] ?? 0],
        [triangles[i + 3] ?? 0, triangles[i + 4] ?? 0, triangles[i + 5] ?? 0],
        [triangles[i + 6] ?? 0, triangles[i + 7] ?? 0, triangles[i + 8] ?? 0],
      ]);
  }
  tube(a: Vec3, b: Vec3, radius: number, n = 12): void {
    const length = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    if (length < 0.00001) return;
    const d: Vec3 = [(b[0] - a[0]) / length, (b[1] - a[1]) / length, (b[2] - a[2]) / length];
    const ref: Vec3 = Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    const u: Vec3 = [d[1] * ref[2] - d[2] * ref[1], d[2] * ref[0] - d[0] * ref[2], d[0] * ref[1] - d[1] * ref[0]];
    const norm = Math.hypot(...u);
    const v: Vec3 = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]];
    const ring = (origin: Vec3): Vec3[] =>
      Array.from({ length: n }, (_, i) => {
        const angle = (i * Math.PI * 2) / n;
        const point = (j: 0 | 1 | 2): number =>
          origin[j] + (radius * (u[j] * Math.cos(angle) + v[j] * Math.sin(angle))) / norm;
        return [point(0), point(1), point(2)];
      });
    const low = ring(a),
      high = ring(b);
    this.face([...low].reverse());
    this.face(high);
    low.forEach((q, i) => {
      const next = (i + 1) % n,
        r = low[next],
        s = high[next],
        t = high[i];
      if (r && s && t) this.face([q, r, s, t]);
    });
  }
}
export type BuildProp = (p: TableDraft) => void;
export interface Bounds {
  lo: Vec3;
  hi: Vec3;
}
export interface PropModel {
  surfaces: TableSurface[];
  bounds: Bounds;
}
export function finish(p: TableDraft): PropModel {
  const surfaces = p.parts.flatMap((part) => part.surfaces);
  const points = surfaces.flatMap((s) => s.points);
  return {
    surfaces,
    bounds: {
      lo: [
        Math.min(...points.map((q) => q[0])),
        Math.min(...points.map((q) => q[1])),
        Math.min(...points.map((q) => q[2])),
      ],
      hi: [
        Math.max(...points.map((q) => q[0])),
        Math.max(...points.map((q) => q[1])),
        Math.max(...points.map((q) => q[2])),
      ],
    },
  };
}
export function corners(b: Bounds): Vec3[] {
  return [b.lo[0], b.hi[0]].flatMap((x) =>
    [b.lo[1], b.hi[1]].flatMap((y) => [b.lo[2], b.hi[2]].map((z): Vec3 => [x, y, z])),
  );
}
export function world(v: Vec3, x: number, z: number, scale: number, turn: number): Vec3 {
  return [
    x + scale * (v[0] * Math.cos(turn) + v[2] * Math.sin(turn)),
    v[1] * scale,
    z + scale * (-v[0] * Math.sin(turn) + v[2] * Math.cos(turn)),
  ];
}
