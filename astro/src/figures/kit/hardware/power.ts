import type { Draft } from './primitives';
import { capacitor, frame, packageChip, port, rect, screw } from './details';
import { electrolytic, fan, finBank, grille } from './mechanical';

export function power(p: Draft, n: number): void {
  p.part(
    'Enclosure base',
    'Folded metal sides, mounting bosses and a bottom pan carry the complete power-conversion assembly.',
    [0, 0, 0],
  );
  p.box(0, 0, 0, 1.6, 0.07, 1.7, 0.045);
  for (const x of [-0.77, 0.77]) p.box(x, 0.07, 0, 0.035, 0.52, 1.66, 0.008);
  for (const x of [-0.66, 0.66])
    for (const z of [-0.7, 0.7]) {
      p.cylinder(x, 0.07, z, 0.04, 0.045, 12);
      screw(p, x, 0.116, z, 0.025);
    }
  p.part(
    'Conversion board',
    'The board separates the input conversion stage from the output filters. Controller packages, a fuse carrier and heatsinks fill their own functional areas.',
    [0, 0.35, 0],
  );
  p.box(0, 0.115, 0, 1.42, 0.035, 1.5, 0.02);
  finBank(p, -0.55, 0.15, 0.04, 0.18, 0.3, 0.72, 4);
  finBank(p, 0.55, 0.15, 0.04, 0.18, 0.3, 0.72, 4);
  packageChip(p, 0.25, 0.15, -0.46, 0.23, 0.2, 6);
  p.box(-0.24, 0.15, -0.63, 0.38, 0.065, 0.12, 0.015);
  p.detail(() => {
    rect(p, 0, 0.151, -0.07, 0.27, 0.9);
    for (let k = 0; k < 5; k++) capacitor(p, -0.24 + k * 0.12, 0.151, 0.43, 0.07, 0.032);
  });
  p.part(
    'Transformer and input filter',
    'A clamped transformer core surrounds the winding bobbin. A bulk capacitor and a wound input choke sit beside it.',
    [0, 0.7, 0],
  );
  p.box(0, 0.15, -0.08, 0.5, 0.33, 0.44, 0.018);
  p.box(0, 0.2, 0.147, 0.3, 0.2, 0.025, 0.005);
  for (let k = 0; k < 7; k++)
    p.line([
      [-0.25, 0.483, -0.25 + k * 0.055],
      [0.251, 0.483, -0.25 + k * 0.055],
      [0.251, 0.23, -0.25 + k * 0.055],
    ]);
  electrolytic(p, -0.47, 0.15, -0.49, 0.135, 0.32);
  p.tube(0.43, 0.15, -0.5, 0.135, 0.075, 0.11, 18);
  p.detail(() => {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      p.line([
        [0.43 + Math.cos(a) * 0.075, 0.15, -0.5 + Math.sin(a) * 0.075],
        [0.43 + Math.cos(a) * 0.135, 0.15, -0.5 + Math.sin(a) * 0.135],
        [0.43 + Math.cos(a) * 0.135, 0.26, -0.5 + Math.sin(a) * 0.135],
        [0.43 + Math.cos(a) * 0.075, 0.26, -0.5 + Math.sin(a) * 0.075],
      ]);
    }
  });
  p.part(
    'Output filter bank',
    'A row of smaller capacitors and individual regulator packages filters the low-voltage outputs.',
    [0, 0.7, 0.06],
  );
  for (let i = 0; i < n; i++) electrolytic(p, -0.46 + (i * 0.92) / (n - 1), 0.15, 0.33, 0.065, 0.19);
  for (let i = 0; i < 3; i++) packageChip(p, -0.32 + i * 0.32, 0.15, 0.54, 0.18, 0.12, 4);
  p.part(
    'Output connectors',
    'Separate open sockets expose their individual contact cells. Retaining lips and keying ribs distinguish the connector bank.',
    [0, 0.6, 0.2],
  );
  for (let i = 0; i < n; i++) {
    const x = -0.52 + (i * 1.04) / (n - 1);
    port(p, x, 0.15, 0.7, 0.22, 0.22, 0.24, 4);
    p.box(x, 0.37, 0.71, 0.09, 0.02, 0.1, 0.003);
  }
  p.part(
    'Cooling fan',
    'A framed axial fan sits beneath the top opening, with a visible motor, swept blades and corner mounts.',
    [0, 1.04, 0],
  );
  p.transform(() => fan(p, 0.53), [0, 0.56, -0.05]);
  p.part(
    'Ventilated cover',
    'The cover is built around a real circular opening. A wire grille spans the opening instead of being drawn on an opaque plate.',
    [0, 1.36, 0],
  );
  frame(p, 0, 0.67, 0, 1.6, 0.045, 1.7, 0.1);
  const point = (a: number, r: number): [number, number, number] => [Math.cos(a) * r, 0.716, -0.05 + Math.sin(a) * r];
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2,
      b = ((i + 1) / 32) * Math.PI * 2;
    const edge = (t: number) =>
      Math.min(
        0.8 / Math.max(0.001, Math.abs(Math.cos(t))),
        (Math.sin(t) > 0 ? 0.9 : 0.8) / Math.max(0.001, Math.abs(Math.sin(t))),
      );
    p.surface([point(a, edge(a)), point(b, edge(b)), point(b, 0.55), point(a, 0.55)], true, false);
  }
  grille(p, 0, 0.718, -0.05, 0.55);
  for (const x of [-0.67, 0.67]) for (const z of [-0.7, 0.7]) screw(p, x, 0.717, z, 0.025);
}
