import type { Block, Material, World } from './types';
import { solidVolume } from './volume';

export interface SurfaceQuad {
  axis: number;
  sign: number;
  plane: number;
  u: number;
  v: number;
  width: number;
  height: number;
  material: Material;
  ao: number[];
}
interface Plane {
  axis: number;
  sign: number;
  plane: number;
  cells: Map<string, SurfaceQuad>;
}
const corners = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
] as const;
const key = (u: number, v: number): string => `${u},${v}`;

/** Merge only compatible coplanar faces. Nonuniform contact shading stays at unit resolution. */
export function surfaceQuads(blocks: Block[], world?: World): SurfaceQuad[] {
  const { solid } = solidVolume(blocks, world),
    planes = new Map<string, Plane>();
  for (const b of blocks) {
    const p = [b.x, b.y, b.z];
    for (let axis = 0; axis < 3; axis++)
      for (const sign of [-1, 1]) {
        const a = axis,
          u = (a + 1) % 3,
          v = (a + 2) % 3,
          outside = [...p];
        outside[a] = (outside[a] ?? 0) + sign;
        if (solid(outside[0] ?? 0, outside[1] ?? 0, outside[2] ?? 0)) continue;
        const ao = corners.map(([su, sv]) => {
          const sideU = [...outside],
            sideV = [...outside],
            diagonal = [...outside];
          sideU[u] = (sideU[u] ?? 0) + su;
          sideV[v] = (sideV[v] ?? 0) + sv;
          diagonal[u] = (diagonal[u] ?? 0) + su;
          diagonal[v] = (diagonal[v] ?? 0) + sv;
          const has = (q: number[]): number => (solid(q[0] ?? 0, q[1] ?? 0, q[2] ?? 0) ? 1 : 0);
          const x = has(sideU),
            y = has(sideV);
          return x && y ? 3 : x + y + has(diagonal);
        });
        const plane = (p[a] ?? 0) + sign / 2,
          id = `${a}/${sign}/${plane}`;
        let sheet = planes.get(id);
        if (!sheet) {
          sheet = { axis: a, sign, plane, cells: new Map() };
          planes.set(id, sheet);
        }
        const pu = p[u] ?? 0,
          pv = p[v] ?? 0;
        sheet.cells.set(key(pu, pv), {
          axis: a,
          sign,
          plane,
          u: pu,
          v: pv,
          width: 1,
          height: 1,
          material: b.material,
          ao,
        });
      }
  }
  const quads: SurfaceQuad[] = [];
  for (const sheet of planes.values()) {
    const cells = sheet.cells;
    for (const q of [...cells.values()].sort((a, b) => a.v - b.v || a.u - b.u)) {
      if (!cells.has(key(q.u, q.v))) continue;
      const uniform = q.ao.every((n) => n === q.ao[0]);
      const matches = (u: number, v: number): boolean => {
        const b = cells.get(key(u, v));
        return !!b && b.material === q.material && b.ao.every((n) => n === q.ao[0]);
      };
      let width = 1,
        height = 1;
      if (uniform) {
        while (matches(q.u + width, q.v)) width++;
        outer: while (true) {
          for (let x = 0; x < width; x++) if (!matches(q.u + x, q.v + height)) break outer;
          height++;
        }
      }
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) cells.delete(key(q.u + x, q.v + y));
      quads.push({ ...q, width, height });
    }
  }
  return quads;
}
