import type { Draft } from './primitives';
import { capacitor, laminate, logic, packageChip, port, rect, screw } from './details';

export function board(p: Draft, n: number): void {
  p.part(
    'Circuit board',
    'A multilayer board with mounting holes, a perimeter keep-out, plated vias and routed bundles. Traces end at their real component footprints.',
    [0, 0, 0],
  );
  p.box(0, 0, 0, 1.9, 0.09, 1.45, 0.065);
  laminate(p, 1.9, 1.45, 0, 0.09);
  rect(p, 0, 0.091, 0, 1.78, 1.32);
  for (const x of [-0.82, 0.82])
    for (const z of [-0.6, 0.6]) {
      p.ring(x, 0.092, z, 0.047, 'top', 16);
      p.ring(x, 0.092, z, 0.025, 'top', 12);
    }
  for (let k = 0; k < n + 2; k++) {
    const z = -0.3 + (k * 0.5) / (n + 1);
    p.trace(
      [
        [-0.43, 0.092, z],
        [-0.58, 0.092, z],
        [-0.58, 0.092, 0.57],
        [-0.68, 0.092, 0.57],
      ],
      'Processor and memory',
      'Connectors',
    );
    p.trace(
      [
        [0.19, 0.092, z],
        [0.59 + k * 0.025, 0.092, z],
        [0.59 + k * 0.025, 0.092, 0.49],
      ],
      'Processor and memory',
      'Connectors',
    );
  }
  p.detail(() => {
    for (let i = 0; i < 12; i++)
      for (const s of [-1, 1]) p.ring((i / 11 - 0.5) * 1.25, 0.093, s * 0.48, 0.008, 'top', 6);
    for (let i = 0; i < 6; i++) p.ring(-0.46, 0.093, -0.35 + i * 0.1, 0.009, 'top', 6);
  });
  p.part(
    'Processor and memory',
    'The exposed SoC floorplan is paired with a discrete memory package. Fine pitch leads and a pin-one mark separate the memory from its board footprint.',
    [0, 0.65, 0],
  );
  p.box(-0.12, 0.1, -0.08, 0.62, 0.13, 0.6, 0.012);
  logic(p, -0.12, 0.231, -0.08, 0.57, 0.55, n);
  packageChip(p, 0.53, 0.1, -0.2, 0.26, 0.53, 8);
  p.part(
    'Power and clock',
    'A regulator bank, decoupling capacitors and a shielded clock reference occupy the space around the processors.',
    [0, 0.4, 0],
  );
  for (let i = 0; i < 3; i++) {
    p.box(-0.72, 0.1, -0.24 + i * 0.15, 0.14, 0.09, 0.105, 0.015);
    capacitor(p, -0.72, 0.1, 0.2 + i * 0.09, 0.11, 0.035);
  }
  for (let i = 0; i < 4; i++) capacitor(p, -0.33 + i * 0.14, 0.1, 0.3, 0.065, 0.032);
  p.box(0.45, 0.1, -0.52, 0.23, 0.045, 0.095, 0.035);
  p.detail(() => rect(p, 0.45, 0.146, -0.52, 0.15, 0.045));
  p.part(
    'Connectors',
    'The Ethernet and stacked USB housings have real recessed openings and contacts. Their sockets remain open in the solid drawing.',
    [0, 0.8, 0.08],
  );
  port(p, -0.64, 0.09, 0.48, 0.35, 0.27, 0.4, 8);
  for (let k = 0; k < 2; k++) port(p, 0.62, 0.09 + k * 0.115, 0.5, 0.34, 0.105, 0.32, 4);
  for (const x of [-0.78, 0.78]) screw(p, x, 0.095, 0.33, 0.018);
  p.part(
    'GPIO header',
    'A keyed two-row header carries individual square pins in a common insulating base.',
    [0, 0.5, -0.12],
  );
  p.box(-0.05, 0.09, -0.61, 1.16, 0.06, 0.14, 0.008);
  for (let i = 0; i < 12; i++)
    for (const s of [-1, 1]) p.box(-0.55 + i * 0.09, 0.15, -0.61 + s * 0.035, 0.023, 0.12, 0.023, 0.002);
  p.part(
    'Edge interfaces',
    'A power connector and compact display socket face out through the board edge.',
    [-0.22, 0.28, 0],
  );
  p.transform(() => port(p, 0, 0, 0, 0.2, 0.1, 0.22, 4), [-0.87, 0.09, -0.49], 0, Math.PI / 2);
  p.transform(() => port(p, 0, 0, 0, 0.27, 0.09, 0.15, 6), [-0.89, 0.09, -0.05], 0, Math.PI / 2);
}
