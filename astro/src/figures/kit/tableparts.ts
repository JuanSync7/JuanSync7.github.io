import { Draft } from './hardware/primitives';
import type { Surface } from './hardware/types';
import type { Vec3 } from './camera';
import { beam } from './bodies';

export type FurnitureFinish =
  | 'top'
  | 'frame'
  | 'panel'
  | 'metal'
  | 'recess'
  | 'inlay'
  | 'foot'
  | 'tile'
  | 'wall'
  | 'floor'
  | 'rug'
  | 'stitch'
  | 'shade'
  | 'light'
  | 'leaf'
  | 'ceramic'
  | 'upholstery'
  | 'window'
  | 'floorAlt'
  | 'brick'
  | 'cabinet'
  | 'acoustic'
  | 'paper'
  | 'book';
export interface TableSurface extends Surface {
  finish?: FurnitureFinish;
}
function counterclockwise(points: readonly (readonly [number, number])[]) {
  const area = points.reduce((sum, a, i) => {
    const b = points[(i + 1) % points.length];
    return sum + (b ? a[0] * b[1] - b[0] * a[1] : 0);
  }, 0);
  return area < 0 ? [...points].reverse() : points;
}
/** The hardware atlas's bevelled solids, extended with turned vessels and curved handles.
 * One model supplies both WebGL and the canvas fallback. */
export class TableDraft extends Draft {
  constructor() {
    super();
    this.part('Tabletop object', 'A physical tabletop assembly.');
  }
  override extrude(outline: readonly (readonly [number, number])[], low: number, high: number): void {
    const surfaces = this.parts[this.parts.length - 1]?.surfaces;
    const start = surfaces?.length ?? 0;
    super.extrude(counterclockwise(outline), low, high);
    // The atlas uses double-sided faces. Lit furniture needs outward shadow normals.
    for (const surface of surfaces?.slice(start) ?? []) if (surface.face) surface.points.reverse();
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
    profile = counterclockwise(profile);
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
        this.face([point(a[0], a[1], i), point(b[0], b[1], i), point(b[0], b[1], i + 1), point(a[0], a[1], i + 1)]);
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
    for (let i = 0; i < triangles.length; i += 9) {
      const triangle: [Vec3, Vec3, Vec3] = [
        [triangles[i] ?? 0, triangles[i + 1] ?? 0, triangles[i + 2] ?? 0],
        [triangles[i + 3] ?? 0, triangles[i + 4] ?? 0, triangles[i + 5] ?? 0],
        [triangles[i + 6] ?? 0, triangles[i + 7] ?? 0, triangles[i + 8] ?? 0],
      ];
      const [p, q, r] = triangle;
      const u: Vec3 = [q[0] - p[0], q[1] - p[1], q[2] - p[2]],
        v: Vec3 = [r[0] - p[0], r[1] - p[1], r[2] - p[2]];
      const nx = u[1] * v[2] - u[2] * v[1],
        ny = u[2] * v[0] - u[0] * v[2],
        nz = u[0] * v[1] - u[1] * v[0];
      const dot =
        nx * ((p[0] + q[0] + r[0]) / 3 - (a[0] + b[0]) / 2) +
        ny * ((p[1] + q[1] + r[1]) / 3 - (a[1] + b[1]) / 2) +
        nz * ((p[2] + q[2] + r[2]) / 3 - (a[2] + b[2]) / 2);
      this.face(dot < 0 ? triangle.reverse() : triangle);
    }
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
