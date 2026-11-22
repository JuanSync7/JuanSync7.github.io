import type { Sketch, V3 } from './drawing/monoline';

/** The self-hosted model's machine in the gateway scene (`kit/expgate.ts`): a workstation tower
 *  built as a case is, so it reads as a computer and not a box with circles on it. A frame of
 *  panels on feet, a glass side with the inside seen through it (two GPU cards, the CPU's tower
 *  cooler, four memory sticks, the rear exhaust fan, the PSU shroud), a mesh front with the power
 *  button and ports, and the top's exhaust grille. Its front faces +x, its window +z. */

export const TOWER = { x0: 2.0, x1: 2.46, z0: 1.76, z1: 1.98, h: 0.52 };
/** Where a cable plugs in: the front I/O, low on the mesh. */
export const TOWER_PORT: V3 = [TOWER.x1, 0.05, 1.87];

export function tower(k: Sketch): void {
  const { x0, x1, z0, z1, h } = TOWER;
  const [zi0, zi1] = [z0 + 0.012, z1 - 0.012];
  k.object('gpu-tower', () => {
    for (const x of [x0 + 0.02, x1 - 0.06])
      for (const z of [z0 + 0.01, z1 - 0.04]) k.box(x, 0, z, x + 0.04, 0.02, z + 0.03);
    k.box(x0, 0.02, z0, x1, 0.035, z1);
    k.box(x0, h - 0.015, z0, x1, h, z1);
    k.box(x0, 0.035, z0, x0 + 0.015, h - 0.015, z1);
    k.box(x0 + 0.015, 0.035, z0, x1 - 0.02, h - 0.015, zi0);
    k.box(x1 - 0.02, 0.035, z0, x1, h - 0.015, z1);
    // The glass side: a frame round an opening, the pane drawn by its outline only.
    k.box(x0 + 0.015, h - 0.06, zi1, x1 - 0.02, h - 0.015, z1);
    k.box(x0 + 0.015, 0.035, zi1, x1 - 0.02, 0.12, z1);
    k.box(x0 + 0.015, 0.12, zi1, x0 + 0.05, h - 0.06, z1);
    k.box(x1 - 0.06, 0.12, zi1, x1 - 0.02, h - 0.06, z1);
    k.rect('z', z1 - 0.004, x0 + 0.05, 0.12, x1 - 0.06, h - 0.06, 'faint');
    inside(k, zi0, zi1);
    // The mesh front, its power button and two ports; the top's grille.
    for (let i = 0; i < 9; i++) k.line([[x1 + 0.001, 0.07, z0 + 0.03 + i * 0.02], [x1 + 0.001, h - 0.11, z0 + 0.03 + i * 0.02]], 'faint'); // prettier-ignore
    k.circle([x1 + 0.001, h - 0.05, z1 - 0.05], 0.013, 'x', 'soft', 14);
    for (const z of [z0 + 0.04, z0 + 0.07]) k.rect('x', x1 + 0.001, h - 0.06, z, h - 0.045, z + 0.02, 'soft');
    k.rect('y', h + 0.001, x0 + 0.06, z0 + 0.03, x1 - 0.12, z1 - 0.03, 'soft');
    for (let i = 1; i < 7; i++) k.line([[x0 + 0.06 + i * 0.04, h + 0.001, z0 + 0.03], [x0 + 0.06 + i * 0.04, h + 0.001, z1 - 0.03]], 'faint'); // prettier-ignore
  });
}

/** What the glass shows. */
function inside(k: Sketch, zi0: number, zi1: number): void {
  const { x0, x1, h } = TOWER;
  k.box(x0 + 0.05, 0.14, zi0, x1 - 0.1, h - 0.05, zi0 + 0.006, { tier: 'faint' });
  k.box(x0 + 0.015, 0.035, zi0, x1 - 0.02, 0.12, zi1 - 0.03);
  // Two GPU cards in the lower slots, each with its shroud's outline on the edge it shows.
  for (const y of [0.15, 0.225]) {
    k.box(x0 + 0.05, y, zi0 + 0.006, x1 - 0.08, y + 0.055, zi0 + 0.13);
    k.rect('z', zi0 + 0.131, x0 + 0.07, y + 0.012, x1 - 0.1, y + 0.043, 'soft');
  }
  // The CPU's tower cooler and its fins, the memory beside it.
  k.box(2.2, 0.33, zi0 + 0.006, 2.28, 0.44, zi0 + 0.12);
  for (let i = 1; i < 9; i++) k.line([[2.2, 0.33 + i * 0.0122, zi0 + 0.121], [2.28, 0.33 + i * 0.0122, zi0 + 0.121]], 'faint'); // prettier-ignore
  for (let i = 0; i < 4; i++) k.box(2.31 + i * 0.014, 0.33, zi0 + 0.006, 2.318 + i * 0.014, 0.44, zi0 + 0.035);
  // The rear exhaust fan: frame, rotor and blades.
  const [fx, fy, fz] = [x0 + 0.015, 0.39, (zi0 + zi1) / 2 - 0.01];
  k.box(fx, fy - 0.06, fz - 0.06, fx + 0.025, fy + 0.06, fz + 0.06);
  k.circle([fx + 0.026, fy, fz], 0.052, 'x', 'soft', 24);
  k.circle([fx + 0.026, fy, fz], 0.016, 'x', 'soft', 12);
  for (let a = 0; a < 5; a++) {
    const t = (a * 2 * Math.PI) / 5;
    k.line([[fx + 0.026, fy + 0.016 * Math.sin(t), fz + 0.016 * Math.cos(t)], [fx + 0.026, fy + 0.048 * Math.sin(t + 0.6), fz + 0.048 * Math.cos(t + 0.6)]], 'faint'); // prettier-ignore
  }
}
