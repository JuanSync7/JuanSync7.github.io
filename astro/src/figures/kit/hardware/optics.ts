import type { Draft } from './primitives';
import { capacitor, laminate, packageChip, port, rect } from './details';

export function optics(p: Draft, n: number): void {
  p.part(
    'Carrier',
    'A narrow board ends in separate edge fingers. The shoulders and contact lengths identify it as a pluggable transceiver.',
    [0, 0, 0],
  );
  p.box(0, 0, 0, 0.86, 0.065, 2.1, 0.035);
  laminate(p);
  for (let i = 0; i < n + 6; i++) {
    const x = (i / (n + 5) - 0.5) * 0.66;
    p.box(x, 0.066, -0.94, 0.038, 0.009, 0.22, 0.002);
  }
  p.part(
    'Signal electronics',
    'A controller, receiver amplifier and passives connect the optical engines to the electrical edge interface.',
    [0, 0.35, 0],
  );
  packageChip(p, 0, 0.07, -0.49, 0.38, 0.34, 8);
  for (const x of [-0.29, 0.29]) {
    packageChip(p, x, 0.07, -0.16, 0.15, 0.2, 4);
    for (let i = 0; i < 3; i++) capacitor(p, x, 0.071, -0.74 + i * 0.11, 0.065, 0.03);
  }
  p.detail(() => {
    for (let i = 0; i < 8; i++) {
      const x = (i / 7 - 0.5) * 0.3;
      p.line([
        [x, 0.067, -0.66],
        [x, 0.067, -0.82],
        [x + 0.025, 0.067, -0.82],
        [x + 0.025, 0.067, -0.93],
      ]);
    }
  });
  p.part(
    'Optical engines',
    'Separate transmitter and receiver cans carry the laser and photodetector. Each is aligned with one front fibre ferrule.',
    [0, 0.68, 0],
  );
  for (const x of [-0.19, 0.19]) {
    p.transform(
      () => {
        p.cylinder(0, 0, 0, 0.12, 0.35, 20);
        p.tube(0, 0.35, 0, 0.09, 0.055, 0.16, 16);
        p.ring(0, 0.02, 0, 0.124, 'top', 20);
        p.ring(0, 0.3, 0, 0.124, 'top', 20);
      },
      [x, 0.205, 0.1],
      Math.PI / 2,
    );
    p.box(x, 0.07, 0.12, 0.27, 0.035, 0.42, 0.008);
    p.detail(() => {
      for (const s of [-1, 1])
        p.line([
          [x + s * 0.12, 0.205, 0.13],
          [x + s * 0.15, 0.08, 0.13],
          [x + s * 0.15, 0.067, -0.05],
        ]);
    });
  }
  p.part(
    'Duplex connector',
    'Two recessed fibre openings have ferrule guides and a dividing wall. The surrounding connector body supports the release mechanism.',
    [0, 0.75, 0.18],
  );
  for (const x of [-0.19, 0.19]) {
    port(p, x, 0.09, 0.82, 0.34, 0.3, 0.42, 2);
    p.transform(() => p.tube(0, 0, 0, 0.088, 0.055, 0.2, 20), [x, 0.24, 0.72], Math.PI / 2);
  }
  p.part(
    'Release bail',
    'The formed release bail pivots at the sides of the connector and returns to a full-width pull handle.',
    [0, 1.05, 0.22],
  );
  p.line([
    [-0.39, 0.19, 0.74],
    [-0.39, 0.4, 1.04],
    [0.39, 0.4, 1.04],
    [0.39, 0.19, 0.74],
  ]);
  p.box(0, 0.385, 1.04, 0.78, 0.035, 0.04, 0.012);
  for (const x of [-0.39, 0.39]) {
    p.box(x, 0.16, 0.74, 0.06, 0.06, 0.06, 0.008);
    p.ring(x, 0.19, 0.776, 0.026, 'front', 12);
  }
  p.part(
    'Metal shell',
    'A folded U-section shell includes side spring fingers, a seam and an identification panel. The underside stays open around the board connector.',
    [0, 1.4, 0],
  );
  p.box(0, 0.43, -0.13, 0.87, 0.04, 1.79, 0.025);
  for (const x of [-0.418, 0.418]) p.box(x, 0.075, -0.13, 0.035, 0.355, 1.79, 0.008);
  rect(p, -0.05, 0.471, -0.25, 0.59, 0.83);
  p.detail(() => {
    for (let k = 0; k < 8; k++)
      for (const s of [-1, 1])
        p.line([
          [s * 0.36, 0.472, -0.76 + k * 0.18],
          [s * 0.4, 0.472, -0.71 + k * 0.18],
          [s * 0.4, 0.39, -0.71 + k * 0.18],
        ]);
    for (let k = 0; k < 3; k++)
      p.line([
        [-0.27, 0.473, -0.51 + k * 0.15],
        [0.17 - k * 0.05, 0.473, -0.51 + k * 0.15],
      ]);
  });
}
