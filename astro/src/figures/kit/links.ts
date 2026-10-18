import { BoxGeometry, InstancedMesh, type LineSegments, Matrix4, MeshBasicMaterial, Object3D, type Scene } from 'three';
import { lines, Pen, write } from './boards';
import type { Vec3 } from './camera';
import { hexOf } from './ink';
import { satellite } from './machines';
import { along } from './shapes';
import { airliner, arc, ends, orbit, rails, strip } from './transit';

/** three.js links between the stacks of a city scene (`kit/boards.ts`): monorails with a
 *  shuttling train, power cables sagging from a plant with current pulsing along them,
 *  airliners flying out and back on high arcs, and wireframe satellites on tilted orbits
 *  overhead. Each kind is one batch; the scene says where each link runs, every frame. */

const m4 = new Matrix4();
const dummy = new Object3D();
const CARS = 3;
const SEGS = 28;
const FLIGHT = 40;
/** A satellite's orbit: radius, height, tilt and turn; the n-th is wider, higher, slower. */
const ORBIT = (i: number): [number, number, number, number] => [1.4 + i * 0.3, 2.5 + i * 0.22, 0.3 + i * 0.12, i * 2.1];

const size = (n: number, f: (pts: Vec3[]) => number[]): number => f(arc([0, 0, 0], [1, 0, 0], 0, 0, n)).length / 3;
const railOf = (pts: Vec3[]): number[] => rails(pts, 0.05);

export interface Links {
  track: LineSegments;
  cars: InstancedMesh;
  cable: LineSegments;
  sparks: InstancedMesh;
  route: LineSegments;
  planes: LineSegments[];
  sats: LineSegments[];
}

export function links(scene: Scene, tracks: number, cables: number, flights: number, sats: number): Links {
  const zeros = (n: number): number[] => new Array(n * 3).fill(0);
  const box = (x: number, y: number, z: number, key: 'inkSoft' | 'signal', n: number): InstancedMesh =>
    new InstancedMesh(new BoxGeometry(x, y, z), new MeshBasicMaterial({ color: hexOf(key) }), n);
  const L: Links = {
    track: lines(zeros(tracks * size(SEGS, railOf)), 'inkFaint', 0.55),
    cars: box(0.05, 0.035, 0.1, 'inkSoft', tracks * CARS),
    cable: lines(zeros(cables * size(SEGS, strip)), 'signal', 0.5),
    sparks: box(0.022, 0.022, 0.022, 'signal', cables * 2),
    route: lines(zeros(flights * size(FLIGHT, strip)), 'inkFaint', 0.16),
    planes: Array.from({ length: flights }, () => lines(airliner(), 'inkStrong', 0.85)),
    sats: Array.from({ length: sats }, (_, i) => {
      const s = satellite(i / 2, 0);
      const pen = new Pen();
      pen.add(ends(s.body), 'inkFaint', 0.85);
      pen.add(ends(s.hot), 'signal', 0.9);
      return pen.lines();
    }),
  };
  L.planes.forEach((p) => p.scale.setScalar(0.3));
  L.sats.forEach((s) => s.scale.setScalar(0.11));
  const rings = L.sats.flatMap((_, i) => {
    const [r, y, tilt, turn] = ORBIT(i);
    return strip(Array.from({ length: 65 }, (_, k) => orbit(r, y, tilt, turn, (k / 64) * Math.PI * 2)));
  });
  scene.add(L.track, L.cars, L.cable, L.sparks, L.route, ...L.planes, ...L.sats, lines(rings, 'inkFaint', 0.14));
  return L;
}

/** Monorail j from a to b; its train shuttles end to end, dwelling at each platform. */
export function monorail(L: Links, j: number, a: Vec3, b: Vec3, t: number): void {
  const pts = arc(a, b, 0.25, j % 2 ? 0.35 : -0.35, SEGS);
  write(L.track, railOf(pts), j * size(SEGS, railOf));
  const phase = (t / 10 + j * 0.31) % 1;
  const u = Math.min(1, Math.max(0, Math.abs(phase * 2 - 1) * 1.25 - 0.12));
  for (let k = 0; k < CARS; k++) {
    const f = Math.min(0.998, Math.max(0.001, u * 0.9 + 0.05 + (k - 1) * 0.018));
    const [p, n] = [along(pts, f), along(pts, f + 0.001)];
    dummy.position.set(p[0], p[1] + 0.03, p[2]);
    dummy.lookAt(n[0], n[1] + 0.03, n[2]);
    dummy.updateMatrix();
    L.cars.setMatrixAt(j * CARS + k, dummy.matrix);
  }
}

/** Power cable j from a to b, sagging between them, two pulses of current running along. */
export function cable(L: Links, j: number, a: Vec3, b: Vec3, t: number): void {
  const pts = arc(a, b, -0.4, 0, SEGS);
  write(L.cable, strip(pts), j * size(SEGS, strip));
  [0, 0.5].forEach((o, k) => {
    const p = along(pts, (t * 0.2 + o + j * 0.13) % 1);
    L.sparks.setMatrixAt(j * 2 + k, m4.makeTranslation(p[0], p[1], p[2]));
  });
}

/** Flight j between a and b: out and back on a high arc, the plane facing where it flies. */
export function flight(L: Links, j: number, a: Vec3, b: Vec3, t: number): void {
  const pts = arc(a, b, 1.1, 0.5, FLIGHT);
  write(L.route, strip(pts), j * size(FLIGHT, strip));
  const cyc = (t / 16 + j * 0.37) % 1;
  const u = cyc < 0.5 ? cyc * 2 : 2 - cyc * 2;
  const ahead = cyc < 0.5 ? Math.min(1, u + 0.01) : Math.max(0, u - 0.01);
  const [p, n] = [along(pts, u), along(pts, ahead)];
  L.planes[j]?.position.set(p[0], p[1], p[2]);
  L.planes[j]?.lookAt(n[0], n[1], n[2]);
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
  L.sparks.instanceMatrix.needsUpdate = true;
}
