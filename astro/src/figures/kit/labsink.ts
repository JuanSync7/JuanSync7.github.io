import type { Sketch, V3 } from './monoline';
import { beaker, erlenmeyer, testTube } from './labware';

/** The wash side of the lab, along the left wall (x = 0): a sink unit with a gooseneck tap, an
 *  eyewash and a soap pump, a pegboard drying rack of glassware above it, a glove dispenser, a
 *  safety shower over the end. */

const CT = 0.92;
const turnX = -Math.PI / 2;

export function sink(k: Sketch): void {
  const [z0, z1, d] = [1.05, 2.45, 0.66];
  k.object('sink', () => {
    k.box(0, 0, z0 + 0.02, d - 0.1, 0.08, z1 - 0.02);
    k.box(0, 0.08, z0, d - 0.06, 0.68, z1);
    k.box(d - 0.1, 0.68, z0, d - 0.06, 0.88, z1);
    for (const z of [z0, z1 - 0.04]) k.box(0, 0.68, z, d - 0.1, 0.88, z + 0.04);
    // The top, round a basin let into it.
    k.box(0, 0.88, z0, 0.12, CT, z1);
    k.box(0.52, 0.88, z0, d, CT, z1);
    k.box(0.12, 0.88, z0, 0.52, CT, 1.45);
    k.box(0.12, 0.88, 2.05, 0.52, CT, z1);
    k.box(0.12, 0.7, 1.45, 0.52, 0.72, 2.05);
    k.box(0.12, 0.72, 1.45, 0.13, 0.88, 2.05);
    k.box(0.51, 0.72, 1.45, 0.52, 0.88, 2.05);
    k.box(0.13, 0.72, 1.45, 0.51, 0.88, 1.46);
    k.box(0.13, 0.72, 2.04, 0.51, 0.88, 2.05);
    k.circle([0.32, 0.721, 1.75], 0.025, 'y', 'soft');
    // Doors and knobs on the front (x = d - 0.06).
    const fx = d - 0.06 + 0.001;
    for (const [a, b] of [[z0 + 0.03, 1.73], [1.77, z1 - 0.03]]) k.rect('x', fx, 0.12, a ?? 0, 0.64, b ?? 0); // prettier-ignore
    for (const z of [1.69, 1.81]) k.box(fx, 0.55, z - 0.01, fx + 0.02, 0.57, z + 0.01);
    // The gooseneck tap and its lever.
    k.cyl(0.06, CT, 1.75, 0.026, 0.06);
    k.tube([[0.06, 0.97, 1.75], [0.06, 1.2, 1.75], [0.12, 1.28, 1.75], [0.24, 1.27, 1.75], [0.31, 1.16, 1.75], [0.31, 1.1, 1.75]], 0.012); // prettier-ignore
    k.box(0.03, 1.0, 1.78, 0.045, 1.012, 1.88);
  });
  k.object('eyewash', () => {
    k.cyl(0.07, CT, 1.25, 0.014, 0.12);
    k.tube(
      [
        [0.07, 1.04, 1.25],
        [0.3, 1.04, 1.25],
      ],
      0.011,
      { sharp: true },
    );
    k.tube(
      [
        [0.3, 1.04, 1.16],
        [0.3, 1.04, 1.34],
      ],
      0.011,
      { sharp: true },
    );
    for (const z of [1.16, 1.34]) k.lathe(0.3, 1.045, z, [[0, 0], [0.012, 0], [0.04, 0.035], [0.036, 0.035], [0, 0.012]]); // prettier-ignore
    k.box(0.36, 0.99, 1.2, 0.37, 1.07, 1.3);
    k.tube(
      [
        [0.3, 1.04, 1.25],
        [0.365, 1.04, 1.25],
      ],
      0.006,
      { sharp: true },
    );
  });
  k.object('soap', () => {
    k.lathe(0.26, CT, 2.25, [[0, 0], [0.036, 0], [0.04, 0.02], [0.04, 0.13], [0.03, 0.15], [0.014, 0.155], [0, 0.155]]); // prettier-ignore
    k.cyl(0.26, CT + 0.155, 2.25, 0.006, 0.04);
    k.box(0.26, CT + 0.18, 2.244, 0.31, CT + 0.192, 2.256);
  });
}

