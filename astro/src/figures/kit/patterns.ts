import type { Noise2 } from './noise';
/** Line patterns drawn as polylines in a card's own coordinates (u across [-1, 1], v up
 *  [-0.5, 0.5]): Truchet tiles, moiré, flow lines, an L-system plant, a Hilbert curve, nested
 *  squares, waves and a dot field. Pattern cards draws them; any figure that needs a drawn
 *  texture on a surface can. */

export const MOTIFS = ['truchet', 'moire', 'flow', 'plant', 'hilbert', 'squares', 'waves', 'dots'] as const;
export type Motif = (typeof MOTIFS)[number];

export type Pen = (pts: readonly (readonly [number, number])[]) => void;

/** One motif drawn as polylines in card coordinates: u across [-1, 1], v up [-0.5, 0.5]. */
export function motif(m: Motif, pen: Pen, seed: number, noise: Noise2): void {
  const r = (k: number): number => Math.abs(Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453) % 1;
  const arc = (cx: number, cy: number, rad: number, a0: number, a1: number): [number, number][] =>
    Array.from({ length: 9 }, (_, i) => [
      cx + Math.cos(a0 + ((a1 - a0) * i) / 8) * rad,
      cy + Math.sin(a0 + ((a1 - a0) * i) / 8) * rad,
    ]);
  if (m === 'truchet') {
    const s = 0.2;
    for (let i = 0; i < 9; i++)
      for (let j = 0; j < 4; j++) {
        const x = -0.9 + i * s;
        const y = -0.4 + j * s;
        if (r(i * 7 + j) < 0.5) {
          pen(arc(x, y, s / 2, 0, Math.PI / 2));
          pen(arc(x + s, y + s, s / 2, Math.PI, Math.PI * 1.5));
        } else {
          pen(arc(x + s, y, s / 2, Math.PI / 2, Math.PI));
          pen(arc(x, y + s, s / 2, -Math.PI / 2, 0));
        }
      }
  } else if (m === 'moire') {
    for (let k = 1; k < 14; k++) {
      pen(arc(-0.15, 0, k * 0.06, 0, Math.PI * 2).map(([x, y]) => [x, y * 0.9] as const));
      pen(arc(0.15 + r(1) * 0.1, 0.05, k * 0.06, 0, Math.PI * 2).map(([x, y]) => [x, y * 0.9] as const));
    }
  } else if (m === 'flow') {
    for (let k = 0; k < 40; k++) {
      let x = -0.95 + r(k) * 1.9;
      let y = -0.45 + r(k + 50) * 0.9;
      const pts: [number, number][] = [];
      // A flow line ends where it leaves the card, so no stroke runs past the edge.
      for (let i = 0; i < 12 && Math.abs(x) < 0.97 && Math.abs(y) < 0.49; i++) {
        pts.push([x, y]);
        const a = noise(x * 2 + seed, y * 2) * Math.PI * 2;
        x += Math.cos(a) * 0.04;
        y += Math.sin(a) * 0.04;
      }
      pen(pts);
    }
  } else if (m === 'plant') {
    const grow = (x: number, y: number, a: number, len: number, depth: number): void => {
      const x2 = x + Math.cos(a) * len;
      const y2 = y + Math.sin(a) * len;
      pen([
        [x, y],
        [x2, y2],
      ]);
      if (depth > 0)
        for (const d of [-0.45 - r(depth) * 0.2, 0.4 + r(depth + 9) * 0.2]) grow(x2, y2, a + d, len * 0.72, depth - 1);
    };
    grow(0, -0.48, Math.PI / 2, 0.24, 6);
  } else if (m === 'hilbert') {
    const pts: [number, number][] = [];
    const n = 16;
    for (let d = 0; d < n * n; d++) {
      let x = 0;
      let y = 0;
      let t = d;
      for (let s = 1; s < n; s *= 2) {
        const rx = 1 & (t / 2);
        const ry = 1 & (t ^ rx);
        if (ry === 0) {
          if (rx === 1) [x, y] = [s - 1 - x, s - 1 - y];
          [x, y] = [y, x];
        }
        x += s * rx;
        y += s * ry;
        t = Math.floor(t / 4);
      }
      pts.push([-0.45 + (x / (n - 1)) * 0.9, -0.45 + (y / (n - 1)) * 0.9]);
    }
    pen(pts);
  } else if (m === 'squares') {
    for (let k = 1; k < 10; k++) {
      const s = k * 0.05;
      const a = k * 0.12 * (r(2) < 0.5 ? 1 : -1);
      pen(
        [0, 1, 2, 3, 4].map(
          (i) =>
            [
              Math.cos(a + (i * Math.PI) / 2 + Math.PI / 4) * s * 1.4,
              Math.sin(a + (i * Math.PI) / 2 + Math.PI / 4) * s * 1.4,
            ] as const,
        ),
      );
    }
  } else if (m === 'waves') {
    for (let k = 0; k < 9; k++)
      pen(
        Array.from(
          { length: 41 },
          (_, i) => [-0.9 + i * 0.045, -0.38 + k * 0.095 + Math.sin(i * 0.35 + k * r(3) * 2) * 0.03] as const,
        ),
      );
  } else {
    for (let i = 0; i < 18; i++)
      for (let j = 0; j < 9; j++) {
        const x = -0.9 + i * 0.105;
        const y = -0.42 + j * 0.105;
        const s = 0.008 + Math.abs(noise(x * 2 + seed, y * 2)) * 0.03;
        pen([
          [x - s, y],
          [x + s, y],
        ]);
      }
  }
}
