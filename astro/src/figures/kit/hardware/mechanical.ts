import type { Draft } from './primitives';
import { frame, screw } from './details';

export function fan(p: Draft, r: number, blades = 7): void {
  frame(p, 0, 0, 0, r * 2.2, 0.055, r * 2.2, r * 0.12);
  for (const x of [-r * 0.97, r * 0.97]) for (const z of [-r * 0.97, r * 0.97]) screw(p, x, 0.056, z, r * 0.05);
  p.tube(0, 0.005, 0, r, r * 0.94, 0.05, 24);
  impeller(p, r, blades);
}
export function impeller(p: Draft, r: number, blades = 7): void {
  p.cylinder(0, 0.02, 0, r * 0.24, 0.07, 16);
  p.ring(0, 0.091, 0, r * 0.15, 'top', 16);
  for (let i = 0; i < blades; i++) {
    const a = (i / blades) * Math.PI * 2;
    p.extrude(
      [
        [0.22, a],
        [0.74, a + 0.12],
        [0.92, a + 0.38],
        [0.85, a + 0.6],
        [0.38, a + 0.5],
      ].map(([rr = 0, theta = 0]): [number, number] => [Math.cos(theta) * rr * r, Math.sin(theta) * rr * r]),
      0.04,
      0.055,
    );
  }
  p.detail(() => {
    for (const s of [-1, 1]) {
      p.line([
        [s * r, 0.004, 0],
        [s * r * 0.18, 0.004, 0],
      ]);
      p.line([
        [0, 0.004, s * r],
        [0, 0.004, s * r * 0.18],
      ]);
    }
  });
}

export function finBank(
  p: Draft,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  count: number,
): void {
  p.box(x, y, z, w, 0.035, d, 0.008);
  for (let i = 0; i < count; i++)
    p.box(x + (i / (count - 1) - 0.5) * (w - 0.025), y + 0.035, z, 0.018, h - 0.035, d, 0.002);
}
export function electrolytic(p: Draft, x: number, y: number, z: number, r: number, h: number): void {
  p.cylinder(x, y, z, r, h, 16);
  p.ring(x, y + h + 0.001, z, r * 0.8, 'top', 16);
  p.line([
    [x - r * 0.5, y + h + 0.002, z],
    [x + r * 0.5, y + h + 0.002, z],
  ]);
  p.line([
    [x, y + h + 0.002, z - r * 0.5],
    [x, y + h + 0.002, z + r * 0.5],
  ]);
  p.detail(() => p.ring(x, y + h * 0.2, z, r * 1.006, 'top', 16));
}
export function grille(p: Draft, x: number, y: number, z: number, r: number): void {
  for (let k = 1; k <= 5; k++) p.ring(x, y, z, (r * k) / 5, 'top', 32);
  for (const s of [-1, 1])
    p.line([
      [x + s * r, y, z],
      [x, y, z + s * r],
    ]);
}
