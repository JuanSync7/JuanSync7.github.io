import { BoxGeometry, InstancedMesh, type LineSegments, Matrix4, MeshBasicMaterial, Object3D, type Scene } from 'three';
import { lines, Pen, write } from './boards';
import type { Vec3 } from './camera';
import { hexOf } from './ink';
import { satellite } from './machines';
import { airlinerSolid, guideway, monorailCar, satelliteSolid } from './movers';
import { along } from './shapes';
import { airliner, arc, ends, orbit, rails, strip, timed, type Timed } from './transit';

/** three.js links between the stacks of a city scene (`kit/boards.ts`): monorails between
 *  stations, each with a shuttling train and a teal power conduit slung under its beam (the
 *  grid runs along the tracks); airliners flying circuits from an airport; and wireframe
 *  satellites overhead. Each kind is one batch; the scene says where each link runs. Routes
 *  in the air are not drawn: the moving thing is the route. */

const m4 = new Matrix4();
const dummy = new Object3D();
const CARS = 3;
const SEGS = 28;
/** A satellite's orbit: radius, height, tilt and turn; the n-th is wider, higher, slower. */
const ORBIT = (i: number): [number, number, number, number] => [1.4 + i * 0.3, 2.6 + i * 0.22, 0.3 + i * 0.12, i * 2.1];

const size = (n: number, f: (pts: Vec3[]) => number[]): number => f(arc([0, 0, 0], [1, 0, 0], 0, 0, n)).length / 3;
const railOf = (pts: Vec3[]): number[] => rails(pts, 0.05);

export interface Links {
  track: LineSegments;
  cars: InstancedMesh;
  /** The hard-surface look's guideway, one beam per segment, and its streamlined cars. */
  beam: InstancedMesh;
  coaches: InstancedMesh;
  conduit: LineSegments;
  sparks: InstancedMesh;
  planes: LineSegments[];
  sats: LineSegments[];
}

export function links(scene: Scene, tracks: number, flights: number, sats: number): Links {
  const zeros = (n: number): number[] => new Array(n * 3).fill(0);
  const box = (x: number, y: number, z: number, key: 'inkSoft' | 'signal', n: number): InstancedMesh =>
    new InstancedMesh(new BoxGeometry(x, y, z), new MeshBasicMaterial({ color: hexOf(key) }), n);
  const L: Links = {
    track: lines(zeros(tracks * size(SEGS, railOf)), 'inkFaint', 0.55),
    cars: box(0.05, 0.035, 0.1, 'inkSoft', tracks * CARS),
    beam: guideway(tracks * SEGS),
    coaches: monorailCar(tracks * CARS),
    conduit: lines(zeros(tracks * size(SEGS, strip)), 'signal', 0.55),
    sparks: box(0.018, 0.018, 0.018, 'signal', tracks * 3),
    planes: Array.from({ length: flights }, () => lines(airliner(), 'inkStrong', 0.85)),
    sats: Array.from({ length: sats }, (_, i) => {
      const s = satellite(i / 2, 0);
      const pen = new Pen();
      pen.add(ends(s.body), 'inkFaint', 0.85);
      pen.add(ends(s.hot), 'signal', 0.9);
      return pen.lines();
    }),
  };
  // Each wire model carries its solid twin, shown in the hard-surface look.
  L.planes.forEach((p) => p.add(airlinerSolid()).scale.setScalar(0.3));
  L.sats.forEach((s, i) => s.add(satelliteSolid(0.9 + (i / 2) * 0.4)).scale.setScalar(0.11));
  L.track.userData['look'] = 'wire';
  L.cars.userData['look'] = 'wire';
  scene.add(L.track, L.cars, L.beam, L.coaches, L.conduit, L.sparks, ...L.planes, ...L.sats);
  return L;
}

/** Monorail j between stations a and b. Its train shuttles end to end, dwelling at each
 *  platform; current runs along the conduit under it toward b when `flow` is 1, toward a
 *  when it is -1. */
