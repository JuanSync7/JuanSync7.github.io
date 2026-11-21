import { Matrix4 } from 'three';
import type { Sketch, V3 } from './drawing/monoline';
import { jar } from './labware';

/** The back wall over the bench: a shelf of reagent bottles, a painting of hills, the periodic
 *  table (its true shape: 18 groups, 7 periods, the f-block set below), a clock, and an exhaust
 *  fan whose rotor turns. */

export const ROTOR: V3 = [5.85, 2.24, 0.04];
const turnY = -Math.PI / 2;

export function wall(k: Sketch): void {
  k.object('shelf', () => {
    k.box(1.0, 1.56, 0, 2.5, 1.585, 0.24);
    for (const x of [1.1, 2.4])
      k.at([x, 0, 0], turnY, () => k.slab([[0, 1.56], [0.2, 1.56], [0, 1.4]], -0.008, 0.008)); // prettier-ignore
  });
  k.object('bottles', () => {
    [0.045, 0.04, 0.04, 0.035, 0.045].forEach((r, i) => jar(k, 1.12 + i * 0.12, 1.585, 0.13, r, 0.12 + (i % 3) * 0.03));
    k.box(1.78, 1.585, 0.05, 2.0, 1.7, 0.2);
    k.box(2.08, 1.585, 0.06, 2.42, 1.63, 0.2, { tier: 'soft' });
  });
  k.object('painting', () => {
    const [x0, x1, y0, y1, d] = [1.3, 2.15, 1.95, 2.62, 0.03];
    k.box(x0, y0, 0, x1, y0 + 0.04, d);
    k.box(x0, y1 - 0.04, 0, x1, y1, d);
    k.box(x0, y0 + 0.04, 0, x0 + 0.04, y1 - 0.04, d);
    k.box(x1 - 0.04, y0 + 0.04, 0, x1, y1 - 0.04, d);
    k.box(x0 + 0.04, y0 + 0.04, 0, x1 - 0.04, y1 - 0.04, 0.012, { tier: 'soft' });
    const z = 0.0125;
    k.rect('z', z, x0 + 0.08, y0 + 0.08, x1 - 0.08, y1 - 0.08, 'faint');
    const ridge = (y: number, amp: number, ph: number): V3[] =>
      Array.from({ length: 30 }, (_, i): V3 => {
        const x = x0 + 0.1 + (i / 29) * (x1 - x0 - 0.2);
        return [x, y + amp * Math.abs(Math.sin(i * 0.37 + ph)) * (0.6 + 0.4 * Math.sin(i * 0.11)), z];
      });
    k.line(ridge(y0 + 0.2, 0.16, 0.4), 'soft');
    k.line(ridge(y0 + 0.13, 0.09, 2.1), 'soft');
    k.line(ridge(y0 + 0.1, 0.04, 1.2), 'faint');
    k.circle([x1 - 0.22, y1 - 0.18, z], 0.045, 'z', 'soft');
  });
  table(k);
  k.object('clock', () => {
    k.at([5.05, 2.25, 0], 0, () => k.cyl(0, 0, 0, 0.14, 0.035), Math.PI / 2);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const [s, c] = [Math.sin(a), Math.cos(a)];
      k.line([[5.05 + s * 0.11, 2.25 + c * 0.11, 0.036], [5.05 + s * 0.125, 2.25 + c * 0.125, 0.036]]); // prettier-ignore
    }
    k.line([[5.05, 2.25, 0.036], [5.1, 2.29, 0.036]], 'edge'); // prettier-ignore
    k.line([[5.05, 2.25, 0.036], [5.05, 2.35, 0.036]], 'edge'); // prettier-ignore
  });
  fan(k);
}

/** The periodic table as cells on a poster: periods 1 to 7 and the lanthanide and actinide rows. */
function table(k: Sketch): void {
  k.object('periodic table', () => {
    const [x0, y0, x1, y1] = [2.7, 1.4, 4.72, 2.64];
    k.box(x0, y0, 0, x1, y1, 0.008, { tier: 'soft' });
    const [w, h, z] = [0.104, 0.1, 0.0085];
    const cell = (c: number, row: number, dx = 0): void => {
      const x = x0 + 0.075 + dx + c * w;
      const y = y1 - 0.1 - row * h;
      k.rect('z', z, x, y - h + 0.008, x + w - 0.008, y, 'soft');
    };
    for (let p = 0; p < 7; p++)
      for (let c = 0; c < 18; c++) {
        const on = p === 0 ? c === 0 || c === 17 : p < 3 ? c < 2 || c > 11 : true;
        if (on) cell(c, p);
      }
    for (let r = 0; r < 2; r++) for (let c = 0; c < 15; c++) cell(c, 7.35 + r, w * 2.5);
    k.line([[x0 + 0.075, y1 - 0.05, z], [x1 - 0.075, y1 - 0.05, z]], 'faint'); // prettier-ignore
  });
}

/** A square exhaust fan in the wall: frame, shroud and guard stay; the rotor turns. */
function fan(k: Sketch): void {
  const [cx, cy] = [ROTOR[0], ROTOR[1]];
  const [o, i] = [0.4, 0.33];
  k.object('fan', () => {
    k.box(cx - o, cy - o, 0, cx + o, cy - i, 0.07);
    k.box(cx - o, cy + i, 0, cx + o, cy + o, 0.07);
    k.box(cx - o, cy - i, 0, cx - i, cy + i, 0.07);
    k.box(cx + i, cy - i, 0, cx + o, cy + i, 0.07);
    k.circle([cx, cy, 0.0005], 0.32, 'z', 'faint', 48);
    for (const r of [0.1, 0.2, 0.325]) k.circle([cx, cy, 0.072], r, 'z', 'soft', 48);
    for (let a = 0; a < 4; a++)
      k.line([[cx, cy, 0.072], [cx + Math.cos(a * 1.571 + 0.4) * 0.325, cy + Math.sin(a * 1.571 + 0.4) * 0.325, 0.072]]); // prettier-ignore
  });
  k.moving('rotor', ROTOR, () => {
    k.at([0, 0, -0.02], 0, () => k.cyl(0, 0, 0, 0.05, 0.04), Math.PI / 2);
    const blade: [number, number][] = [[0.045, -0.03], [0.18, -0.09], [0.29, -0.05], [0.3, 0.04], [0.18, 0.07], [0.045, 0.03]]; // prettier-ignore
    for (let b = 0; b < 5; b++) k.frame(rotZ((b / 5) * Math.PI * 2), () => k.slab(blade, -0.003, 0.003));
  });
}

const rotZ = (a: number): Matrix4 => new Matrix4().makeRotationZ(a);
