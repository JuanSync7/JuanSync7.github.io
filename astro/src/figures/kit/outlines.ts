import { isBox, isRound, type Part } from './city';
/** Outlines of a city's parts (`kit/city.ts`) as line segments, ready for one batch: box
 *  edges, apartments with a ring per floor, round tanks and towers, wireframe trees, parks. */

/** Every part's outline as segment endpoints (x, y, z, x, y, z, …), for one line batch. */
export function outlines(parts: readonly Part[]): number[] {
  const p: number[] = [];
  const ring = (x: number, y: number, z: number, rx: number, rz: number, n = 12): void => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const b = ((i + 1) / n) * Math.PI * 2;
      p.push(x + Math.cos(a) * rx, y, z + Math.sin(a) * rz, x + Math.cos(b) * rx, y, z + Math.sin(b) * rz);
    }
  };
  const rect = (x0: number, x1: number, y: number, z0: number, z1: number): void => {
    p.push(x0, y, z0, x1, y, z0, x1, y, z0, x1, y, z1, x1, y, z1, x0, y, z1, x0, y, z1, x0, y, z0);
  };
  for (const { kind, x, z, w, d, h } of parts) {
    const [x0, x1, z0, z1] = [x - w / 2, x + w / 2, z - d / 2, z + d / 2];
    if (isBox(kind) || kind === 'apartment') {
      // An apartment is see-through: its floors are drawn as rings round the frame.
      const floors = kind === 'apartment' ? Math.max(2, Math.round(h / 0.04)) : 1;
      for (let f = 0; f <= floors; f++) rect(x0, x1, (h * f) / floors, z0, z1);
      for (const [cx, cz] of [
        [x0, z0],
        [x1, z0],
        [x1, z1],
        [x0, z1],
      ] as const)
        p.push(cx, 0, cz, cx, h, cz);
    } else if (isRound(kind)) {
      ring(x, 0, z, w / 2, d / 2);
      ring(x, h, z, w / 2, d / 2);
      if (kind === 'tower') ring(x, h * 0.5, z, w / 2, d / 2);
      for (let i = 0; i < 4; i++)
        p.push(
          x + (Math.cos(i * 1.57) * w) / 2,
          0,
          z + (Math.sin(i * 1.57) * d) / 2,
          x + (Math.cos(i * 1.57) * w) / 2,
          h,
          z + (Math.sin(i * 1.57) * d) / 2,
        );
    } else if (kind === 'park') {
      rect(x0, x1, 0.002, z0, z1);
    } else {
      // Trees in wireframe: a pine is a five-sided cone, a broadleaf a diamond on a short trunk.
      const n = kind === 'pine' ? 5 : 4;
      const base = kind === 'pine' ? 0 : h * 0.35;
      const top = kind === 'pine' ? h : h * 0.9;
      const mid = kind === 'pine' ? 0 : h * 0.6;
      ring(x, kind === 'pine' ? 0 : mid, z, w / 2, d / 2, n);
      for (let i = 0; i < n; i++) {
        const [cx, cz] = [x + (Math.cos((i / n) * Math.PI * 2) * w) / 2, z + (Math.sin((i / n) * Math.PI * 2) * d) / 2];
        p.push(cx, kind === 'pine' ? 0 : mid, cz, x, top, z);
        if (kind === 'tree') p.push(cx, mid, cz, x, base, z);
      }
      if (kind === 'tree') p.push(x, 0, z, x, base, z);
    }
  }
  return p;
}
