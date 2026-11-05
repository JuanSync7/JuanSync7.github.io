import type { Draft } from './primitives';

export function server(p: Draft, n: number): void {
  p.part('Chassis', 'A shallow rack enclosure supports a row of hot-swappable front drive bays.');
  p.box(0, 0, 0, 2, 0.13, 1.45, 0.045);
  p.part('Mainboard and processors', 'The board carries processors, memory slots and rear connections.');
  p.box(0, 0.14, -0.12, 1.7, 0.04, 1.05);
  for (const x of [-0.45, 0.45]) {
    p.box(x, 0.18, -0.25, 0.42, 0.14, 0.42);
    p.ribs(x, 0.321, -0.4, 7, 0.36, 0, 0.05);
  }
  for (let i = 0; i < n + 1; i++) p.box(-0.72 + i * 0.18, 0.19, -0.55, 0.045, 0.18, 0.34, 0);
  p.part('Drive bays', 'Individual carriers make the front storage devices replaceable.');
  for (let i = 0; i < n + 2; i++) {
    const width = 1.8 / (n + 2),
      x = -0.9 + (i + 0.5) * width;
    p.box(x, 0.14, 0.53, width - 0.04, 0.24, 0.38);
    p.box(x, 0.2, 0.726, width * 0.66, 0.07, 0.012, 0);
  }
  p.part('Cover', 'The removable top cover closes the airflow path over the components.');
  p.box(0, 0.42, 0, 2, 0.055, 1.45, 0.045);
  p.ribs(0.1, 0.476, -0.4, 9, 1.45, 0, 0.1);
}
export function storage(p: Draft, n: number): void {
  p.part('Drive body', 'The enclosure supports the spindle, platters and actuator.');
  p.box(0, 0, 0, 1.45, 0.18, 1.85, 0.08);
  for (const x of [-0.59, 0.59]) for (const z of [-0.77, 0.77]) p.ring(x, 0.181, z, 0.04);
  p.part('Magnetic platters', 'Discs share a spindle; the concentric rings indicate data tracks, not individual bits.');
  for (let i = 0; i < 2; i++) {
    p.cylinder(-0.07, 0.2 + i * 0.065, -0.18, 0.53, 0.035, 40);
    for (let k = 1; k <= n + 2; k++) p.ring(-0.07, 0.236 + i * 0.065, -0.18, 0.1 + k * 0.055, 'top', 40);
  }
  p.cylinder(-0.07, 0.32, -0.18, 0.11, 0.04);
  p.part('Read/write actuator', 'A pivoting arm positions the read/write head over the rotating media.');
  p.extrude(
    [
      [0.46, 0.64],
      [0.58, 0.58],
      [0.12, -0.13],
      [0.03, -0.09],
    ],
    0.31,
    0.35,
  );
  p.cylinder(0.49, 0.2, 0.56, 0.12, 0.18);
  p.part('Top cover', 'The cover protects the enclosed mechanical assembly. This is a simplified hard-disk cutaway.');
  p.box(0, 0.43, 0, 1.45, 0.04, 1.85, 0.08);
  p.box(0, 0.471, -0.1, 0.94, 0.002, 0.95, 0.05);
  p.ribs(-0.05, 0.474, -0.36, 5, 0.63, 0, 0.12);
}
export function networkSwitch(p: Draft, n: number): void {
  p.part('Enclosure', 'A low rack enclosure supports the network board and its front ports.');
  p.box(0, 0, 0, 2, 0.13, 1.15);
  p.part('Switching board', 'The switching chip forwards packets between the physical ports.');
  p.box(0, 0.13, 0, 1.8, 0.04, 0.95);
  p.box(0, 0.17, -0.12, 0.56, 0.13, 0.44);
  p.ribs(0, 0.301, -0.29, 7, 0.46, 0, 0.055);
  p.part('Ethernet ports', 'Each recessed front opening represents one copper network connection.');
  for (let i = 0; i < n + 3; i++) {
    const pitch = 1.8 / (n + 3),
      x = -0.9 + (i + 0.5) * pitch;
    p.box(x, 0.13, 0.43, pitch - 0.03, 0.23, 0.3, 0.008);
    p.box(x, 0.18, 0.585, pitch * 0.65, 0.12, 0.008, 0.004);
    p.line([
      [x - 0.03, 0.33, 0.59],
      [x + 0.03, 0.33, 0.59],
    ]);
  }
  p.part('Vented cover', 'Slots in the top panel let heat leave the enclosure.');
  p.box(0, 0.4, 0, 2, 0.055, 1.15);
  p.ribs(0, 0.456, -0.4, 9, 1.5, 0, 0.09);
}
export function rack(p: Draft, n: number): void {
  p.part('Frame', 'Four uprights and the base hold the equipment in a standard rack arrangement.');
  p.box(0, 0, 0, 1.26, 0.1, 1.08);
  for (const x of [-0.58, 0.58]) for (const z of [-0.48, 0.48]) p.box(x, 0.1, z, 0.09, 1.75, 0.09, 0);
  p.part('Equipment', 'Repeated shelves contain servers or network equipment.');
  for (let k = 0; k < n + 2; k++) {
    const y = 0.2 + (k * 1.4) / (n + 2);
    p.box(0, y, 0, 1.05, 0.17, 0.96);
    for (let j = 0; j < 4; j++) p.box(-0.34 + j * 0.22, y + 0.04, 0.487, 0.16, 0.065, 0.008, 0);
  }
  p.part('Roof panel', 'The roof caps the enclosure; the slots represent ventilation.');
  p.box(0, 1.85, 0, 1.26, 0.07, 1.08);
  p.ribs(0, 1.921, -0.4, 9, 0.9, 0, 0.1);
}
