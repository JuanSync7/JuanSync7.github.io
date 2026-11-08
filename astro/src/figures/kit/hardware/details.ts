import type { Draft } from './primitives';
import type { Vec3 } from '../camera';

export function rect(p: Draft, x: number, y: number, z: number, w: number, d: number): void {
  p.line(
    [
      [x - w / 2, y, z - d / 2],
      [x + w / 2, y, z - d / 2],
      [x + w / 2, y, z + d / 2],
      [x - w / 2, y, z + d / 2],
    ],
    true,
  );
}
export function screw(p: Draft, x: number, y: number, z: number, r = 0.026): void {
  p.ring(x, y, z, r, 'top', 12);
  p.detail(() => {
    p.ring(x, y, z, r * 0.52, 'top', 8);
    p.line([
      [x - r * 0.42, y, z],
      [x + r * 0.42, y, z],
    ]);
    p.line([
      [x, y, z - r * 0.42],
      [x, y, z + r * 0.42],
    ]);
  });
}
export function capacitor(p: Draft, x: number, y: number, z: number, w = 0.075, d = 0.035): void {
  p.box(x, y, z, w, 0.035, d, 0.004);
  for (const s of [-1, 1])
    p.line([
      [x + s * w * 0.31, y + 0.036, z - d / 2],
      [x + s * w * 0.31, y + 0.036, z + d / 2],
    ]);
}
export function packageChip(p: Draft, x: number, y: number, z: number, w: number, d: number, pins = 6): void {
  p.box(x, y, z, w, 0.065, d, 0.012);
  rect(p, x, y + 0.066, z, w * 0.8, d * 0.76);
  p.detail(() => {
    for (let i = 0; i < pins; i++)
      for (const sign of [-1, 1]) {
        const xx = x + (i / (pins - 1) - 0.5) * w * 0.85;
        p.line([
          [xx, y + 0.014, z + (sign * d) / 2],
          [xx, y + 0.014, z + sign * (d / 2 + 0.025)],
        ]);
      }
    p.ring(x - w * 0.28, y + 0.067, z - d * 0.25, 0.009, 'top', 8);
  });
}
export function laminate(p: Draft): void {
  const host = p.profile();
  const point = (index: number, t: number): Vec3 => {
    const a = host.bottom.points.at(-1 - index),
      b = host.top.points[index];
    if (!a || !b) throw new Error('Laminate needs corresponding extrusion caps.');
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  };
  for (const t of [0.25, 0.65])
    p.line(
      host.top.points.map((_, i) => point(i, t)),
      true,
      host.solid,
    );
  const edge = host.top.points
    .map((a, i) => ({ i, z: (a[2] + host.top.points[(i + 1) % host.top.points.length]![2]) / 2 }))
    .sort((a, b) => b.z - a.z)[0]?.i;
  if (edge === undefined) throw new Error('Laminate needs a host perimeter.');
  p.detail(() => {
    for (let i = 0; i < 12; i++) {
      const u = (i + 0.5) / 12;
      const at = (t: number): Vec3 => {
        const a = point(edge, t),
          b = point((edge + 1) % host.top.points.length, t);
        return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
      };
      p.line([at(0.15), at(0.75)], false, host.solid);
    }
  });
}
export function matrix(p: Draft, x: number, y: number, z: number, n = 6, pitch = 0.018): void {
  p.detail(() => {
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        if (i === 0 || j === n - 1 || (i * 7 + j * 11) % 5 < 2)
          rect(p, x + i * pitch, y, z + j * pitch, pitch * 0.6, pitch * 0.6);
  });
}
/** A schematic floorplan: core blocks, a shared cache spine, and edge interface lanes. */
export function logic(p: Draft, x: number, y: number, z: number, w: number, d: number, n = 4): void {
  rect(p, x, y, z, w * 0.94, d * 0.94);
  rect(p, x, y, z, w * 0.16, d * 0.84);
  for (let side = -1; side <= 1; side += 2)
    for (let row = 0; row < n; row++) {
      const cx = x + side * w * 0.28,
        cz = z + (row / (n - 1) - 0.5) * d * 0.66;
      rect(p, cx, y, cz, w * 0.29, (d * 0.52) / n);
      p.detail(() => {
        rect(p, cx - side * w * 0.06, y, cz, w * 0.11, (d * 0.38) / n);
        for (let k = 0; k < 3; k++)
          p.line([
            [cx + w * 0.02 + k * w * 0.035, y, cz - (d * 0.19) / n],
            [cx + w * 0.02 + k * w * 0.035, y, cz + (d * 0.19) / n],
          ]);
      });
    }
  p.detail(() => {
    for (let k = 0; k < 10; k++)
      for (const s of [-1, 1]) {
        const zz = z + (k / 9 - 0.5) * d * 0.86;
        p.line([
          [x + s * w * 0.42, y, zz],
          [x + s * w * 0.47, y, zz],
        ]);
      }
    for (let k = 0; k < 12; k++)
      p.line([
        [x - w * 0.065, y, z + (k / 11 - 0.5) * d * 0.78],
        [x + w * 0.065, y, z + (k / 11 - 0.5) * d * 0.78],
      ]);
  });
}
/** Four walls and a recessed rear make an opening, rather than a rectangle on a closed box. */
export function port(p: Draft, x: number, y: number, z: number, w: number, h: number, d: number, contacts = 4): void {
  const t = Math.min(w, h) * 0.14;
  for (const s of [-1, 1]) p.box(x + (s * (w - t)) / 2, y, z, t, h, d, 0.004);
  p.box(x, y, z, w, t, d, 0.004);
  p.box(x, y + h - t, z, w, t, d, 0.004);
  p.box(x, y + t, z - d / 2 + t / 2, w - 2 * t, h - 2 * t, t, 0.004);
  p.detail(() => {
    for (let i = 0; i < contacts; i++) {
      const xx = x + (i / (contacts - 1) - 0.5) * (w - 3 * t);
      p.line([
        [xx, y + t + 0.002, z + d * 0.35],
        [xx, y + t + 0.002, z - d * 0.15],
      ]);
    }
  });
}
export function frame(p: Draft, x: number, y: number, z: number, w: number, h: number, d: number, t = 0.035): void {
  for (const s of [-1, 1]) p.box(x + (s * (w - t)) / 2, y, z, t, h, d, 0.005);
  for (const s of [-1, 1]) p.box(x, y, z + (s * (d - t)) / 2, w - 2 * t, h, t, 0.005);
}
