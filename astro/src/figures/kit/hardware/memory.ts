import type { Draft } from './primitives';
import { laminate, logic, rect } from './details';

export function memory(p: Draft, n: number): void {
  p.part(
    'Interposer landing',
    'The landing includes a wide bus, a bump field and a layered section edge beneath the stack.',
    [0, 0, 0],
  );
  p.box(0, 0, 0, 1.55, 0.08, 1.3, 0.025);
  laminate(p, 1.55, 1.3, 0, 0.08);
  rect(p, 0, 0.081, 0, 1.22, 1.04);
  for (let i = 0; i < n + 8; i++) {
    const z = (i / (n + 7) - 0.5) * 0.84;
    p.line([
      [0.48, 0.082, z],
      [0.72, 0.082, z],
    ]);
  }
  p.detail(() => {
    for (let x = -0.48; x < 0.49; x += 0.12)
      for (let z = -0.4; z < 0.41; z += 0.12) p.ring(x, 0.082, z, 0.016, 'top', 8);
  });
  p.part(
    'Base logic',
    'Control, repair and interface blocks occupy the base die. The comb at its edge represents the wide physical interface to the neighbouring compute die.',
    [0, 0.35, 0],
  );
  p.box(0, 0.1, 0, 1.2, 0.095, 1.03, 0.012);
  logic(p, -0.05, 0.196, 0, 1.02, 0.92, 3);
  p.detail(() => {
    for (let k = 0; k < 18; k++)
      p.line([
        [0.49, 0.198, -0.42 + k * 0.049],
        [0.57, 0.198, -0.42 + k * 0.049],
      ]);
  });
  p.part(
    'Through-silicon connections',
    'Vertical connections are exposed by the notched section. These columns carry signals through the stack, rather than around its edges.',
    [0, 0.65, 0],
    true,
  );
  for (let i = 0; i < 6; i++) p.cylinder(0.11, 0.195, -0.32 + i * 0.12, 0.014, 0.69, 8);
  p.part(
    'DRAM layers',
    'Eight thin memory dies repeat above the base. A cut corner reveals the inner edge, while bank arrays, perimeter seals and the bonding seams distinguish each layer.',
    [0, 0.95, 0],
  );
  for (let k = 0; k < 8; k++) {
    const y = 0.21 + k * 0.082;
    p.extrude(
      [
        [-0.55, -0.48],
        [0.55, -0.48],
        [0.55, 0.09],
        [0.16, 0.09],
        [0.16, 0.48],
        [-0.55, 0.48],
      ],
      y,
      y + 0.055,
    );
    for (const z of [-0.28, 0.28])
      for (const x of [-0.35, -0.08]) {
        rect(p, x, y + 0.056, z, 0.2, 0.29);
        p.detail(() => {
          for (let i = 0; i < 4; i++)
            p.line([
              [x - 0.08, y + 0.057, z - 0.1 + i * 0.067],
              [x + 0.08, y + 0.057, z - 0.1 + i * 0.067],
            ]);
        });
      }
    p.line([
      [-0.54, y + 0.033, 0.481],
      [0.15, y + 0.033, 0.481],
    ]);
    p.detail(() => {
      for (let x = -0.45; x < 0.16; x += 0.075) p.ring(x, y + 0.067, 0.455, 0.009, 'top', 6);
    });
  }
  p.part(
    'Top die and seal',
    'A thicker top die closes the stack. The inset perimeter and exposed bank regions describe the upper die without adding a separate lid.',
    [0, 1.3, 0],
  );
  p.box(0, 0.866, 0, 1.1, 0.07, 0.96, 0.015);
  rect(p, 0, 0.937, 0, 1.01, 0.87);
  for (const x of [-0.29, 0.29])
    for (const z of [-0.23, 0.23]) {
      rect(p, x, 0.938, z, 0.41, 0.32);
      p.detail(() => {
        for (let i = 0; i < n + 2; i++)
          p.line([
            [x - 0.17, 0.939, z - 0.12 + (i * 0.24) / (n + 1)],
            [x + 0.17, 0.939, z - 0.12 + (i * 0.24) / (n + 1)],
          ]);
      });
    }
}
