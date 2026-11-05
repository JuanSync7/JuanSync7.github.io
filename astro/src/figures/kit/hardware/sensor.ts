import type { Draft } from './primitives';
import { capacitor, frame, packageChip, rect, screw } from './details';

export function sensor(p: Draft, n: number): void {
  p.part(
    'Mounting board',
    'A small carrier includes mounting holes, power components and a flat-flex connector aligned with the optical module.',
    [0, 0, 0],
  );
  p.box(0, 0, 0, 1.35, 0.065, 1.2, 0.06);
  for (const x of [-0.55, 0.55])
    for (const z of [-0.47, 0.47]) {
      p.ring(x, 0.066, z, 0.043, 'top', 12);
      p.ring(x, 0.066, z, 0.023, 'top', 12);
    }
  for (let i = 0; i < 4; i++) capacitor(p, -0.38 + i * 0.25, 0.066, 0.37, 0.07, 0.035);
  packageChip(p, -0.48, 0.066, 0, 0.15, 0.22, 4);
  p.part(
    'Flex connector',
    'An insulating clamp holds a ribbon with parallel conductors and exposed contact fingers.',
    [0, 0.25, -0.12],
  );
  p.box(0, 0.065, -0.48, 0.75, 0.07, 0.15, 0.012);
  p.box(0, 0.137, -0.48, 0.69, 0.018, 0.11, 0.003);
  p.box(0, 0.069, -0.75, 0.65, 0.009, 0.48, 0.003);
  for (let k = 0; k < 12; k++)
    p.line([
      [-0.285 + k * 0.052, 0.079, -0.96],
      [-0.285 + k * 0.052, 0.079, -0.52],
    ]);
  p.part(
    'Image sensor',
    'The ceramic carrier surrounds a flat pixel-array region, bond pads and the fine repeated rows of the imaging surface.',
    [0, 0.52, 0],
  );
  p.box(0, 0.075, 0, 0.7, 0.075, 0.68, 0.015);
  p.box(0, 0.15, 0, 0.53, 0.018, 0.5, 0.005);
  rect(p, 0, 0.169, 0, 0.47, 0.44);
  p.detail(() => {
    for (let i = 0; i < n + 5; i++) {
      const t = i / (n + 4) - 0.5;
      p.line([
        [t * 0.44, 0.17, -0.2],
        [t * 0.44, 0.17, 0.2],
      ]);
      p.line([
        [-0.22, 0.17, t * 0.4],
        [0.22, 0.17, t * 0.4],
      ]);
    }
    for (let i = 0; i < 10; i++) for (const s of [-1, 1]) rect(p, (i / 9 - 0.5) * 0.54, 0.151, s * 0.3, 0.022, 0.03);
  });
  p.part(
    'Autofocus carrier',
    'A square voice-coil carrier keeps the lens aligned over the sensor. Corner coil packs and spring seats remain visible when the barrel is removed.',
    [0, 0.82, 0],
  );
  frame(p, 0, 0.17, 0, 0.83, 0.34, 0.83, 0.065);
  for (const x of [-0.32, 0.32])
    for (const z of [-0.32, 0.32]) {
      p.box(x, 0.23, z, 0.14, 0.18, 0.14, 0.015);
      p.detail(() => {
        for (let i = 0; i < 5; i++)
          p.line([
            [x - 0.07, 0.26 + i * 0.025, z + 0.071],
            [x + 0.07, 0.26 + i * 0.025, z + 0.071],
          ]);
      });
      screw(p, x, 0.511, z, 0.018);
    }
  p.part(
    'Lens barrel',
    'A hollow threaded barrel surrounds the optical train. Internal and external wall surfaces preserve the opening in the solid view.',
    [0, 1.15, 0],
  );
  p.tube(0, 0.27, 0, 0.35, 0.292, 0.41, 32);
  for (let i = 0; i < 5; i++) p.ring(0, 0.32 + i * 0.07, 0, 0.355, 'top', 32);
  p.part(
    'Optical elements',
    'Three retained optical elements share one axis. Their edges and seating rings show the spacing inside the barrel.',
    [0, 1.45, 0],
  );
  for (let i = 0; i < 3; i++) {
    const y = 0.31 + i * 0.115;
    p.tube(0, y, 0, 0.284, 0.25, 0.027, 24);
    p.cylinder(0, y + 0.008, 0, 0.247, 0.009, 28);
    p.ring(0, y + 0.018, 0, 0.2, 'top', 24);
  }
  p.part(
    'Front optic',
    'The front element seats behind an open retaining ring. Concentric bevels show the glass edge and barrel shoulder.',
    [0, 1.78, 0],
  );
  p.tube(0, 0.68, 0, 0.355, 0.285, 0.045, 32);
  p.cylinder(0, 0.69, 0, 0.282, 0.012, 32);
  p.ring(0, 0.703, 0, 0.235, 'top', 32);
}
