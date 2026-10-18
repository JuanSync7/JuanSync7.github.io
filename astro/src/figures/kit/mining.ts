import type { Vec3 } from './camera';
import type { Plot } from './city';
import { conveyor, silos } from './industry';
import { grid, smalls } from './power';

/** The mine island's three boards, bottom up. Underground, drill rigs work the faces at the
 *  ends of the drifts and loaders haul to the ore hopper at the shaft; the ore goes up by
 *  via. Above, it lands in silos, is roasted in a rotary kiln, smelted, and the metal is
 *  refined in a column plant, then stored at the second port and sent up. On top, mountains
 *  and mesas behind an open pit: a shovel works the benches, drill rigs stand on the rim,
 *  and haul trucks loop from pit and drill pads to the crusher and the gathering point.
 *  Every level has its own small grid. */

/** Where each level's goods leave for the next: the via up starts here, and the level above
 *  receives them at the same spot. */
const PORT: [number, number][] = [
  [0.55, 0.22],
  [-0.72, -0.4],
];

/** A haul road through the stops (closed), so trucks loop between them. */
function haul(P: Plot, stops: [number, number][], w = 0.045): void {
  P.road(
    stops.map(([x, z]): Vec3 => [x, 0.004, z]),
    w,
  );
}

/** A drill rig on its pad, with the pile it has broken. */
function node(P: Plot, x: number, z: number, s = 1): void {
  P.ellipse(x, z, 0.07 * s, 0.05 * s, 10);
  P.add('drill', x, z, 0.06 * s, 0.05 * s, 0.2 * s, 0, P.r(0, 3));
  P.add('heap', x + 0.07 * s, z + 0.03, 0.06 * s, 0.06 * s, 0.04 * s);
}

export function mine(P: Plot, k: number): void {
  if (k === 2) {
    P.mountains(-0.85, 0.15, -0.45, 0.12);
    // The pit: benches stepping down, the shovel on the floor, rigs on the rim.
    const [px, pz] = [-0.35, 0.15];
    for (let i = 1; i <= 5; i++) P.ellipse(px, pz, 0.065 * i, 0.045 * i, 22);
    P.add('excavator', px + 0.03, pz, 0.12, 0.08, 0.08, 0, 2.4);
    node(P, px - 0.28, pz - 0.12, 0.8);
    node(P, px + 0.25, pz + 0.18, 0.8);
    node(P, 0.35, -0.38);
    P.rocks(px - 0.35, pz + 0.3, 0.3, 0.12, 6);
    // The gathering point: trucks tip into the hopper, the crusher feeds the silos and the
    // headframe hoists the ore down to the works.
    P.add('hopper', 0.22, 0.05, 0.09, 0.09, 0.09);
    P.add('block', 0.36, 0.05, 0.1, 0.09, 0.08);
    conveyor(P, [0.41, 0.05], [0.58, -0.12]);
    silos(P, 0.58, -0.18, 3);
    P.add('headframe', 0.72, 0.2, 0.1, 0.1, 0.24);
    haul(P, [
      [px, pz + 0.05],
      [px + 0.2, pz + 0.24],
      [0.1, 0.18],
      [0.22, 0.12],
      [0.35, -0.3],
      [0.15, -0.2],
      [px + 0.15, pz - 0.12],
    ]);
    grid(P, 0.7, -0.45, [
      [0.36, 0.0],
      [0.72, 0.1],
      [0.1, -0.35],
    ]);
    P.trees(0.75, 0.48, 0.24, 0.12, 5, false);
    P.trees(-0.8, 0.45, 0.16, 0.12, 3, false);
  } else if (k === 1) {
    // Ore in from below, roasted, smelted; metal piped to the refinery; product stored at the
    // second port.
    const [rx, rz] = PORT[0] ?? [0, 0];
    silos(P, rx - 0.03, rz, 2);
    conveyor(P, [rx - 0.05, rz - 0.02], [0.42, 0.28]);
    P.add('kiln', 0.25, 0.28, 0.32, 0.08, 0.12);
    conveyor(P, [0.08, 0.28], [-0.02, 0.24]);
    P.add('factory', -0.18, 0.24, 0.3, 0.17, 0.1);
    for (let i = 0; i < 3; i++) P.add('stack', -0.3 + i * 0.12, 0.38, 0.04, 0.04, P.r(0.26, 0.34));
    P.add('crane', -0.18, 0.46, 0.34, 0.12, 0.1);
    P.add('hex', -0.08, 0.02, 0.14, 0.14, 0.12);
    for (let i = 0; i < 3; i++) P.add('column', -0.45 + i * 0.08, -0.05, 0.05, 0.05, P.r(0.22, 0.32));
    P.add('flare', -0.82, 0.1, 0.03, 0.03, 0.34);
    for (let i = 0; i < 6; i++) P.add('tank', -0.5 + (i % 3) * 0.1, -0.28 + Math.floor(i / 3) * 0.1, 0.08, 0.08, 0.05);
    P.pipe([-0.18, 0.04, 0.15], [-0.18, 0.04, 0.02], [-0.37, 0.04, 0.02], [-0.37, 0.04, -0.05]);
    P.pipe([-0.45, 0.04, -0.05], [-0.45, 0.04, -0.2]);
    const [sx, sz] = PORT[1] ?? [0, 0];
    P.add('warehouse', sx + 0.02, sz + 0.1, 0.24, 0.1, 0.06);
    P.add('hopper', sx, sz, 0.07, 0.07, 0.07);
    haul(P, [
      [rx - 0.05, rz - 0.12],
      [0.1, 0.1],
      [-0.25, 0.08],
      [-0.6, -0.12],
      [sx + 0.1, sz - 0.02],
      [0.1, -0.45],
      [0.6, -0.2],
    ]);
    grid(P, 0.62, -0.45, [
      [0.25, 0.18],
      [-0.18, 0.12],
      [-0.45, -0.15],
    ]);
    P.port(sx, sz);
    P.trees(0.8, -0.1, 0.12, 0.2, 3, false);
  } else {
    // Underground: drifts follow the ore body; rigs at the faces; loaders haul to the
    // hopper at the shaft.
    for (const z of [-0.3, 0, 0.3]) P.line(-0.8, z, 0.8, z + P.r(-0.06, 0.06));
    for (const x of [-0.5, 0.0, 0.3]) P.line(x, -0.5, x, 0.5);
    node(P, -0.72, -0.3, 0.8);
    node(P, -0.72, 0.3, 0.8);
    node(P, -0.1, -0.45, 0.8);
    node(P, 0.15, 0.45, 0.8);
    P.rocks(-0.3, 0.15, 0.4, 0.2, 8);
    P.rocks(0.45, -0.3, 0.3, 0.18, 6);
    const [hx, hz] = PORT[0] ?? [0, 0];
    P.add('hopper', hx, hz, 0.09, 0.09, 0.09);
    P.add('headframe', hx + 0.14, hz, 0.09, 0.09, 0.18);
    haul(P, [
      [-0.62, -0.3],
      [-0.62, 0.3],
      [0.1, 0.38],
      [hx - 0.08, hz],
      [0.0, -0.38],
    ]);
    for (let i = 0; i < 3; i++) P.add('tank', 0.75, -0.42 + i * 0.1, 0.07, 0.07, 0.05);
    P.add('stack', -0.82, -0.5, 0.05, 0.05, 0.2);
    smalls(P, 0.42, -0.5, 3);
    grid(P, 0.7, 0.42, [
      [hx, hz - 0.1],
      [-0.4, 0.0],
    ]);
    P.port(hx, hz);
  }
}
