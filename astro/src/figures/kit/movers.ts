import { InstancedMesh, Matrix4, Mesh, Vector3, type Object3D } from 'three';
import type { Vec3 } from './camera';
import { beam, cuboid, loft, ring, type Tris } from './bodies';
import { tonedMesh } from './hardsurface';

/** Solid twins for what moves in a city scene, for the hard-surface look: the vehicles of
 *  `kit/traffic.ts`, the airliners and satellites of `kit/links.ts`. Each is built along the
 *  same lines as its wire model, so the wire stays drawn on it as detail and the solid only
 *  hides what is behind. Every solid twin is tagged `look: 'solid'`; `showLook` shows one
 *  look's objects in a scene and hides the other's. */

export type Look = 'wire' | 'solid';

/** Show the objects of one look and hide the other's: anything tagged with a look. */
export function showLook(root: Object3D, look: Look): void {
  root.traverse((o) => {
    const tag = o.userData['look'];
    if (tag === 'wire' || tag === 'solid') o.visible = tag === look;
  });
}
const solid = <T extends Object3D>(o: T): T => {
  o.userData['look'] = 'solid';
  o.visible = false;
  return o;
};

/** An airliner along +z, nose forward, as `kit/transit.ts` draws it: a six-sided fuselage
 *  through the same rings, swept wings, tailplane and a fin. */
export function airlinerSolid(): Mesh {
  const o: Tris = [];
  const at = (z: number, r: number): Vec3[] => ring(6, r, r, 0).map(([x, , y]): Vec3 => [x, y, z]);
  loft(o, [at(-0.5, 0.02), at(-0.3, 0.06), at(0.3, 0.06), at(0.45, 0.03), at(0.5, 0.002)]);
  for (const s of [1, -1]) {
    loft(o, [
      [
        [0.05 * s, -0.004, 0.12],
        [0.5 * s, 0.016, -0.12],
        [0.5 * s, 0.016, -0.2],
        [0.05 * s, -0.004, -0.08],
      ],
      [
        [0.05 * s, 0.004, 0.12],
        [0.5 * s, 0.024, -0.12],
        [0.5 * s, 0.024, -0.2],
        [0.05 * s, 0.004, -0.08],
      ],
    ]);
    cuboid(o, Math.min(0.02 * s, 0.18 * s), -0.003, -0.52, Math.max(0.02 * s, 0.18 * s), 0.003, -0.38);
  }
  beam(o, [0, 0.04, -0.42], [0, 0.16, -0.5], 0.012);
  return solid(tonedMesh(o));
}

/** A satellite: its bus, two solar wings and the dish on top. */
export function satelliteSolid(span: number): Mesh {
  const o: Tris = [];
  cuboid(o, -0.22, -0.22, -0.22, 0.22, 0.32, 0.22);
  for (const s of [1, -1])
    cuboid(o, Math.min(s * 0.3, s * span), -0.18, -0.01, Math.max(s * 0.3, s * span), 0.18, 0.01);
  // A shallow cone stands for the dish's bowl.
  const bowl = ring(16, 0.26, 0.26, 0.55);
  loft(o, [ring(16, 0.04, 0.04, 0.45), bowl], false);
  return solid(tonedMesh(o));
}

