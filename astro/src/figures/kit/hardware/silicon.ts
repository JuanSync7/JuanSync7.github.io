import type { Draft } from './primitives';

export function processor(p: Draft, n: number): void {
  p.part('Contact array', 'The package contacts carry power and signals to the board.');
  p.tiles(0, 0, 0, n + 3, n + 3, 0.14, 0.065);
  p.part('Package substrate', 'Routing in the substrate spreads the die connections out to the board pitch.');
  p.box(0, 0.07, 0, 1.65, 0.11, 1.65, 0.09);
  p.part('Silicon die', 'Repeated compute blocks surround a central shared region. The layout is illustrative.');
  p.box(0, 0.18, 0, 1.04, 0.09, 1.04);
  p.tiles(0, 0.272, 0, n, n, 0.8 / n, 0.6 / n);
  p.part('Heat spreader', 'A metal lid spreads heat from the small silicon die to a larger cooling surface.');
  p.box(0, 0.35, 0, 1.5, 0.15, 1.5, 0.1);
  p.box(0, 0.5, 0, 1.14, 0.035, 1.14, 0.06);
  for (let i = 0; i < 4; i++)
    p.line([
      [-0.32, 0.536, -0.23 + i * 0.09],
      [0.15 - i * 0.04, 0.536, -0.23 + i * 0.09],
    ]);
  p.ring(-0.52, 0.536, 0.52, 0.035);
}
export function memory(p: Draft, n: number): void {
  p.part('Interposer landing', 'A short, wide connection joins a memory stack to the neighbouring compute die.');
  p.box(0, 0, 0, 1.55, 0.08, 1.3);
  p.tiles(0, 0.081, 0, n + 2, n + 1, 0.17, 0.055);
  p.part('Base logic', 'The base die contains the interface and control logic beneath the memory.');
  p.box(0, 0.13, 0, 1.2, 0.1, 1.03);
  p.ribs(0, 0.231, -0.4, n + 1, 1, 0, 0.14);
  p.part(
    'Through-silicon connections',
    'Vertical connections link the stacked dies; the exposed columns are a schematic cutaway.',
  );
  for (let i = -2; i <= 2; i++) p.cylinder(i * 0.17, 0.23, 0, 0.018, (n + 1) * 0.1 + 0.02, 8);
  p.part('DRAM layers', 'Repeated memory dies sit above the base logic. Layer heights are exaggerated.');
  for (let k = 0; k < n + 1; k++) {
    p.box(0, 0.28 + k * 0.1, 0, 1.13, 0.065, 0.98);
    p.line([
      [-0.55, 0.32 + k * 0.1, 0.491],
      [0.55, 0.32 + k * 0.1, 0.491],
    ]);
  }
}
export function board(p: Draft, n: number): void {
  p.part('Circuit board', 'The board supports the components and carries the wiring between them.');
  p.box(0, 0, 0, 1.9, 0.09, 1.45, 0.07);
  for (const x of [-0.82, 0.82]) for (const z of [-0.6, 0.6]) p.ring(x, 0.091, z, 0.045);
  for (let k = 0; k < n + 2; k++) {
    const z = -0.42 + k * 0.14;
    p.line([
      [-0.29, 0.092, z],
      [-0.58, 0.092, z],
      [-0.58, 0.092, 0.57],
      [-0.68, 0.092, 0.57],
    ]);
    p.line([
      [0.29, 0.092, z],
      [0.59 + k * 0.035, 0.092, z],
      [0.59 + k * 0.035, 0.092, 0.49],
    ]);
  }
  p.part('Processor and memory', 'The main processor sits beside separate memory and supporting components.');
  p.box(-0.12, 0.1, -0.08, 0.62, 0.13, 0.6);
  p.tiles(-0.12, 0.231, -0.08, n, n, 0.45 / n, 0.3 / n);
  p.box(0.53, 0.1, -0.2, 0.26, 0.08, 0.53);
  p.pins(0.53, 0.1, 0.1, 5, 0.045);
  p.part('Connectors', 'Edge connectors expose power, general-purpose pins and data ports.');
  p.box(-0.64, 0.09, 0.48, 0.35, 0.24, 0.4);
  p.box(-0.64, 0.13, 0.685, 0.23, 0.13, 0.012, 0);
  p.box(0.62, 0.09, 0.5, 0.34, 0.2, 0.32);
  p.pins(0, 0.1, -0.58, 12, 0.09);
}
export function accelerator(p: Draft, n: number): void {
  p.part('Carrier substrate', 'The carrier fans power and signals out to the board beneath the package.');
  p.box(0, 0, 0, 1.95, 0.14, 1.55, 0.06);
  p.pins(0, 0.02, 0.8, 16, 0.105);
  p.part('Silicon interposer', 'A common routing surface connects the compute die to the surrounding memory.');
  p.box(0, 0.17, 0, 1.78, 0.055, 1.36);
  for (const sign of [-1, 1])
    for (let i = 0; i < n + 2; i++)
      p.line([
        [sign * 0.43, 0.226, -0.48 + i * 0.17],
        [sign * 0.78, 0.226, -0.48 + i * 0.17],
      ]);
  p.part('Compute die', 'Repeated compute tiles occupy the centre of the package.');
  p.box(0, 0.25, 0, 0.8, 0.13, 1.08);
  p.tiles(0, 0.381, 0, 3, n + 1, 0.2, 0.13);
  p.part('Memory stacks', 'Memory sits beside compute so that the interconnect stays short and wide.');
  for (const x of [-0.66, 0.66])
    for (const z of [-0.4, 0.4]) for (let k = 0; k < 4; k++) p.box(x, 0.25 + k * 0.06, z, 0.36, 0.045, 0.4);
}
