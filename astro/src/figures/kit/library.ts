import { Plot, type District, type Part, type PartKind } from './city';
import type { Rng } from './rng';

/** The library's own board for the `district` template (2.5 × 1.5, like a hub level): a big
 *  civic library of two to four storeys stepping back as they rise, a columned portico on
 *  its front, wings that may turn out at an angle, perhaps a dome, and a clock tower that is
 *  the landmark. Round it a plaza with a fountain, flower beds, an avenue of lamps and
 *  benches, people about, and trees on every side; a few houses of the town at the back. The
 *  seed picks the building's size, levels, wings, roof, where the tower stands, the whole
 *  plan's turn on the board, and where everything in the park goes. */

const [BW, BD] = [1.2, 0.72];

export function library(rng: Rng): District {
  const P = new Plot(rng);
  const turn = P.r(-0.45, 0.45);
  const [c, s] = [Math.cos(turn), Math.sin(turn)];
  // Everything is laid out in the plan's own frame, front toward +z, then turned onto the
  // board; a part that would fall off the board is left out.
  const at = (x: number, z: number): [number, number] => [x * c - z * s, x * s + z * c];
  const add = (kind: PartKind, x: number, z: number, w: number, d: number, h: number, y = 0, rot = 0) => {
    const [bx, bz] = at(x, z);
    if (Math.abs(bx) > BW - w / 2 || Math.abs(bz) > BD - d / 2) return undefined;
    return P.add(kind, bx, bz, w, d, h, y, turn + rot);
  };
  const line = (x0: number, z0: number, x1: number, z1: number): void => {
    const [a, b] = [at(x0, z0), at(x1, z1)];
    P.line(a[0], a[1], b[0], b[1]);
  };

  // The building: storeys stepping back, a portico, wings, a roof and the clock tower.
  const levels = 2 + Math.floor(P.rng() * 3);
  const [W, D, sh] = [P.r(0.8, 1.05), P.r(0.34, 0.44), P.r(0.075, 0.09)];
  const z0 = -0.22;
  for (let k = 0; k < levels; k++) add('storey', 0, z0 - k * 0.025, W * (1 - 0.1 * k), D * (1 - 0.12 * k), sh, k * sh);
  const top = levels * sh;
  const pw = P.r(0.28, 0.42);
  add('portico', 0, z0 + D / 2 + 0.06, pw, 0.12, sh * 1.7);
  const wings = Math.floor(P.rng() * 3);
  const splay = P.rng() < 0.5 ? 0 : P.r(0.3, 0.6);
  for (let i = 0; i < wings; i++) {
    const side = wings === 1 ? (P.rng() < 0.5 ? -1 : 1) : i ? 1 : -1;
    const [ww, wd] = [P.r(0.3, 0.42), D * 0.75];
    const a = side * splay;
    const x = side * (W / 2 + (ww / 2) * Math.cos(a));
    add('storey', x, z0 + (ww / 2) * Math.sin(a) * side, ww, wd, sh * Math.max(1, levels - 1), 0, a);
  }
  if (P.rng() < 0.5) {
    add('tower', 0, z0 - 0.05, 0.22, 0.22, 0.05, top);
    add('dome', 0, z0 - 0.05, 0.22, 0.22, 0.12, top + 0.05);
  }
  const tx = P.rng() < 0.5 ? 0 : (P.rng() < 0.5 ? -1 : 1) * W * 0.36;
  const tw = P.r(0.1, 0.13);
  P.landmark = add('clocktower', tx, z0 - D / 2 + 0.02, tw, tw, top + P.r(0.3, 0.42));

  // The plaza, its paving and the fountain; the avenue out to the front edge.
  const pz = z0 + D / 2 + 0.24;
  for (let k = 0; k <= 4; k++) line(-0.42 + k * 0.21, pz - 0.14, -0.42 + k * 0.21, pz + 0.14);
  for (const z of [pz - 0.14, pz, pz + 0.14]) line(-0.42, z, 0.42, z);
  if (P.rng() < 0.7) add('fountain', P.r(-0.15, 0.15), pz, 0.14, 0.14, 0.06);
  for (const x of [-0.06, 0.06]) line(x, pz + 0.14, x, 0.8);
  for (const x of [-0.75, 0.75]) line(x, pz - 0.05, x, -0.75);
  line(-0.9, pz, 0.9, pz);

  // Along the avenue and the plaza's edge: lamps in pairs, benches facing the path, flower
  // beds, hedges along the front of the building.
  for (let z = pz - 0.1; z < 0.75; z += 0.13) for (const x of [-0.42, 0.42]) add('lamp', x, z, 0.014, 0.014, 0.07);
  for (let z = pz + 0.22; z < 0.75; z += 0.12) for (const x of [-0.1, 0.1]) add('lamp', x, z, 0.014, 0.014, 0.06);
  for (let k = 0; k < 6; k++) {
    const x = (k % 2 ? 1 : -1) * P.r(0.15, 0.36);
    add('bench', x, pz + P.r(-0.1, 0.1), 0.05, 0.018, 0.022, 0, k % 2 ? Math.PI / 2 : -Math.PI / 2);
  }
  for (let z = pz + 0.24; z < 0.72; z += P.r(0.14, 0.2))
    for (const x of [-0.14, 0.14]) add('bench', x, z, 0.05, 0.018, 0.022, 0, x < 0 ? Math.PI / 2 : -Math.PI / 2);
  for (const x of [-1, 1]) {
    add('flowers', x * (pw / 2 + 0.1), z0 + D / 2 + 0.06, 0.12, 0.06, 0.025);
    for (let k = 0; k < 3; k++)
      add('flowers', x * P.r(0.24, 0.36), P.r(pz + 0.25, 0.65), P.r(0.08, 0.12), P.r(0.05, 0.08), 0.025);
    for (let k = 0; k < 5; k++) add('bush', x * (W * 0.12 + k * W * 0.08 + 0.12), z0 + D / 2 + 0.03, 0.05, 0.035, 0.03);
  }
  for (let k = 0; k < 14; k++) {
    const onPlaza = k < 9;
    const x = onPlaza ? P.r(-0.4, 0.4) : P.r(-0.05, 0.05);
    add('person', x, onPlaza ? pz + P.r(-0.13, 0.13) : P.r(pz + 0.2, 0.7), 0.016, 0.016, 0.034, 0, P.r(0, 3));
  }

  // Trees all round: an avenue down the front path, groves to either side and behind, and a
  // row of the town's houses along the back edge.
  for (let z = pz + 0.2; z < 0.75; z += 0.1)
    for (const x of [-0.26, 0.26]) add(P.rng() < 0.5 ? 'oak' : 'tree', x, z, 0.06, 0.06, 0.1);
  grove(P, add, -0.95, 0.05, 0.4, 1.1);
  grove(P, add, 0.95, 0.05, 0.4, 1.1);
  grove(P, add, 0, -0.62, 1.4, 0.18);
  for (let x = -1.1; x < 1.1; x += P.r(0.14, 0.2))
    if (Math.abs(x) > 0.75) add(P.rng() < 0.5 ? 'house' : 'block', x, -0.66, 0.1, 0.08, P.r(0.05, 0.08));
  return P.done();
}

type Add = (
  kind: PartKind,
  x: number,
  z: number,
  w: number,
  d: number,
  h: number,
  y?: number,
  rot?: number,
) => Part | undefined;

/** Trees of mixed kinds over w × d, with bushes under them. */
function grove(P: Plot, add: Add, x: number, z: number, w: number, d: number): void {
  const kinds = ['tree', 'oak', 'birch', 'pine', 'cypress'] as const;
  for (let i = 0; i < Math.round(w * d * 60); i++) {
    const s = P.r(0.05, 0.09);
    const kind = kinds[Math.floor(P.rng() * kinds.length)] ?? 'tree';
    add(kind, x + P.r(-0.5, 0.5) * w, z + P.r(-0.5, 0.5) * d, s, s, s * (kind === 'oak' ? 1.3 : P.r(1.6, 2.6)));
    if (P.rng() < 0.4) add('bush', x + P.r(-0.5, 0.5) * w, z + P.r(-0.5, 0.5) * d, s * 0.8, s * 0.7, s * 0.4);
  }
}