export function monorail(L: Links, j: number, a: Vec3, b: Vec3, t: number, flow: 1 | -1): void {
  const pts = arc(a, b, 0.25, j % 2 ? 0.35 : -0.35, SEGS);
  write(L.track, railOf(pts), j * size(SEGS, railOf));
  // The guideway: a box beam from each point of the arc to the next.
  for (let i = 0; i + 1 < pts.length; i++) {
    const [p, q] = [pts[i] ?? a, pts[i + 1] ?? b];
    dummy.position.set((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2);
    dummy.lookAt(q[0], q[1], q[2]);
    dummy.scale.set(1, 1, Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]));
    dummy.updateMatrix();
    L.beam.setMatrixAt(j * SEGS + i, dummy.matrix);
  }
  dummy.scale.set(1, 1, 1);
  const under = pts.map((p): Vec3 => [p[0], p[1] - 0.018, p[2]]);
  write(L.conduit, strip(under), j * size(SEGS, strip));
  for (let k = 0; k < 3; k++) {
    const u = (((t * 0.16 * flow + k / 3 + j * 0.13) % 1) + 1) % 1;
    const p = along(under, u);
    L.sparks.setMatrixAt(j * 3 + k, m4.makeTranslation(p[0], p[1], p[2]));
  }
  const phase = (t / 10 + j * 0.31) % 1;
  const u = Math.min(1, Math.max(0, Math.abs(phase * 2 - 1) * 1.25 - 0.12));
  for (let k = 0; k < CARS; k++) {
    const f = Math.min(0.998, Math.max(0.001, u * 0.9 + 0.05 + (k - 1) * 0.018));
    const [p, n] = [along(pts, f), along(pts, f + 0.001)];
    dummy.position.set(p[0], p[1] + 0.03, p[2]);
    dummy.lookAt(n[0], n[1] + 0.03, n[2]);
    dummy.updateMatrix();
    L.cars.setMatrixAt(j * CARS + k, dummy.matrix);
    L.coaches.setMatrixAt(j * CARS + k, dummy.matrix);
  }
}

/** Plane j on its circuit at time t (planes share one circuit, spread round it), facing
 *  where it goes. */
export function flight(L: Links, j: number, path: Timed, t: number): void {
  const period = path[path.length - 1]?.at ?? 1;
  const [p, n] = timed(path, t + (j * period) / L.planes.length);
  L.planes[j]?.position.set(p[0], p[1], p[2]);
  if (Math.hypot(n[0] - p[0], n[2] - p[2]) > 1e-4) L.planes[j]?.lookAt(n[0], n[1], n[2]);
}

/** Satellites round the vertical axis, each facing down at what it watches; then mark the
 *  frame's instance changes. */
export function settle(L: Links, t: number): void {
  L.sats.forEach((g, i) => {
    const [r, y, tilt, turn] = ORBIT(i);
    const p = orbit(r, y, tilt, turn, t * (0.12 - i * 0.025) + i * 2);
    g.position.set(p[0], p[1], p[2]);
    g.lookAt(0, p[1] - 1, 0);
  });
  L.cars.instanceMatrix.needsUpdate = true;
  L.coaches.instanceMatrix.needsUpdate = true;
  L.beam.instanceMatrix.needsUpdate = true;
  L.sparks.instanceMatrix.needsUpdate = true;
}

/** Planes parked at the given spots (a point, and the heading of the nose), `scale` long,
 *  as one batch. */
export function parked(spots: readonly [Vec3, number][], scale: number): LineSegments {
  const model = airliner();
  const out: number[] = [];
  for (const [p, heading] of spots) {
    // The airliner's nose is +z; turn it to face along the heading.
    const [c, s] = [Math.cos(heading - Math.PI / 2), Math.sin(heading - Math.PI / 2)];
    for (let i = 0; i < model.length; i += 3) {
      const [x, y, z] = [model[i] ?? 0, model[i + 1] ?? 0, model[i + 2] ?? 0];
      out.push(p[0] + (x * c - z * s) * scale, p[1] + (y + 0.06) * scale, p[2] + (x * s + z * c) * scale);
    }
  }
  const ink = lines(out, 'inkStrong', 0.7);
  for (const [p, heading] of spots) {
    const m = airlinerSolid();
    m.position.set(p[0], p[1] + 0.06 * scale, p[2]);
    m.rotation.y = Math.PI / 2 - heading;
    m.scale.setScalar(scale);
    ink.add(m);
  }
  return ink;
}
