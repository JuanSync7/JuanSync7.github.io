import type { Draft } from './primitives';
import { frame, port, rect, screw } from './details';
import { grille } from './mechanical';

export function rack(p: Draft, n: number): void {
  p.part(
    'Rack frame',
    'Four structural posts rise from a plinth with levelling feet. Front mounting rails include repeated U-position holes.',
    [0, 0, 0],
  );
  p.box(0, 0.04, 0, 1.35, 0.1, 1.15, 0.045);
  for (const x of [-0.6, 0.6])
    for (const z of [-0.49, 0.49]) {
      p.box(x, 0.14, z, 0.085, 1.83, 0.085, 0.008);
      p.cylinder(x, 0, z, 0.065, 0.04, 12);
    }
  for (const x of [-0.55, 0.55]) {
    p.box(x, 0.14, 0.52, 0.055, 1.77, 0.035, 0.003);
    p.detail(() => {
      for (let i = 0; i < 27; i++) p.ring(x, 0.2 + i * 0.063, 0.54, 0.012, 'front', 8);
    });
  }
  p.part(
    'Server sleds',
    'Four independent sleds have drive carriers, front handles, ventilation apertures and mounting fasteners.',
    [0, 0.24, 0.18],
  );
  for (let k = 0; k < 4; k++) {
    const y = 0.24 + k * 0.3;
    p.box(0, y, 0, 1.05, 0.22, 0.96, 0.012);
    for (let j = 0; j < 4; j++) {
      const x = -0.37 + j * 0.247;
      port(p, x, y + 0.045, 0.497, 0.205, 0.12, 0.055, 3);
      p.box(x, y + 0.15, 0.531, 0.12, 0.02, 0.018, 0.002);
    }
    for (const x of [-0.49, 0.49]) p.ring(x, y + 0.1, 0.486, 0.017, 'front', 8);
    p.detail(() => {
      for (let i = 0; i < 5; i++)
        p.line([
          [-0.4, y + 0.221, -0.35 + i * 0.12],
          [0.4, y + 0.221, -0.35 + i * 0.12],
        ]);
    });
  }
  p.part(
    'Network equipment',
    'A patch panel and a network shelf occupy the top bays. Every port is recessed into its own carrier.',
    [0, 0.55, 0.2],
  );
  for (let k = 0; k < 2; k++) {
    const y = 1.49 + k * 0.2;
    p.box(0, y, 0, 1.06, 0.14, 0.9, 0.012);
    for (let j = 0; j < n + 3; j++)
      port(p, -0.45 + ((j + 0.5) * 0.9) / (n + 3), y + 0.025, 0.474, 0.9 / (n + 3) - 0.018, 0.085, 0.055, 4);
  }
  p.part(
    'Cable management',
    'Physical patch leads leave the upper panel and terminate at the network shelf below. A side channel carries the slack.',
    [0.32, 0.2, 0],
  );
  p.box(0.64, 0.4, 0.12, 0.05, 1.34, 0.16, 0.008);
  for (let i = 0; i < 4; i++) {
    const x = -0.45 + ((i + 0.5) * 0.9) / (n + 3);
    const end = -0.45 + ((i + 1.5) * 0.9) / (n + 3);
    p.line([
      [x, 1.74, 0.505],
      [x, 1.73, 0.6],
      [end, 1.57, 0.66],
      [end, 1.54, 0.505],
    ]);
  }
  p.part(
    'Mesh door',
    'A framed front door has a repeated mesh pattern, hinge barrels and a recessed pull handle. The mesh lets the equipment remain visible.',
    [-0.25, 0.05, 0.48],
  );
  p.transform(() => frame(p, 0, 0, 0, 1.18, 0.055, 1.75, 0.045), [0, 1.035, 0.565], Math.PI / 2);
  p.detail(() => {
    for (let y = 0.24; y < 1.84; y += 0.085)
      p.line([
        [-0.52, y, 0.622],
        [0.52, y, 0.622],
      ]);
    for (let x = -0.5; x < 0.51; x += 0.085)
      p.line([
        [x, 0.24, 0.622],
        [x, 1.84, 0.622],
      ]);
  });
  for (const y of [0.45, 1.55]) p.cylinder(-0.58, y, 0.59, 0.024, 0.13, 10);
  p.box(0.48, 0.93, 0.635, 0.035, 0.25, 0.035, 0.01);
  p.part('Roof and exhaust', 'A strengthened roof has two exhaust guards and corner fasteners.', [0, 0.85, 0]);
  p.box(0, 1.97, 0, 1.35, 0.065, 1.15, 0.025);
  for (const x of [-0.31, 0.31]) grille(p, x, 2.036, 0, 0.22);
  for (const x of [-0.55, 0.55]) for (const z of [-0.45, 0.45]) screw(p, x, 2.036, z, 0.025);
  rect(p, 0, 2.037, 0, 1.22, 1.02);
}
