import type { Vec3 } from './camera';
import type { Plot } from './city';

/** Builders for the industrial side of a city (`kit/city.ts` Plot): mining, smelting and
 *  refining, an assembly line, and power (geothermal, hydro, capacitor banks, wind, sun).
 *  Every stage hands on to the next by a conveyor or a pipe, so a works reads as one line
 *  rather than as buildings that happen to stand together. */

/** A conveyor from a to b at height h: a slim belt with teal flow riding on it. */
export function conveyor(P: Plot, a: [number, number], b: [number, number], h = 0.02): void {
  const [dx, dz] = [b[0] - a[0], b[1] - a[1]];
  const len = Math.hypot(dx, dz);
  P.add('belt', (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, len, 0.026, h, 0, Math.atan2(dz, dx));
  P.pipe([a[0], h + 0.004, a[1]], [b[0], h + 0.004, b[1]]);
}

/** An open-pit mine: a funnel of benches, rock round its rim, a headframe over the shaft, a
 *  haul road trucks loop on, ending at the crusher at `crusher`. */
export function pit(P: Plot, x: number, z: number, crusher: [number, number]): void {
  for (let i = 1; i <= 4; i++) P.ellipse(x, z, 0.075 * i, 0.055 * i, 18);
  P.rocks(x - 0.12, z - 0.27, 0.3, 0.1, 7);
  P.rocks(x - 0.3, z + 0.15, 0.1, 0.24, 5);
  P.add('headframe', x + 0.24, z - 0.2, 0.1, 0.1, 0.26);
  P.add('block', crusher[0], crusher[1], 0.1, 0.09, 0.08);
  const road: Vec3[] = [
    [x, 0.004, z + 0.06],
    [x + 0.16, 0.004, z + 0.2],
    [crusher[0] - 0.02, 0.004, crusher[1] + 0.08],
    [crusher[0] - 0.08, 0.004, crusher[1] - 0.02],
    [x + 0.08, 0.004, z - 0.04],
  ];
  P.roads.push(road);
  road.forEach((p, i) => {
    const q = road[(i + 1) % road.length] ?? p;
    P.line(p[0], p[2], q[0], q[2]);
  });
}

/** A row of n silos with a gallery conveyor along their tops. */
export function silos(P: Plot, x: number, z: number, n: number): void {
  for (let i = 0; i < n; i++) P.add('silo', x + i * 0.07, z, 0.06, 0.06, 0.16);
  P.add('belt', x + ((n - 1) * 0.07) / 2, z, n * 0.07, 0.02, 0.012, 0.18);
}

/** A blast furnace with its three hot-blast stoves and the cast house, fed by a skip
 *  conveyor from `feed`. Returns where the metal leaves. */
export function furnace(P: Plot, x: number, z: number, feed: [number, number]): [number, number] {
  P.add('hex', x, z, 0.1, 0.1, 0.24);
  P.add('stack', x, z, 0.035, 0.035, 0.34);
  for (let i = 0; i < 3; i++) P.add('tower', x - 0.1 + i * 0.05, z - 0.11, 0.04, 0.04, 0.18);
  P.add('shed', x + 0.13, z, 0.16, 0.12, 0.06);
  conveyor(P, feed, [x - 0.04, z + 0.02], 0.03);
  return [x + 0.21, z];
}

/** A refinery: distillation columns, a tank farm and the pipe rack between them, fed from
 *  `feed`. Returns where the product leaves. */
export function refinery(P: Plot, x: number, z: number, feed: [number, number]): [number, number] {
  for (let i = 0; i < 3; i++) P.add('tower', x + i * 0.05, z, 0.03, 0.03, P.r(0.2, 0.28));
  for (let i = 0; i < 4; i++) P.add('tank', x + 0.05 + (i % 2) * 0.1, z + 0.12 + (i >> 1) * 0.1, 0.08, 0.08, 0.05);
  P.pipe([feed[0], 0.03, feed[1]], [x, 0.03, feed[1]], [x, 0.03, z]);
  P.pipe([x + 0.1, 0.03, z], [x + 0.1, 0.03, z + 0.22]);
  return [x + 0.2, z + 0.22];
}

/** An open assembly line along x from x0 to x1: the work comes out of one hall, passes under
 *  gantries with people at every station, and goes into another hall, so the line has no
 *  visible start or end. */
export function assembly(P: Plot, x0: number, x1: number, z: number): void {
  P.add('shed', x0 - 0.1, z, 0.2, 0.2, 0.09);
  P.add('shed', x1 + 0.1, z, 0.2, 0.2, 0.09);
  P.add('belt', (x0 + x1) / 2, z, x1 - x0, 0.07, 0.012);
  for (let u = x0 + 0.08; u < x1 - 0.04; u += 0.14) {
    P.add('gantry', u, z, 0.025, 0.13, 0.08);
    P.workers.push([u + 0.04, 0, z - 0.06], [u - 0.03, 0, z + 0.06]);
  }
  P.lines.push([
    [x0 - 0.05, 0.012, z],
    [x1 + 0.05, 0.012, z],
  ]);
}

/** A geothermal plant: wells over the field, steam piped to separator tanks and the
 *  turbine hall. */
export function geothermal(P: Plot, x: number, z: number): void {
  P.add('hall', x, z, 0.24, 0.12, 0.05, 0, 0);
  for (let i = 0; i < 2; i++) P.add('tank', x - 0.2, z - 0.05 + i * 0.1, 0.06, 0.06, 0.07);
  for (let i = 0; i < 4; i++) {
    const [wx, wz] = [x - 0.38 + (i % 2) * 0.1, z - 0.14 + (i >> 1) * 0.28];
    P.add('headframe', wx, wz, 0.05, 0.05, 0.1);
    P.pipe([wx, 0.02, wz], [x - 0.2, 0.02, wz], [x - 0.2, 0.02, z]);
  }
}

/** A dam across the outlet of a lake: a curved wall, penstocks down to the turbine hall,
 *  and the hall's half-round roof. */
export function dam(P: Plot, x: number, z: number): void {
  P.add('lake', x - 0.18, z, 0.34, 0.3, 0);
  for (let i = -4; i <= 4; i++) {
    const a = i * 0.16;
    P.add('wall', x + Math.cos(a) * 0.06, z + Math.sin(a) * 0.16, 0.04, 0.045, 0.07, 0, a);
  }
  P.add('hall', x + 0.18, z, 0.12, 0.2, 0.06, 0, Math.PI / 2);
  for (const dz of [-0.06, 0, 0.06]) P.pipe([x + 0.06, 0.06, z + dz], [x + 0.13, 0.02, z + dz]);
}

/** A bank of capacitors in rows, beside its transformer. */
export function capacitors(P: Plot, x: number, z: number, rows: number, cols: number): void {
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++) P.add('tank', x + j * 0.035, z + i * 0.04, 0.022, 0.022, 0.05);
  P.add('block', x - 0.06, z + ((rows - 1) * 0.04) / 2, 0.05, 0.06, 0.06);
}

/** A row of wind turbines and a field of solar rows. */
export function renewables(P: Plot, x: number, z: number, turbines: number, rows: number): void {
  for (let i = 0; i < turbines; i++) P.add('turbine', x + i * 0.17, z, 0.03, 0.03, P.r(0.32, 0.4));
  for (let i = 0; i < rows; i++) P.add('solar', x + 0.4, z - 0.6 + i * 0.11, 0.42, 0.075, 0.05);
}
