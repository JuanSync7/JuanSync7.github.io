import { Matrix4 } from 'three';
import type { Sketch, V3 } from './monoline';
import { TOP } from './labshell';

/** The long bench on the back wall: cabinets of drawers and doors either side of a knee space, an
 *  upstand with sockets and a gas tap; and the computer at its left end (a tower with its side off,
 *  showing its parts, a monitor, keyboard and mouse) with an open notebook and pen beside it. */

const [BX0, BX1] = [0.95, 5.25];
const FZ = 0.7;
/** The monitor's view of the plate: its centre and radius on the screen (z is the glass). */
export const SCREEN = { x: 1.43, y: 1.25, z: 0.1915, r: 0.14 };

export function bench(k: Sketch): void {
  k.object('bench', () => {
    k.box(BX0, 0.88, 0, BX1, TOP, 0.76);
    k.box(BX0, TOP, 0, BX1, TOP + 0.1, 0.02);
    for (const [a, b] of [[0.98, 2.42], [3.58, 5.22]]) { k.box(a ?? 0, 0.08, 0.02, b ?? 0, 0.88, FZ); k.box((a ?? 0) + 0.02, 0, 0.02, (b ?? 0) - 0.02, 0.08, FZ - 0.06); } // prettier-ignore
    const z = FZ + 0.001;
    const pull = (x: number, y: number): void => k.box(x - 0.06, y - 0.008, FZ, x + 0.06, y + 0.008, FZ + 0.016);
    // Left: a column of drawers and a door.
    [
      [0.7, 0.86],
      [0.52, 0.68],
      [0.3, 0.5],
      [0.1, 0.28],
    ].forEach(([y0 = 0, y1 = 0]) => {
      k.rect('z', z, 1.0, y0, 1.7, y1);
      pull(1.35, y1 - 0.05);
    });
    k.rect('z', z, 1.72, 0.1, 2.4, 0.86);
    k.box(1.76, 0.6, FZ, 1.776, 0.72, FZ + 0.016);
    // Right: two drawers over two doors.
    for (const [x0, x1] of [
      [3.6, 4.4],
      [4.42, 5.2],
    ]) {
      k.rect('z', z, x0 ?? 0, 0.7, x1 ?? 0, 0.86);
      k.rect('z', z, x0 ?? 0, 0.1, x1 ?? 0, 0.68);
      pull(((x0 ?? 0) + (x1 ?? 0)) / 2, 0.81);
    }
    k.box(4.36, 0.5, FZ, 4.376, 0.62, FZ + 0.016);
    k.box(4.444, 0.5, FZ, 4.46, 0.62, FZ + 0.016);
    // Sockets on the upstand.
    for (const x of [1.62, 1.74, 4.84]) {
      k.rect('z', 0.021, x - 0.05, TOP + 0.02, x + 0.05, TOP + 0.085);
      k.line([[x - 0.015, TOP + 0.06, 0.021], [x - 0.015, TOP + 0.045, 0.021]]); // prettier-ignore
      k.line([[x + 0.015, TOP + 0.06, 0.021], [x + 0.015, TOP + 0.045, 0.021]]); // prettier-ignore
    }
  });
}