/** The vehicles, one unit long along +x, as `kit/traffic.ts` draws them. */
const VEHICLES: Record<string, Tris> = (() => {
  const chassis: Tris = [];
  cuboid(chassis, -0.5, 0.08, -0.22, 0.5, 0.14, 0.22);
  for (const x of [-0.32, 0.32])
    for (const z of [-0.24, 0.24]) cuboid(chassis, x - 0.09, 0, z - 0.03, x + 0.09, 0.12, z + 0.03);
  const car: Tris = [...chassis];
  cuboid(car, -0.5, 0.14, -0.22, 0.5, 0.18, 0.22);
  loft(car, [
    [
      [-0.42, 0.18, -0.18],
      [0.32, 0.18, -0.18],
      [0.32, 0.18, 0.18],
      [-0.42, 0.18, 0.18],
    ],
    [
      [-0.3, 0.3, -0.18],
      [0.15, 0.3, -0.18],
      [0.15, 0.3, 0.18],
      [-0.3, 0.3, 0.18],
    ],
  ]);
  const lorry: Tris = [];
  cuboid(lorry, 0.25, 0.08, -0.2, 0.5, 0.42, 0.2);
  cuboid(lorry, -0.5, 0.1, -0.22, 0.2, 0.48, 0.22);
  for (const x of [-0.38, -0.2, 0.38])
    for (const z of [-0.23, 0.23]) cuboid(lorry, x - 0.08, 0, z - 0.03, x + 0.08, 0.11, z + 0.03);
  const hauler: Tris = [];
  cuboid(hauler, 0.22, 0.1, -0.24, 0.5, 0.5, 0.24);
  const bed = (z: number): Vec3[] => [
    [-0.5, 0.2, z],
    [0.18, 0.2, z],
    [0.18, 0.45, z],
    [-0.5, 0.55, z],
  ];
  loft(hauler, [bed(-0.26), bed(0.26)]);
  for (const x of [-0.3, 0.35])
    for (const z of [-0.28, 0.28]) cuboid(hauler, x - 0.14, 0, z - 0.04, x + 0.14, 0.2, z + 0.04);
  return { car, chassis, lorry, hauler };
})();

/** One instanced solid per vehicle model, n slots each, all hidden until placed. */
export function vehicleSolids(n: number): Record<string, InstancedMesh> {
  const out: Record<string, InstancedMesh> = {};
  for (const [k, tris] of Object.entries(VEHICLES)) {
    const m = tonedMesh(tris);
    const im = solid(new InstancedMesh(m.geometry, m.material, n));
    for (let i = 0; i < n; i++) im.setMatrixAt(i, ZERO);
    out[k] = im;
  }
  return out;
}
const ZERO = new Matrix4().makeScale(0, 0, 0);
const m4 = new Matrix4();
const r4 = new Matrix4();
const v3 = new Vector3();

/** Slot i shows `model` at p facing `heading` (as `kit/traffic.ts` turns its wire), `scale`
 *  long; the other models' slot i is emptied. */
export function placeVehicle(
  solids: Record<string, InstancedMesh>,
  i: number,
  model: string,
  p: Vec3,
  heading: number,
  scale: number,
): void {
  for (const [k, im] of Object.entries(solids)) {
    if (k !== model) im.setMatrixAt(i, ZERO);
    else
      im.setMatrixAt(
        i,
        m4.makeTranslation(p[0], p[1], p[2]).multiply(r4.makeRotationY(-heading)).scale(v3.setScalar(scale)),
      );
    im.instanceMatrix.needsUpdate = true;
  }
}

/** A monorail's guideway, n segments: a box beam one unit long along +z, scaled to each. */
export function guideway(n: number): InstancedMesh {
  const o: Tris = [];
  cuboid(o, -0.012, 0, -0.5, 0.012, 0.024, 0.5);
  const m = tonedMesh(o);
  return solid(new InstancedMesh(m.geometry, m.material, n));
}

/** A monorail car along +z, its nose and tail drawn in, its skirt down either side of the beam. */
export function monorailCar(n: number): InstancedMesh {
  const o: Tris = [];
  const at = (z: number, k: number): Vec3[] =>
    ring(8, 0.025 * k, 0.02 * k, 0, Math.PI / 8).map(([x, , y]): Vec3 => [x, 0.006 + y, z]);
  loft(o, [at(-0.05, 0.35), at(-0.04, 0.9), at(-0.032, 1), at(0.032, 1), at(0.04, 0.9), at(0.05, 0.35)]);
  for (const s of [-1, 1]) cuboid(o, s > 0 ? 0.012 : -0.02, -0.03, -0.035, s > 0 ? 0.02 : -0.012, -0.005, 0.035);
  const m = tonedMesh(o);
  return solid(new InstancedMesh(m.geometry, m.material, n));
}
