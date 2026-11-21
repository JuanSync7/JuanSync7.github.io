import type { Sketch } from './monoline';
import { erlenmeyer, glass, jar } from './labware';

/** The lab room's shell and its fridge (`lab-room`). Metres; y up; the back wall's face is z = 0
 *  and the left wall's x = 0, so everything stands in x > 0, z > 0. The bench top is at `TOP`. */

export const ROOM = { w: 6.45, d: 3.0, h: 2.8, t: 0.12 };
export const TOP = 0.92;

export function shell(k: Sketch): void {
  const { w, d, h, t } = ROOM;
  k.object('room', () => {
    k.box(-t, -t, -t, w, 0, d);
    k.box(-t, 0, -t, w, h, 0);
    k.box(-t, 0, 0, 0, h, d);
    // Floor tiles, and the skirting along both walls.
    for (let x = 0.6; x < w; x += 0.6) k.line([[x, 0.001, 0], [x, 0.001, d]], 'faint'); // prettier-ignore
    for (let z = 0.6; z < d; z += 0.6) k.line([[0, 0.001, z], [w, 0.001, z]], 'faint'); // prettier-ignore
    k.line([[0, 0.1, 0.001], [w, 0.1, 0.001]], 'faint'); // prettier-ignore
    k.line([[0.001, 0.1, 0], [0.001, 0.1, d]], 'faint'); // prettier-ignore
  });
}

/** A glass-door lab fridge in the back corner: a hollow cabinet you can see into, its shelves
 *  stocked with bottles, a flask, a stack of plates and sample boxes. */
export function fridge(k: Sketch): void {
  const [x0, x1, z0, z1] = [0.1, 0.8, 0.06, 0.74];
  const [s, f, dz] = [0.035, 0.055, 0.035];
  k.object('fridge', () => {
    k.box(x0, 0, z0, x1, 0.12, z1 + dz);
    k.box(x0, 1.8, z0, x1, 1.88, z1 + dz);
    k.box(x0, 0.12, z0, x0 + s, 1.8, z1);
    k.box(x1 - s, 0.12, z0, x1, 1.8, z1);
    k.box(x0 + s, 0.12, z0, x1 - s, 1.8, z0 + s);
    // The door: a frame round a pane of glass, and its handle.
    k.box(x0, 0.12, z1, x0 + f, 1.8, z1 + dz);
    k.box(x1 - f, 0.12, z1, x1, 1.8, z1 + dz);
    k.box(x0 + f, 0.12, z1, x1 - f, 0.12 + f, z1 + dz);
    k.box(x0 + f, 1.8 - f, z1, x1 - f, 1.8, z1 + dz);
    const g = z1 + dz / 2;
    k.line([[0.2, 1.62, g], [0.3, 1.72, g]], 'faint'); // prettier-ignore
    k.line([[0.24, 1.5, g], [0.4, 1.66, g]], 'faint'); // prettier-ignore
    const hz = z1 + dz;
    k.box(0.765, 0.82, hz, 0.78, 0.84, hz + 0.03);
    k.box(0.765, 1.3, hz, 0.78, 1.32, hz + 0.03);
    k.box(0.765, 0.82, hz + 0.03, 0.78, 1.32, hz + 0.042);
    // The control strip and the kick vent.
    k.rect('z', hz + 0.001, 0.56, 1.82, 0.74, 1.86);
    for (let x = 0.2; x < 0.7; x += 0.05) k.line([[x, 0.03, hz + 0.001], [x, 0.09, hz + 0.001]], 'faint'); // prettier-ignore
    for (const y of [0.56, 0.98, 1.4]) k.box(x0 + s, y, z0 + s, x1 - s, y + 0.012, z1 - 0.01, { tier: 'soft' });
  });
  k.object('fridge stock', () => {
    jar(k, 0.3, 0.12, 0.42, 0.07, 0.3);
    jar(k, 0.56, 0.12, 0.44, 0.065, 0.26);
    for (const x of [0.22, 0.33]) jar(k, x, 0.572, 0.5, 0.042, 0.16);
    k.box(0.44, 0.572, 0.34, 0.72, 0.62, 0.5, { tier: 'soft' });
    for (let x = 0.47; x < 0.71; x += 0.04) glass(k, x, 0.62, 0.42, [[0, 0], [0.012, 0], [0.012, 0.11], [0, 0.11]], 0.6); // prettier-ignore
    for (let i = 0; i < 6; i++) k.cyl(0.3, 0.992 + i * 0.016, 0.45, 0.048, 0.015, { tier: 'soft' });
    glass(k, 0.56, 0.992, 0.42, erlenmeyer(0.07, 0.19), 0.35);
    k.box(0.17, 1.412, 0.28, 0.43, 1.49, 0.6);
    k.box(0.19, 1.49, 0.3, 0.41, 1.56, 0.58);
    for (const x of [0.54, 0.66]) jar(k, x, 1.412, 0.46, 0.04, 0.14, false);
  });
}