/** A tower with its side panel off: the board, the cooler, memory, the graphics card, a fan. */
export function computer(k: Sketch): void {
  const [x0, x1, z0, z1, h] = [1.0, 1.22, 0.1, 0.58, 0.44];
  const y0 = TOP;
  k.object('tower', () => {
    k.box(x0, y0, z0, x0 + 0.012, y0 + h, z1);
    k.box(x0, y0, z0, x1, y0 + 0.012, z1);
    k.box(x0, y0 + h - 0.012, z0, x1, y0 + h, z1);
    k.box(x0, y0, z0, x1, y0 + h, z0 + 0.012);
    k.box(x0, y0, z1 - 0.02, x1, y0 + h, z1);
    for (let y = y0 + 0.06; y < y0 + h - 0.05; y += 0.03) k.line([[x0 + 0.03, y, z1 + 0.001], [x1 - 0.03, y, z1 + 0.001]], 'faint'); // prettier-ignore
    k.circle([x1 - 0.04, y0 + h - 0.035, z1 + 0.001], 0.01, 'z', 'soft', 12);
    // Inside, on the left panel: the board and what sits on it.
    k.box(x0 + 0.012, y0 + 0.12, z0 + 0.04, x0 + 0.02, y0 + h - 0.03, z1 - 0.06, { tier: 'soft' });
    k.box(x0 + 0.02, y0 + 0.27, z0 + 0.2, x0 + 0.11, y0 + 0.36, z0 + 0.3);
    for (let y = y0 + 0.28; y < y0 + 0.36; y += 0.012) k.line([[x0 + 0.111, y, z0 + 0.2], [x0 + 0.111, y, z0 + 0.3]], 'faint'); // prettier-ignore
    for (let i = 0; i < 4; i++)
      k.box(x0 + 0.02, y0 + 0.24, z0 + 0.32 + i * 0.016, x0 + 0.06, y0 + 0.38, z0 + 0.327 + i * 0.016);
    k.box(x0 + 0.02, y0 + 0.17, z0 + 0.05, x0 + 0.17, y0 + 0.21, z1 - 0.05);
    for (const z of [z0 + 0.14, z0 + 0.3]) k.circle([x0 + 0.171, y0 + 0.19, z], 0.016, 'x', 'soft', 16);
    k.box(x0 + 0.012, y0 + 0.012, z0 + 0.012, x1, y0 + 0.1, z1 - 0.02);
    k.circle([x0 + 0.1, y0 + 0.3, z0 + 0.013], 0.05, 'z', 'soft');
    k.circle([x0 + 0.1, y0 + 0.3, z0 + 0.013], 0.015, 'z', 'faint', 12);
  });
  k.object('monitor', () => {
    k.box(1.46, TOP, 0.1, 1.76, TOP + 0.014, 0.28);
    k.box(1.595, TOP + 0.014, 0.12, 1.625, 1.22, 0.15);
    k.box(1.58, 1.16, 0.15, 1.64, 1.24, 0.16);
    k.box(1.24, 1.06, 0.16, 1.98, 1.44, 0.19);
    k.rect('z', 0.191, 1.26, 1.08, 1.96, 1.42);
    // The microscope's camera: the plate, magnified, on the left; the growth curve's frame on the
    // right. The colonies and the curve are drawn into them (`labculture.ts`).
    k.circle([SCREEN.x, SCREEN.y, 0.191], SCREEN.r, 'z', 'soft', 48);
    k.line([[SCREEN.x - 0.15, SCREEN.y, 0.191], [SCREEN.x - 0.13, SCREEN.y, 0.191]], 'faint'); // prettier-ignore
    k.line([[SCREEN.x + 0.13, SCREEN.y, 0.191], [SCREEN.x + 0.15, SCREEN.y, 0.191]], 'faint'); // prettier-ignore
    k.line([[1.64, 1.39, 0.191], [1.64, 1.11, 0.191], [1.94, 1.11, 0.191]], 'soft'); // prettier-ignore
    for (let y = 1.17; y < 1.39; y += 0.06) k.line([[1.64, y, 0.191], [1.94, y, 0.191]], 'faint'); // prettier-ignore
  });
  k.object('keyboard', () => {
    k.box(1.32, TOP, 0.4, 1.78, TOP + 0.022, 0.55);
    const y = TOP + 0.0225;
    for (let r = 0; r <= 5; r++) k.line([[1.335, y, 0.41 + r * 0.026], [1.765, y, 0.41 + r * 0.026]], 'faint'); // prettier-ignore
    for (let c = 0; c <= 16; c++) k.line([[1.335 + c * 0.0269, y, 0.41], [1.335 + c * 0.0269, y, 0.54]], 'faint'); // prettier-ignore
  });
  k.object('mouse', () => {
    k.box(1.84, TOP, 0.36, 2.06, TOP + 0.003, 0.58, { tier: 'soft' });
    k.frame(scaleZ(1.0, 1.7, 1.95, 0.47), () => k.lathe(1.95, TOP + 0.003, 0.47, [[0, 0], [0.03, 0], [0.032, 0.012], [0.024, 0.03], [0, 0.036]])); // prettier-ignore
  });
}

/** Stretches by `s` along z about (x, z): an oval from a round profile. */
const scaleZ = (sx: number, sz: number, x: number, z: number): Matrix4 =>
  new Matrix4()
    .makeTranslation(x, 0, z)
    .multiply(new Matrix4().makeScale(sx, 1, sz))
    .multiply(new Matrix4().makeTranslation(-x, 0, -z));

/** An open notebook with ruled pages, a few lines of writing, and a pen across it. */
export function notebook(k: Sketch): void {
  k.object('notebook', () => {
    const y = TOP + 0.012;
    k.box(2.12, TOP, 0.34, 2.31, y, 0.62);
    k.box(2.31, TOP, 0.34, 2.5, y, 0.62);
    for (let z = 0.38; z < 0.6; z += 0.022) {
      k.line([[2.135, y + 0.0005, z], [2.295, y + 0.0005, z]], 'faint'); // prettier-ignore
      k.line([[2.325, y + 0.0005, z], [2.485, y + 0.0005, z]], 'faint'); // prettier-ignore
    }
    const hand = (z: number, x0: number, x1: number): V3[] =>
      Array.from({ length: 14 }, (_, i): V3 => [x0 + ((x1 - x0) * i) / 13, y + 0.0006, z - 0.006 - (i % 2) * 0.007]);
    for (const [z, x1] of [[0.402, 2.28], [0.424, 2.25], [0.446, 2.27], [0.49, 2.22]]) k.line(hand(z ?? 0, 2.14, x1 ?? 0), 'soft'); // prettier-ignore
  });
  k.object('pen', () => {
    k.at([2.42, TOP + 0.012 + 0.0045, 0.48], -0.9, () => {
      k.cyl(0, -0.07, 0, 0.0045, 0.12);
      k.cyl(0, 0.05, 0, 0.0045, 0.02, { r2: 0.001 });
      k.box(-0.006, -0.06, -0.0015, -0.0045, -0.03, 0.0015);
    }, 0, Math.PI / 2); // prettier-ignore
  });
}
