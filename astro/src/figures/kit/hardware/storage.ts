import type { Draft } from './primitives';
import { capacitor, frame, matrix, packageChip, rect, screw } from './details';

export function storage(p: Draft, n: number): void {
  p.part(
    'Drive body',
    'A cast base has a recessed platter well, corner bosses and a formed perimeter gasket seat.',
    [0, 0, 0],
  );
  p.box(0, 0, 0, 1.5, 0.09, 1.9, 0.08);
  frame(p, 0, 0.09, 0, 1.5, 0.14, 1.9, 0.035);
  for (const x of [-0.61, 0.61])
    for (const z of [-0.8, 0.8]) {
      p.cylinder(x, 0.09, z, 0.07, 0.14, 12);
      screw(p, x, 0.231, z, 0.033);
    }
  p.ring(-0.08, 0.091, -0.2, 0.58, 'top', 40);
  p.part(
    'Controller board',
    'The underside controller has a motor driver, cache package, power components and an exposed edge connection.',
    [0, -0.36, 0],
  );
  p.box(0, -0.055, 0, 1.32, 0.04, 1.7, 0.035);
  packageChip(p, -0.24, -0.015, 0.35, 0.36, 0.3, 6);
  packageChip(p, 0.26, -0.015, 0.14, 0.2, 0.32, 6);
  for (let i = 0; i < 4; i++) capacitor(p, -0.3 + i * 0.17, -0.014, 0.65);
  for (let i = 0; i < 10; i++) p.box(-0.49 + i * 0.1, -0.014, -0.86, 0.045, 0.012, 0.11, 0.002);
  p.part(
    'Magnetic platters',
    'Two discs share a motor spindle. Concentric data regions, a hub clamp and its three fasteners distinguish the media from the enclosure.',
    [0, 0.5, 0],
  );
  for (let k = 0; k < 2; k++) {
    const y = 0.16 + k * 0.09;
    p.cylinder(-0.08, y, -0.2, 0.54, 0.026, 40);
    for (let i = 0; i < n + 4; i++) p.ring(-0.08, y + 0.027, -0.2, 0.14 + (i * 0.35) / (n + 3), 'top', 40);
  }
  p.cylinder(-0.08, 0.09, -0.2, 0.095, 0.25, 16);
  p.cylinder(-0.08, 0.31, -0.2, 0.14, 0.035, 24);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    screw(p, -0.08 + Math.cos(a) * 0.085, 0.346, -0.2 + Math.sin(a) * 0.085, 0.018);
  }
  p.part(
    'Read/write actuator',
    'A pivot carries paired head arms and a small slider over the media. The rear coil sits in a shaped magnetic yoke.',
    [0.12, 0.8, 0.06],
  );
  p.cylinder(0.46, 0.09, 0.53, 0.12, 0.24, 20);
  for (const y of [0.24, 0.29]) {
    p.extrude(
      [
        [0.41, 0.54],
        [0.52, 0.5],
        [0.07, -0.15],
        [-0.015, -0.11],
      ],
      y,
      y + 0.018,
    );
    p.box(0.015, y - 0.012, -0.115, 0.055, 0.022, 0.085, 0.003);
  }
  p.extrude(
    [
      [0.4, 0.57],
      [0.56, 0.5],
      [0.64, 0.76],
      [0.36, 0.81],
    ],
    0.19,
    0.22,
  );
  p.detail(() => {
    for (let i = 0; i < 5; i++) rect(p, 0.49, 0.223, 0.7, 0.16 - i * 0.02, 0.12 - i * 0.012);
  });
  p.part(
    'Magnet and flex connection',
    'A top magnet closes the voice-coil gap; a short flexible connection reaches the actuator from the controller feed-through.',
    [-0.08, 1.1, 0.1],
  );
  p.extrude(
    [
      [0.33, 0.64],
      [0.61, 0.55],
      [0.68, 0.8],
      [0.33, 0.85],
    ],
    0.33,
    0.37,
  );
  for (const x of [0.37, 0.61]) screw(p, x, 0.371, 0.77, 0.02);
  p.line([
    [0.46, 0.22, 0.53],
    [0.25, 0.2, 0.65],
    [0.12, 0.12, 0.75],
    [0.12, 0.09, 0.75],
  ]);
  p.part(
    'Top cover',
    'A stamped lid has captive fasteners, a breather port, identification panel and reinforcing ribs.',
    [0, 1.48, 0],
  );
  p.box(0, 0.4, 0, 1.5, 0.035, 1.9, 0.07);
  rect(p, -0.08, 0.436, -0.2, 1.04, 1.1);
  for (const x of [-0.61, 0.61]) for (const z of [-0.8, 0, 0.8]) screw(p, x, 0.436, z, 0.028);
  p.ring(0.45, 0.437, -0.63, 0.05, 'top', 16);
  p.ring(0.45, 0.437, -0.63, 0.026, 'top', 12);
  for (let i = 0; i < 3; i++)
    p.line([
      [-0.43, 0.438, -0.48 + i * 0.13],
      [0.24 - i * 0.08, 0.438, -0.48 + i * 0.13],
    ]);
  matrix(p, 0.27, 0.438, 0.28, 7, 0.025);
}