/** A pegboard of drying glassware above the sink, a glove dispenser beside it. */
export function rack(k: Sketch): void {
  k.object('rack', () => {
    k.box(0, 1.38, 1.25, 0.018, 2.04, 2.1);
    k.box(0, 1.36, 1.25, 0.1, 1.39, 2.1);
    for (const y of [1.52, 1.7, 1.88])
      for (const z of [1.4, 1.6, 1.8, 2.0]) {
        k.at([0.018, y, z], 0, () => k.cyl(0, 0, 0, 0.005, 0.09), 0, -Math.PI / 2);
        k.circle([0.019, y, z], 0.009, 'x', 'faint', 12);
      }
    // Glassware hung mouth down on its pegs.
    const hang = (y: number, z: number, p: [number, number][]): void =>
      k.at(
        [0.075, y - 0.006, z],
        0,
        () => k.lathe(0, -Math.max(...p.map((q) => q[1])), 0, p, { fill: 'none' }),
        Math.PI,
      );
    hang(1.52, 1.6, erlenmeyer(0.05, 0.14));
    hang(1.7, 1.4, beaker(0.04, 0.1));
    hang(1.7, 2.0, erlenmeyer(0.045, 0.12));
    hang(1.88, 1.8, testTube(0.012, 0.13));
  });
  k.object('gloves', () => {
    k.box(0, 1.3, 2.1, 0.09, 1.5, 2.33);
    k.line(ellipse([0.091, 1.42, 2.215], 0.018, 0.06), 'soft');
    // A glove pulled half out of the slot.
    const hand: [number, number][] = [[-0.035, 0], [0.035, 0], [0.04, -0.07], [0.034, -0.12], [0.026, -0.12], [0.022, -0.08], [0.014, -0.13], [0.006, -0.13], [0.004, -0.085], [-0.004, -0.135], [-0.012, -0.135], [-0.013, -0.085], [-0.02, -0.125], [-0.028, -0.125], [-0.03, -0.075], [-0.05, -0.09], [-0.05, -0.075], [-0.04, -0.04]]; // prettier-ignore
    k.at([0.1, 1.425, 2.215], turnX, () => k.slab(hand, 0, 0.008, { tier: 'soft' }));
  });
}

const ellipse = (c: V3, ry: number, rz: number): V3[] =>
  Array.from(
    { length: 25 },
    (_, i): V3 => [c[0], c[1] + Math.sin((i / 24) * Math.PI * 2) * ry, c[2] + Math.cos((i / 24) * Math.PI * 2) * rz],
  );

/** The safety shower over the end of the sink: a pipe down the wall, its head and pull rod. */
export function shower(k: Sketch): void {
  k.object('shower', () => {
    k.tube(
      [
        [0.035, 2.8, 2.38],
        [0.035, 2.32, 2.38],
        [0.06, 2.28, 2.38],
        [0.42, 2.28, 2.38],
      ],
      0.016,
      { sharp: true },
    );
    for (const y of [2.7, 2.42]) k.box(0, y - 0.02, 2.35, 0.02, y + 0.02, 2.41);
    k.lathe(0.42, 2.12, 2.38, [[0.02, 0.15], [0.02, 0.13], [0.12, 0.02], [0.12, 0], [0.112, 0], [0.018, 0.12], [0, 0.12]]); // prettier-ignore
    k.tube(
      [
        [0.3, 2.264, 2.38],
        [0.3, 1.82, 2.38],
      ],
      0.004,
      { sharp: true },
    );
    k.tube(
      [
        [0.3, 1.82, 2.38],
        [0.26, 1.74, 2.38],
        [0.34, 1.74, 2.38],
        [0.3, 1.82, 2.38],
      ],
      0.005,
      { sharp: true },
    );
  });
}
