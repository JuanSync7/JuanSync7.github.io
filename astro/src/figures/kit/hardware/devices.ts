import type { Draft } from './primitives';

export function cooler(p: Draft, n: number): void {
  p.part('Cold plate', 'The base plate contacts the heat source and spreads heat into the fins.');
  p.box(0, 0, 0, 1.4, 0.13, 1.4, 0.06);
  p.part('Fin stack', 'Thin repeated fins increase the area available to the cooling air.');
  for (let i = 0; i < n + 6; i++) p.box(-0.59 + (i * 1.18) / (n + 5), 0.13, 0, 0.035, 0.55, 1.23, 0);
  p.part('Fan frame', 'A square frame supports the motor above the fin stack.');
  for (const x of [-0.61, 0.61]) p.box(x, 0.74, 0, 0.1, 0.1, 1.32);
  for (const z of [-0.61, 0.61]) p.box(0, 0.74, z, 1.22, 0.1, 0.1);
  for (const x of [-0.6, 0.6]) for (const z of [-0.6, 0.6]) p.ring(x, 0.841, z, 0.025);
  p.part('Impeller', 'The motor turns the blades to drive air through the fins.');
  p.cylinder(0, 0.75, 0, 0.15, 0.12);
  p.ring(0, 0.85, 0, 0.53, 'top', 40);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    p.extrude(
      [
        [0.13, a],
        [0.5, a + 0.12],
        [0.48, a + 0.45],
        [0.17, a + 0.6],
      ].map(([r = 0, theta = 0]): [number, number] => [Math.cos(theta) * r, Math.sin(theta) * r]),
      0.8,
      0.825,
    );
  }
}
export function power(p: Draft, n: number): void {
  p.part('Enclosure base', 'The enclosure supports a simplified power-conversion assembly.');
  p.box(0, 0, 0, 1.5, 0.1, 1.55);
  p.part(
    'Transformer and capacitors',
    'A transformer and capacitors represent the principal conversion and filtering components.',
  );
  p.box(-0.28, 0.12, -0.14, 0.48, 0.43, 0.5);
  p.ribs(-0.28, 0.551, -0.34, 8, 0.41, 0, 0.055);
  for (const z of [-0.3, 0.3]) {
    p.cylinder(0.42, 0.12, z, 0.14, 0.37);
    p.line([
      [0.34, 0.491, z],
      [0.5, 0.491, z],
    ]);
  }
  p.part('Output connectors', 'Individual sockets expose the low-voltage outputs.');
  for (let i = 0; i < n; i++) {
    const x = -0.52 + (i * 1.04) / (n - 1);
    p.box(x, 0.14, 0.65, 0.22, 0.2, 0.26);
    p.line([
      [x - 0.055, 0.2, 0.786],
      [x + 0.055, 0.2, 0.786],
      [x + 0.055, 0.29, 0.786],
    ]);
  }
  p.part('Ventilated cover', 'The cover contains a fan grille above the internal components.');
  p.box(0, 0.62, 0, 1.5, 0.07, 1.55);
  for (let i = 1; i <= 6; i++) p.ring(0, 0.691, -0.08, i * 0.085, 'top', 32);
  p.line([
    [-0.55, 0.692, -0.08],
    [0.55, 0.692, -0.08],
  ]);
}
export function sensor(p: Draft, n: number): void {
  p.part('Mounting board', 'A compact circuit board carries a sensor package and its connections.');
  p.box(0, 0, 0, 1.45, 0.08, 1.25, 0.07);
  for (const x of [-0.6, 0.6]) for (const z of [-0.5, 0.5]) p.ring(x, 0.081, z, 0.045);
  p.pins(0, 0.08, 0.51, n + 3, 0.13);
  p.part(
    'Image sensor',
    'The focal plane sits behind the lens. The repeated tiles indicate a pixel array schematically.',
  );
  p.box(0, 0.09, -0.05, 0.69, 0.12, 0.64);
  p.tiles(0, 0.211, -0.05, n + 1, n + 1, 0.5 / (n + 1), 0.32 / (n + 1));
  p.part('Lens barrel', 'The barrel holds optical elements in alignment above the sensor.');
  p.cylinder(0, 0.27, -0.05, 0.39, 0.45, 32);
  for (let i = 0; i < 5; i++) p.ring(0, 0.34 + i * 0.07, -0.05, 0.395, 'top', 32);
  p.part('Front optic', 'A front optical element admits light to the image sensor below.');
  p.cylinder(0, 0.77, -0.05, 0.3, 0.025, 32);
  p.ring(0, 0.796, -0.05, 0.23, 'top', 32);
}
export function optics(p: Draft, n: number): void {
  p.part('Carrier', 'The module carrier locates the transmitter and receiver inside a pluggable enclosure.');
  p.box(0, 0, 0, 0.86, 0.09, 1.9);
  p.pins(0, 0.02, -0.96, n + 3, 0.09);
  p.part('Optical engines', 'Separate transmitter and receiver subassemblies convert electrical and optical signals.');
  for (const x of [-0.2, 0.2]) {
    p.box(x, 0.1, -0.2, 0.26, 0.22, 0.88);
    p.ribs(x, 0.321, -0.55, 6, 0.2, 0, 0.13);
  }
  p.part('Duplex connector', 'Two fibre openings provide separate transmit and receive paths.');
  p.box(0, 0.1, 0.7, 0.8, 0.35, 0.43);
  for (const x of [-0.2, 0.2]) p.ring(x, 0.28, 0.921, 0.1, 'front');
  p.part('Metal shell', 'The removable metal shell shields and protects the optical electronics.');
  p.box(0, 0.48, -0.1, 0.86, 0.06, 1.7);
  p.ribs(0, 0.541, -0.7, 9, 0.7, 0, 0.14);
}
