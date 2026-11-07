import type { Draft } from './primitives';
import { capacitor, laminate, logic, matrix, rect } from './details';

export function processor(p: Draft, n: number): void {
  p.part(
    'Contact array',
    'The land grid connects the package to the socket. Its face is exposed in the exploded drawing.',
    [0, 0, 0],
  );
  p.box(0, 0.025, 0, 1.5, 0.022, 1.5, 0.065);
  for (let i = 0; i < 10; i++)
    for (let j = 0; j < 10; j++) {
      const x = (i - 4.5) * 0.135,
        z = (j - 4.5) * 0.135;
      if (Math.abs(x) < 0.2 && Math.abs(z) < 0.2) continue;
      p.ring(x, 0.048, z, 0.025, 'top', 8);
      p.detail(() => p.ring(x, 0.049, z, 0.014, 'top', 8));
    }
  p.part(
    'Package substrate',
    'Build-up layers spread the fine die connections to the socket pitch. The edge seams, via field and perimeter decoupling are drawn separately.',
    [0, 0.4, 0],
  );
  p.box(0, 0.05, 0, 1.65, 0.1, 1.65, 0.085);
  laminate(p, 1.65, 1.65, 0.05, 0.1);
  rect(p, 0, 0.151, 0, 1.5, 1.5);
  for (const s of [-1, 1])
    for (let i = 0; i < n + 3; i++) {
      const t = (i / (n + 2) - 0.5) * 1.12;
      capacitor(p, t, 0.151, s * 0.66, 0.065, 0.033);
      capacitor(p, s * 0.66, 0.151, t, 0.033, 0.065);
    }
  p.detail(() => {
    for (let i = 0; i < 12; i++)
      for (const s of [-1, 1]) {
        const x = (i / 11 - 0.5) * 0.96;
        p.line([
          [x, 0.152, s * 0.5],
          [x, 0.152, s * 0.57],
          [x + 0.02, 0.152, s * 0.57],
        ]);
      }
  });
  p.part(
    'Microbump interface',
    'A dense field of short connections and an underfill fillet join the flip-chip die to the substrate. Pitch is exaggerated.',
    [0, 0.7, 0],
  );
  p.box(0, 0.15, 0, 1.08, 0.035, 1.08, 0.04);
  rect(p, 0, 0.186, 0, 1.02, 1.02);
  for (let i = 0; i < n + 5; i++)
    for (let j = 0; j < n + 5; j++)
      p.ring((i / (n + 4) - 0.5) * 0.92, 0.187, (j / (n + 4) - 0.5) * 0.92, 0.009, 'top', 6);
  p.part(
    'Silicon die',
    'Core blocks sit either side of a shared cache spine, with interface lanes at the edges. This floorplan illustrates hierarchy rather than a particular commercial processor.',
    [0, 1, 0],
  );
  p.box(0, 0.185, 0, 1.04, 0.075, 1.04, 0.012);
  logic(p, 0, 0.261, 0, 1.01, 1.01, n);
  p.part(
    'Thermal interface',
    'A thin contact layer bridges the silicon and the spreader. The perimeter exposes the contact footprint.',
    [0, 1.3, 0],
  );
  p.box(0, 0.26, 0, 0.98, 0.018, 0.98, 0.02);
  rect(p, 0, 0.279, 0, 0.9, 0.9);
  p.detail(() => {
    for (let i = 0; i < 7; i++)
      p.line([
        [-0.42, 0.28, -0.36 + i * 0.12],
        [0.42, 0.28, -0.36 + i * 0.12],
      ]);
  });
  p.part(
    'Heat spreader',
    'A skirt seats around the die and supports a stepped metal spreader. The chamfers, identification plate and index mark remain legible at icon size.',
    [0, 1.72, 0],
  );
  for (const s of [-1, 1]) {
    p.box(s * 0.69, 0.15, 0, 0.08, 0.13, 1.46, 0.02);
    p.box(0, 0.15, s * 0.69, 1.3, 0.13, 0.08, 0.02);
  }
  p.box(0, 0.278, 0, 1.5, 0.13, 1.5, 0.1);
  p.box(0, 0.408, 0, 1.3, 0.035, 1.3, 0.075);
  rect(p, -0.13, 0.444, -0.06, 0.72, 0.42);
  for (let i = 0; i < 3; i++)
    p.line([
      [-0.43, 0.445, -0.19 + i * 0.12],
      [0.13 - i * 0.07, 0.445, -0.19 + i * 0.12],
    ]);
  p.line(
    [
      [-0.59, 0.444, 0.48],
      [-0.48, 0.444, 0.59],
      [-0.59, 0.444, 0.59],
    ],
    true,
  );
  matrix(p, 0.32, 0.445, 0.3, 7, 0.025);
  p.detail(() => rect(p, 0, 0.444, 0, 1.22, 1.22));
}
