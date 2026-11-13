import type { Camera } from './camera';
import { box } from './draw';
import { cloud, cyl, lines, tones } from './platform-draw';

export { lines };

/** The parts of the platform figure (`platform-links.ts`): racks, app windows, a firewall,
 *  the cloud, a database, a desk with two monitors, and a workstation, each with the cable
 *  that joins it to what is already there. Drawn in hairline isometric; `up` lifts a part
 *  while it lands or leaves. */

export type V = readonly [number, number, number];
type Kind = 'rack' | 'wall' | 'db' | 'desk' | 'tower' | 'app' | 'cloud';
export interface Part {
  kind: Kind;
  at: readonly [number, number, number, number, number, number]; // x0 z0 x1 z1 y0 y1
  link: readonly V[];
  name: string;
}

export const PARTS: readonly Part[] = [
  { kind: 'rack', at: [5, 0.6, 6.4, 2, 0, 4.2], link: [], name: 'rack a' },
  {
    kind: 'rack',
    at: [7.2, 0.6, 8.6, 2, 0, 4.2],
    link: [
      [6.4, 0, 1.3],
      [7.2, 0, 1.3],
    ],
    name: 'rack b',
  },
  {
    kind: 'app',
    at: [4.9, 1.25, 6.5, 1.35, 5.1, 6.3],
    link: [
      [5.7, 4.2, 1.3],
      [5.7, 5.1, 1.3],
    ],
    name: 'app',
  },
  {
    kind: 'app',
    at: [7.1, 1.25, 8.7, 1.35, 5.4, 6.6],
    link: [
      [7.9, 4.2, 1.3],
      [7.9, 5.4, 1.3],
    ],
    name: 'api',
  },
  {
    kind: 'wall',
    at: [1, 1, 3, 1.6, 0, 2.2],
    link: [
      [3, 0, 1.3],
      [5, 0, 1.3],
    ],
    name: 'firewall',
  },
  {
    kind: 'cloud',
    at: [2, 1.3, 2, 1.3, 5.6, 6.6],
    link: [
      [2, 2.2, 1.3],
      [2, 5.6, 1.3],
    ],
    name: 'cloud',
  },
  {
    kind: 'db',
    at: [10.1, 1.3, 11.9, 3.1, 0, 2.4],
    link: [
      [8.6, 0, 1.3],
      [9.4, 0, 1.3],
      [9.4, 0, 2.2],
      [10.1, 0, 2.2],
    ],
    name: 'database',
  },
  {
    kind: 'desk',
    at: [2.5, 6, 7, 7.6, 0, 1.5],
    link: [
      [5.7, 0, 2],
      [5.7, 0, 6],
    ],
    name: 'desk',
  },
  {
    kind: 'tower',
    at: [8.6, 6.2, 9.4, 7.8, 0, 2.2],
    link: [
      [7.9, 0, 2],
      [7.9, 0, 4.5],
      [9, 0, 4.5],
      [9, 0, 6.2],
    ],
    name: 'workstation',
  },
];
export function part(ctx: CanvasRenderingContext2D, cam: Camera, p: Part, up: number, lit: boolean): void {
  const [x0, z0, x1, z1, b, top] = p.at;
  const [y0, y1] = [b + up, top + up];
  if (p.kind === 'cloud') return cloud(ctx, cam, x0, y0 + 0.3, z0);
  if (p.kind === 'db') {
    for (let i = 0; i < 3; i++) cyl(ctx, cam, (x0 + x1) / 2, (z0 + z1) / 2, 0.9, y0 + i * 0.8, y0 + i * 0.8 + 0.7);
    return;
  }
  if (p.kind === 'desk') {
    box(ctx, cam, x0, z0, x1, z1, y1 - 0.12, y1, tones(lit));
    lines(
      ctx,
      cam,
      [
        [x0 + 0.2, y0, z1 - 0.2, x0 + 0.2, y1 - 0.12, z1 - 0.2],
        [x1 - 0.2, y0, z1 - 0.2, x1 - 0.2, y1 - 0.12, z1 - 0.2],
      ],
      0.45,
    );
    for (const mx of [3, 5]) {
      box(ctx, cam, mx + 0.75, 6.5, mx + 1.05, 6.7, y1, y1 + 0.4, tones(false));
      box(ctx, cam, mx, 6.55, mx + 1.8, 6.68, y1 + 0.4, y1 + 1.55, tones(lit));
      const rows = [0.3, 0.5, 0.7, 0.9].map((r, k) => [
        mx + 0.2,
        y1 + 0.45 + r,
        6.69,
        mx + 0.6 + ((k * 5) % 9) * 0.12,
        y1 + 0.45 + r,
        6.69,
      ]);
      lines(ctx, cam, rows, 0.35);
    }
    box(ctx, cam, 3.6, 7, 5.9, 7.4, y1, y1 + 0.07, tones(false));
    return;
  }
  box(ctx, cam, x0, z0, x1, z1, y0, y1, tones(lit));
  const face: number[][] = [];
  if (p.kind === 'rack')
    for (let y = y0 + 0.35; y < y1 - 0.1; y += 0.42)
      face.push([x0 + 0.12, y, z1, x1 - 0.12, y, z1], [x0 + 0.2, y + 0.18, z1, x0 + 0.32, y + 0.18, z1]);
  if (p.kind === 'wall')
    for (let r = 0; r < 5; r++)
      face.push(
        [x0, y0 + r * 0.44, z1, x1, y0 + r * 0.44, z1],
        ...[0, 1, 2, 3].map((k) => [
          x0 + 0.25 + k * 0.5 + (r % 2) * 0.25,
          y0 + r * 0.44,
          z1,
          x0 + 0.25 + k * 0.5 + (r % 2) * 0.25,
          y0 + r * 0.44 + 0.44,
          z1,
        ]),
      );
  if (p.kind === 'tower')
    face.push([x0, y1 - 0.4, z1, x1, y1 - 0.4, z1], [x0 + 0.2, y1 - 0.7, z1, x0 + 0.5, y1 - 0.7, z1]);
  if (p.kind === 'app')
    face.push(
      [x0, y1 - 0.25, z1, x1, y1 - 0.25, z1],
      ...[0, 1, 2].map((k) => [
        x0 + 0.2 + (k % 2) * 0.2,
        y0 + 0.25 + k * 0.25,
        z1,
        x1 - 0.3 - k * 0.3,
        y0 + 0.25 + k * 0.25,
        z1,
      ]),
    );
  lines(ctx, cam, face, 0.32);
}
