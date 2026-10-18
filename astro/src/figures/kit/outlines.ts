import { bodyOf, type Part } from './city';
/** Outlines of a city's parts (`kit/city.ts`) as line segments, ready for one batch: box
 *  edges, apartments with a ring per floor, round tanks and towers, wireframe trees, parks,
 *  and the industrial kinds: ore heaps, headframes, saw-tooth sheds, domes, cooling towers,
 *  solar rows and wind-turbine masts (their rotors turn, so `kit/citylife.ts` draws those). */

const TAU = Math.PI * 2;
/** A cooling tower is a ruled hyperboloid: straight lines from the base ring to a smaller top
 *  ring, each turned by TWIST. Radii are for a unit part (diameter 1, height 1). */
const TWIST = 1.15;
const [BASE, TOP] = [0.5, 0.33];
const ruled = (a: number, s: number): [number, number] => [
  (1 - s) * BASE * Math.cos(a) + s * TOP * Math.cos(a + TWIST),
  (1 - s) * BASE * Math.sin(a) + s * TOP * Math.sin(a + TWIST),
];
/** The cooling tower's profile as (radius, height) pairs, for a lathe body of the same shape. */
export const COOLER: [number, number][] = Array.from({ length: 9 }, (_, i) => {
  const [x, z] = ruled(0, i / 8);
  return [Math.hypot(x, z), i / 8];
});

