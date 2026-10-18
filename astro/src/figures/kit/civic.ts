import type { Vec3 } from './camera';
import { Plot, type District } from './city';
import { edgePoint } from './transit';
import type { Rng } from './rng';

/** Builders for the civic side of a city (`kit/city.ts` Plot): housing and the amenities a
 *  neighbourhood needs, train stations, substations and power lines on pylons, a datacentre,
 *  a lake, an airport. Each takes the plot and a place in the district's frame and adds
 *  parts, traces and pipes; none draws anything itself. */

/** A street of houses with gardens: n plots either side of a road running along x, a car
 *  loop on the road. */
export function housing(P: Plot, x: number, z: number, n: number): void {
  const pitch = 0.13;
  const x0 = x - ((n - 1) * pitch) / 2;
  P.line(x0 - 0.08, z, x0 + (n - 1) * pitch + 0.08, z);
  for (let i = 0; i < n; i++)
    for (const s of [-1, 1]) {
      const hx = x0 + i * pitch + P.r(-0.01, 0.01);
      P.add('house', hx, z + s * 0.08, 0.075, 0.06, P.r(0.04, 0.06));
      if (P.rng() > 0.45) P.trees(hx + 0.045, z + s * 0.14, 0.04, 0.03, 1, false);
    }
  P.roads.push([
    [x0 - 0.06, 0.004, z - 0.012],
    [x0 + (n - 1) * pitch + 0.06, 0.004, z - 0.012],
    [x0 + (n - 1) * pitch + 0.06, 0.004, z + 0.012],
    [x0 - 0.06, 0.004, z + 0.012],
  ]);
}

/** A school: an L of classrooms and a sports field with a running track. */
export function school(P: Plot, x: number, z: number): void {
  P.add('block', x - 0.1, z - 0.04, 0.2, 0.06, 0.07);
  P.add('block', x - 0.17, z + 0.04, 0.06, 0.12, 0.07);
  P.add('park', x + 0.12, z + 0.02, 0.22, 0.14, 0);
  P.ellipse(x + 0.12, z + 0.02, 0.09, 0.05, 16);
}

/** Shops along a street, with a clinic and a playground at the end. */
export function shops(P: Plot, x: number, z: number, n: number): void {
  for (let i = 0; i < n; i++) P.add('block', x + i * 0.085, z, 0.07, 0.07, P.r(0.04, 0.07));
  P.add('hex', x + n * 0.085 + 0.02, z, 0.09, 0.09, 0.08);
  P.add('park', x + n * 0.085 + 0.13, z, 0.1, 0.08, 0);
  P.add('dome', x + n * 0.085 + 0.13, z, 0.04, 0.04, 0.02);
}

/** A train station on a board's edge, its platform along the track (`rot`, the track's
 *  heading): a platform, a canopy over it and a ticket hall behind. Returns where the
 *  track ends, at platform height. */
export function station(P: Plot, x: number, z: number, rot: number): Vec3 {
  const [c, s] = [Math.cos(rot), Math.sin(rot)];
  const at = (u: number, v: number): [number, number] => [x + u * c - v * s, z + u * s + v * c];
  P.add('block', x, z, 0.34, 0.08, 0.025, 0, rot);
  P.add('hall', x, z, 0.3, 0.08, 0.035, 0.025, rot);
  const [hx, hz] = at(-0.02, 0.1);
  P.add('block', hx, hz, 0.14, 0.07, 0.07, 0, rot);
  for (const u of [-0.12, 0, 0.12]) {
    const [wx, wz] = at(u, -0.02);
    P.workers.push([wx, 0.025, wz]);
  }
  return [x, 0.04, z];
}

/** A substation: a fenced yard of transformers and a capacitor bank. Returns the point its
 *  power lines leave from. */
export function substation(P: Plot, x: number, z: number): Vec3 {
  const [hw, hd] = [0.1, 0.07];
  P.line(x - hw, z - hd, x + hw, z - hd);
  P.line(x + hw, z - hd, x + hw, z + hd);
  P.line(x + hw, z + hd, x - hw, z + hd);
  P.line(x - hw, z + hd, x - hw, z - hd);
  for (let i = 0; i < 3; i++) P.add('block', x - 0.06 + i * 0.06, z - 0.025, 0.035, 0.03, 0.035);
  for (let i = 0; i < 6; i++) P.add('tank', x - 0.07 + i * 0.028, z + 0.035, 0.016, 0.016, 0.03);
  P.add('pylon', x + 0.07, z, 0.03, 0.03, 0.09);
  return [x + 0.07, 0.09, z];
}

/** Power lines on pylons from a substation through the given points, each span sagging a
 *  little; the lines are teal pipes so current is seen to flow. */
export function powerline(P: Plot, from: Vec3, via: [number, number][], h = 0.11): void {
  let last = from;
  for (const [x, z] of via) {
    P.add('pylon', x, z, 0.035, 0.035, h);
    const top: Vec3 = [x, h, z];
    const mid: Vec3 = [(last[0] + x) / 2, (last[1] + h) / 2 - 0.02, (last[2] + z) / 2];
    P.pipe(last, mid, top);
    last = top;
  }
}

