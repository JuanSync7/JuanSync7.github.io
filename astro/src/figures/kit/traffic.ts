import type { InstancedMesh, LineSegments } from 'three';
import { Pen, write } from './boards';
import type { Vec3 } from './camera';
import type { District } from './city';
import { placeVehicle, vehicleSolids } from './movers';
import type { Rng } from './rng';
import { along } from './shapes';

/** Vehicles for city scenes, in the same wire as the buildings: cars, a car still on the
 *  line (a bare chassis), lorries and mine haulers. Every vehicle is a slot in one line batch
 *  (`kit/boards.ts` Pen); each frame the scene says where each slot is and which model it
 *  shows. Models are one unit long along +x, ground at y = 0. */

export type Model = 'car' | 'chassis' | 'lorry' | 'hauler';

const box = (o: number[], x0: number, x1: number, y0: number, y1: number, hw: number): void => {
  const c: Vec3[] = [];
  for (const y of [y0, y1])
    for (const [x, z] of [
      [x0, -hw],
      [x1, -hw],
      [x1, hw],
      [x0, hw],
    ] as const)
      c.push([x, y, z]);
  const e = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7];
  for (const i of e) o.push(...(c[i] ?? [0, 0, 0]));
};
const wheels = (o: number[], xs: number[], hw: number, r: number): void => {
  for (const x of xs)
    for (const z of [-hw, hw]) o.push(x - r, r, z, x, 0, z, x, 0, z, x + r, r, z, x + r, r, z, x - r, r, z);
};

/** Each model's segments, as endpoint triples in its own frame. */
export const MODELS: Record<Model, number[]> = (() => {
  const chassis: number[] = [];
  box(chassis, -0.5, 0.5, 0.08, 0.14, 0.22);
  wheels(chassis, [-0.32, 0.32], 0.24, 0.09);
  const car = [...chassis];
  // The cabin: a sloped glasshouse over the middle of the body.
  car.push(-0.3, 0.3, -0.18, 0.15, 0.3, -0.18, -0.3, 0.3, 0.18, 0.15, 0.3, 0.18);
  for (const z of [-0.18, 0.18]) car.push(-0.42, 0.14, z, -0.3, 0.3, z, 0.15, 0.3, z, 0.32, 0.14, z);
  box(car, -0.5, 0.5, 0.14, 0.18, 0.22);
  const lorry: number[] = [];
  box(lorry, 0.25, 0.5, 0.08, 0.42, 0.2);
  box(lorry, -0.5, 0.2, 0.1, 0.48, 0.22);
  wheels(lorry, [-0.38, -0.2, 0.38], 0.23, 0.08);
  const hauler: number[] = [];
  box(hauler, 0.22, 0.5, 0.1, 0.5, 0.24);
  // The tipping bed: deep at the back, open on top; its side profile, then the cross bars.
  const bed = [-0.5, 0.2, -0.5, 0.55, 0.18, 0.45, 0.18, 0.2];
  for (const z of [-0.26, 0.26])
    for (let i = 0; i < 8; i += 2)
      hauler.push(bed[i] ?? 0, bed[i + 1] ?? 0, z, bed[(i + 2) % 8] ?? 0, bed[(i + 3) % 8] ?? 0, z);
  for (let i = 0; i < 6; i += 2) hauler.push(bed[i] ?? 0, bed[i + 1] ?? 0, -0.26, bed[i] ?? 0, bed[i + 1] ?? 0, 0.26);
  wheels(hauler, [-0.3, 0.35], 0.28, 0.14);
  return { car, chassis, lorry, hauler };
})();
const SLOT = Math.max(...Object.values(MODELS).map((m) => m.length));

export interface Fleet {
  ink: LineSegments;
  /** Each model's solid twin, shown in the hard-surface look (`kit/movers.ts`). */
  solids: Record<string, InstancedMesh>;
  size: number;
}

/** A batch with room for n vehicles, in white. */
export function fleet(n: number): Fleet {
  const pen = new Pen();
  pen.add(new Array(n * SLOT).fill(0), 'inkSoft', 0.85);
  return { ink: pen.lines(), solids: vehicleSolids(n), size: n };
}

/** Put slot i's vehicle at p facing `heading` (radians about the vertical, 0 along +x),
 *  `scale` long. Spare segments of a smaller model fold into a point at its centre. */
export function drive(F: Fleet, i: number, model: Model, p: Vec3, heading: number, scale: number): void {
  const m = MODELS[model];
  const [c, s] = [Math.cos(heading), Math.sin(heading)];
  const out = new Array<number>(SLOT);
  for (let k = 0; k < SLOT; k += 3) {
    const [x, y, z] = k < m.length ? [m[k] ?? 0, m[k + 1] ?? 0, m[k + 2] ?? 0] : [0, 0, 0];
    out[k] = p[0] + (x * c - z * s) * scale;
    out[k + 1] = p[1] + y * scale;
    out[k + 2] = p[2] + (x * s + z * c) * scale;
  }
  write(F.ink, out, (i * SLOT) / 3);
  placeVehicle(F.solids, i, model, p, heading, scale);
}

/** Where a vehicle is u of the way round a closed loop, and which way it faces. */
export function onLoop(loop: readonly Vec3[], u: number): [Vec3, number] {
  const closed = [...loop, loop[0] ?? [0, 0, 0]];
  const [p, q] = [along(closed, ((u % 1) + 1) % 1), along(closed, (((u + 0.004) % 1) + 1) % 1)];
  return [p, Math.atan2(q[2] - p[2], q[0] - p[0])];
}

/** Where a board-local point on stack s's level k is in the world, this frame. */
export type At = (s: number, k: number, p: Vec3) => Vec3;
export interface Ride {
  s: number;
  k: number;
  loop: Vec3[];
  u: number;
  model: Model;
}

/** Every road of every district (`cities[s][k]`) gets `perRoad` vehicles of the stack's
 *  model; every assembly line a row of `onLine` cars being built. */
export function plan(cities: District[][], model: (s: number) => Model, rng: Rng, perRoad = 3, onLine = 7): Ride[] {
  const rides: Ride[] = [];
  cities.forEach((stack, s) =>
    stack.forEach((c, k) => {
      for (const loop of c.roads ?? [])
        for (let n = 0; n < perRoad; n++) rides.push({ s, k, loop, u: n / perRoad + rng() * 0.1, model: model(s) });
      for (const [a, b] of c.lines ?? [])
        for (let n = 0; n < onLine; n++) rides.push({ s, k, loop: [a, b], u: n / onLine, model: 'chassis' });
    }),
  );
  return rides;
}

/** Move every ride to time t. A line runs one way into its far hall; a road loops. A car is
 *  a bare chassis on the first half of the line and gets its body on the second. */
export function move(F: Fleet, rides: readonly Ride[], t: number, at: At): void {
  rides.forEach((r, i) => {
    const line = r.model === 'chassis';
    const u = (r.u + t * (line ? 0.02 : 0.05)) % 1;
    const [p, heading] = line ? [along(r.loop, u), 0] : onLoop(r.loop, u);
    const model = line && u > 0.5 ? 'car' : r.model;
    drive(F, i, model, at(r.s, r.k, p), heading, r.model === 'hauler' ? 0.075 : 0.06);
  });
}