/** Every part's outline as segment endpoints (x, y, z, x, y, z, …), for one line batch. */
export function outlines(parts: readonly Part[]): number[] {
  const p: number[] = [];
  const ring = (x: number, y: number, z: number, rx: number, rz: number, n = 12): void => {
    for (let i = 0; i < n; i++) {
      const [a, b] = [(i / n) * TAU, ((i + 1) / n) * TAU];
      p.push(x + Math.cos(a) * rx, y, z + Math.sin(a) * rz, x + Math.cos(b) * rx, y, z + Math.sin(b) * rz);
    }
  };
  const rect = (x0: number, x1: number, y: number, z0: number, z1: number): void => {
    p.push(x0, y, z0, x1, y, z0, x1, y, z0, x1, y, z1, x1, y, z1, x0, y, z1, x0, y, z1, x0, y, z0);
  };
  const posts = (x0: number, x1: number, z0: number, z1: number, y0: number, y1: number): void => {
    for (const [cx, cz] of [
      [x0, z0],
      [x1, z0],
      [x1, z1],
      [x0, z1],
    ] as const)
      p.push(cx, y0, cz, cx, y1, cz);
  };
  // A cone of n sides from a ring at y0 to an apex at y1 (pines, ore heaps, turbine masts).
  const cone = (x: number, z: number, rx: number, rz: number, y0: number, y1: number, n: number): void => {
    ring(x, y0, z, rx, rz, n);
    for (let i = 0; i < n; i++)
      p.push(x + Math.cos((i / n) * TAU) * rx, y0, z + Math.sin((i / n) * TAU) * rz, x, y1, z);
  };
  for (const { kind, x, z, w, d, h } of parts) {
    const [x0, x1, z0, z1] = [x - w / 2, x + w / 2, z - d / 2, z + d / 2];
    const body = bodyOf(kind);
    if (body === 'box' || kind === 'apartment') {
      // An apartment is see-through: its floors are drawn as rings round the frame.
      const floors = kind === 'apartment' ? Math.max(2, Math.round(h / 0.04)) : 1;
      // A standard cell is a tile only a few units high: its top is all that reads.
      if (kind === 'cell') rect(x0, x1, h, z0, z1);
      else {
        for (let f = 0; f <= floors; f++) rect(x0, x1, (h * f) / floors, z0, z1);
        posts(x0, x1, z0, z1, 0, h);
      }
      // A shed's roof is a row of saw teeth, the steep face glazed toward the north light.
      if (kind === 'shed')
        for (let i = 0, n = Math.max(2, Math.round(w / 0.07)); i < n; i++) {
          const [a, b] = [x0 + (w * i) / n, x0 + (w * (i + 1)) / n];
          for (const zz of [z0, z1]) p.push(a, h, zz, a, h + 0.035, zz, a, h + 0.035, zz, b, h, zz);
          p.push(a, h + 0.035, z0, a, h + 0.035, z1);
        }
    } else if (body === 'round') {
      ring(x, 0, z, w / 2, d / 2);
      ring(x, h, z, w / 2, d / 2);
      if (kind !== 'tank') ring(x, h * 0.5, z, w / 2, d / 2);
      for (let i = 0; i < 4; i++) {
        const [cx, cz] = [x + (Math.cos(i * 1.57) * w) / 2, z + (Math.sin(i * 1.57) * d) / 2];
        p.push(cx, 0, cz, cx, h, cz);
      }
    } else if (body === 'cone') {
      cone(x, z, w / 2, d / 2, 0, h, 7);
    } else if (body === 'dome') {
      for (const a of [0, 0.5, 0.95]) ring(x, Math.sin(a) * h, z, (Math.cos(a) * w) / 2, (Math.cos(a) * d) / 2, 16);
      for (let i = 0; i < 6; i++) {
        const c = (i / 6) * TAU;
        for (let j = 0; j < 4; j++) {
          const [a, b] = [(j / 4) * 1.57, ((j + 1) / 4) * 1.57];
          p.push(x + (Math.cos(c) * Math.cos(a) * w) / 2, Math.sin(a) * h, z + (Math.sin(c) * Math.cos(a) * d) / 2);
          p.push(x + (Math.cos(c) * Math.cos(b) * w) / 2, Math.sin(b) * h, z + (Math.sin(c) * Math.cos(b) * d) / 2);
        }
      }
    } else if (body === 'cooler') {
      for (const i of [0, 4, 8]) {
        const [r, y] = COOLER[i] ?? [0.5, 0];
        ring(x, y * h, z, r * w, r * d, 16);
      }
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * TAU;
        const [bx, bz] = ruled(a, 0);
        const [tx, tz] = ruled(a, 1);
        p.push(x + bx * w, 0, z + bz * d, x + tx * w, h, z + tz * d);
      }
    } else if (kind === 'park') {
      rect(x0, x1, 0.002, z0, z1);
    } else if (kind === 'headframe') {
      // A mine's headframe: a braced lattice tower with the winding wheel on top.
      const inset = (f: number): [number, number, number, number] => [x0 + w * f, x1 - w * f, z0 + d * f, z1 - d * f];
      const [a0, a1, b0, b1] = inset(0.3);
      for (const [c0, c1] of [
        [x0, a0],
        [x1, a1],
      ] as const)
        for (const [e0, e1] of [
          [z0, b0],
          [z1, b1],
        ] as const)
          p.push(c0, 0, e0, c1, h, e1);
      for (const f of [0.1, 0.2, 0.3]) {
        const [c0, c1, e0, e1] = inset(f);
        rect(c0, c1, (h * f) / 0.3, e0, e1);
      }
      p.push(x0, 0, z1, a1, h * 0.66, b1, x1, 0, z1, a0, h * 0.66, b1);
      for (let i = 0; i < 12; i++) {
        const [a, b] = [(i / 12) * TAU, ((i + 1) / 12) * TAU];
        const r = w * 0.32;
        p.push(x + Math.cos(a) * r, h + r + Math.sin(a) * r, z, x + Math.cos(b) * r, h + r + Math.sin(b) * r, z);
      }
    } else if (kind === 'solar') {
      // One row of panels tilted to the sun: low at the front edge, high at the back.
      const [lo, hi] = [h * 0.35, h];
      p.push(x0, lo, z1, x1, lo, z1, x1, lo, z1, x1, hi, z0, x1, hi, z0, x0, hi, z0, x0, hi, z0, x0, lo, z1);
      for (let i = 1, n = Math.max(2, Math.round(w / 0.08)); i < n; i++)
        p.push(x0 + (w * i) / n, lo, z1, x0 + (w * i) / n, hi, z0);
      p.push(x0, 0, z1, x0, lo, z1, x1, 0, z1, x1, lo, z1, x0, 0, z0, x0, hi, z0, x1, 0, z0, x1, hi, z0);
    } else if (kind === 'turbine') {
      cone(x, z, w / 2, d / 2, 0, h, 3);
      p.push(x - 0.012, h, z - 0.02, x + 0.012, h, z - 0.02, x + 0.012, h, z - 0.02, x + 0.012, h, z + 0.03);
    } else {
      // Trees in wireframe: a pine is a five-sided cone, a broadleaf a diamond on a short trunk.
      if (kind === 'pine') cone(x, z, w / 2, d / 2, 0, h, 5);
      else {
        const [base, mid, top] = [h * 0.35, h * 0.6, h * 0.9];
        ring(x, mid, z, w / 2, d / 2, 4);
        for (let i = 0; i < 4; i++) {
          const [cx, cz] = [x + (Math.cos((i / 4) * TAU) * w) / 2, z + (Math.sin((i / 4) * TAU) * d) / 2];
          p.push(cx, mid, cz, x, top, z, cx, mid, cz, x, base, z);
        }
        p.push(x, 0, z, x, base, z);
      }
    }
  }
  return p;
}