/** A datacentre: long data halls with chillers on the roof, generators and cooling tanks. */
export function datacentre(P: Plot, x: number, z: number, halls = 2): void {
  for (let i = 0; i < halls; i++) {
    const hz = z + (i - (halls - 1) / 2) * 0.17;
    P.add('block', x, hz, 0.56, 0.12, 0.07);
    for (let j = 0; j < 7; j++) P.add('cell', x - 0.24 + j * 0.08, hz, 0.05, 0.06, 0.02, 0.07);
  }
  for (let j = 0; j < 4; j++) P.add('block', x + 0.36, z - 0.15 + j * 0.1, 0.07, 0.05, 0.04);
  P.add('tank', x - 0.36, z - 0.08, 0.1, 0.1, 0.1);
  P.add('tank', x - 0.36, z + 0.08, 0.1, 0.1, 0.1);
}

/** A lake with a shore path and a few trees. */
export function lake(P: Plot, x: number, z: number, w: number, d: number): void {
  P.add('lake', x, z, w, d, 0);
  P.ellipse(x, z, w * 0.62, d * 0.62, 24);
  P.trees(x + w * 0.55, z - d * 0.4, w * 0.3, d * 0.3, 3, false);
}

/** An airport along x: runway with its centre line, a parallel taxiway, terminal, control
 *  tower, hangars and fuel tanks. Returns the runway's two ends at ground height. */
export function airport(P: Plot, x: number, z: number, len: number): [Vec3, Vec3] {
  const [x0, x1] = [x - len / 2, x + len / 2];
  for (const dz of [-0.035, 0.035]) P.line(x0, z + dz, x1, z + dz);
  for (let u = x0 + 0.04; u < x1 - 0.06; u += 0.08) P.line(u, z, u + 0.04, z);
  P.line(x0 + 0.06, z + 0.11, x1 - 0.06, z + 0.11);
  for (const u of [x0 + 0.06, x1 - 0.06]) P.line(u, z + 0.035, u, z + 0.11);
  P.add('block', x - 0.05, z + 0.22, 0.42, 0.07, 0.05);
  P.add('hall', x - 0.05, z + 0.22, 0.4, 0.07, 0.03, 0.05);
  P.add('tower', x + 0.26, z + 0.2, 0.035, 0.035, 0.16);
  P.add('hex', x + 0.26, z + 0.2, 0.07, 0.07, 0.03, 0.16);
  for (let i = 0; i < 3; i++) P.add('hall', x0 + 0.12 + i * 0.13, z - 0.17, 0.1, 0.11, 0.06, 0, Math.PI / 2);
  for (let i = 0; i < 3; i++) P.add('tank', x1 - 0.1 - i * 0.06, z - 0.17, 0.045, 0.045, 0.04);
  // Planes parked nose to the runway beside the hangars, a cargo hall past them.
  for (let i = 0; i < 3; i++) P.apron.push([[x0 + 0.58 + i * 0.25, 0, z - 0.36], Math.PI / 2]);
  P.add('hall', x1 - 0.42, z - 0.33, 0.34, 0.14, 0.07);
  // Landside: a hotel, the radar, and a car park in front of the terminal.
  P.add('hex', x - 0.5, z + 0.32, 0.12, 0.12, 0.2);
  P.add('tower', x + 0.62, z + 0.32, 0.03, 0.03, 0.1);
  P.add('dome', x + 0.62, z + 0.32, 0.07, 0.07, 0.035, 0.1);
  for (let i = 0; i <= 5; i++) P.line(x + 0.05 + i * 0.05, z + 0.3, x + 0.05 + i * 0.05, z + 0.4);
  P.line(x + 0.05, z + 0.3, x + 0.3, z + 0.3);
  P.trees(x - 0.75, z + 0.36, 0.3, 0.12, 5, false);
  return [
    [x0 + 0.06, 0, z],
    [x1 - 0.06, 0, z],
  ];
}

/** Give a district a station on its edge facing (tx, tz), with a substation beside it and
 *  a power line in; whatever stood there is cleared. Returns where the train stops. */
export function stationOn(city: District, w: number, d: number, tx: number, tz: number, rng: Rng): Vec3 {
  const [ex, ez] = edgePoint(0, 0, w * 0.9, d * 0.9, tx, tz);
  const len = Math.hypot(tx, tz) || 1;
  const [ux, uz] = [tx / len, tz / len];
  const [cx, cz] = [ex - ux * 0.12, ez - uz * 0.12];
  const [sx, sz] = [cx - uz * 0.26 - ux * 0.08, cz + ux * 0.26 - uz * 0.08];
  city.parts = city.parts.filter((p) => Math.hypot(p.x - cx, p.z - cz) > 0.2 && Math.hypot(p.x - sx, p.z - sz) > 0.13);
  const P = new Plot(rng);
  const stop = station(P, cx, cz, Math.atan2(uz, ux));
  powerline(P, substation(P, sx, sz), [[sx - ux * 0.35, sz - uz * 0.35]]);
  const add = P.done();
  city.parts.push(...add.parts);
  city.traces.push(...add.traces);
  city.pipes = [...(city.pipes ?? []), ...(add.pipes ?? [])];
  city.workers = [...(city.workers ?? []), ...(add.workers ?? [])];
  return stop;
}
