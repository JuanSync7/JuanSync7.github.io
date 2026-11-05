import type { Draft } from './primitives';
import { capacitor, laminate, logic, rect } from './details';

export function accelerator(p: Draft, n: number): void {
  p.part(
    'Carrier substrate',
    'The carrier includes a layered organic edge, a land grid and perimeter decoupling outside the interposer footprint.',
    [0, 0, 0],
  );
  p.box(0, 0, 0, 2.3, 0.12, 1.9, 0.06);
  laminate(p, 2.3, 1.9, 0, 0.12);
  for (let i = 0; i < 10; i++)
    for (const s of [-1, 1]) {
      const x = (i / 9 - 0.5) * 1.85;
      capacitor(p, x, 0.121, s * 0.84, 0.08, 0.04);
    }
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) capacitor(p, s * 1.08, 0.121, (i / 5 - 0.5) * 1.35, 0.04, 0.075);
  p.detail(() => {
    for (let x = -1; x < 1.01; x += 0.17) for (let z = -0.78; z < 0.79; z += 0.17) p.ring(x, 0.001, z, 0.023, 'top', 8);
  });
  p.part(
    'Silicon interposer',
    'Two compute dies share this passive wiring surface with eight memory stacks. Bus bundles land at the actual die and memory footprints.',
    [0, 0.35, 0],
  );
  p.box(0, 0.14, 0, 2.05, 0.045, 1.5, 0.015);
  rect(p, 0, 0.186, 0, 1.97, 1.42);
  for (const side of [-1, 1])
    for (const cx of [-0.78, -0.26, 0.26, 0.78])
      for (let i = 0; i < n + 3; i++) {
        const x = cx - 0.12 + (i * 0.24) / (n + 2);
        const source = cx - 0.08 + (i * 0.16) / (n + 2);
        p.trace(
          [
            [source, 0.187, side * 0.35],
            [source, 0.187, side * 0.385],
            [x, 0.187, side * 0.385],
            [x, 0.187, side * 0.42],
          ],
          'Compute die',
          'Memory stacks',
        );
      }
  for (let i = 0; i < n + 5; i++) {
    const z = (i / (n + 4) - 0.5) * 0.58;
    p.trace(
      [
        [-0.05, 0.187, z],
        [0.05, 0.187, z],
      ],
      'Compute die',
      'Compute die',
    );
  }
  p.part(
    'Bonding and underfill',
    'Dense landing fields lie below each chip. The underfill edge fans out slightly beyond each footprint.',
    [0, 0.65, 0],
  );
  for (const x of [-0.46, 0.46]) {
    p.box(x, 0.185, 0, 0.85, 0.025, 0.73, 0.02);
    p.detail(() => {
      for (let i = 0; i < 7; i++)
        for (let j = 0; j < 5; j++) p.ring(x + (i - 3) * 0.1, 0.211, (j - 2) * 0.12, 0.01, 'top', 6);
    });
  }
  for (const x of [-0.78, -0.26, 0.26, 0.78])
    for (const z of [-0.58, 0.58]) p.box(x, 0.185, z, 0.34, 0.025, 0.34, 0.012);
  p.part(
    'Compute die',
    'Two adjacent compute dies have independent core arrays, central cache spines, edge PHY lanes and a short die-to-die interface.',
    [0, 1.05, 0],
  );
  for (const x of [-0.46, 0.46]) {
    p.box(x, 0.21, 0, 0.82, 0.095, 0.7, 0.012);
    logic(p, x, 0.306, 0, 0.78, 0.66, n);
  }
  p.part(
    'Memory stacks',
    'Eight stacks flank the compute pair. Individual die seams, top bank arrays and an interface strip distinguish memory from compute.',
    [0, 1.05, 0],
  );
  for (const x of [-0.78, -0.26, 0.26, 0.78])
    for (const z of [-0.58, 0.58]) {
      for (let k = 0; k < 5; k++) p.box(x, 0.21 + k * 0.035, z, 0.32, 0.026, 0.32, 0.008);
      rect(p, x, 0.377, z, 0.27, 0.27);
      p.detail(() => {
        for (let i = 0; i < 4; i++)
          p.line([
            [x - 0.11, 0.378, z - 0.09 + i * 0.06],
            [x + 0.11, 0.378, z - 0.09 + i * 0.06],
          ]);
        p.line([
          [x - 0.14, 0.378, z - 0.13],
          [x - 0.14, 0.378, z + 0.13],
        ]);
      });
    }
}
