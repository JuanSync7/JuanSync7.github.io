import { Box3, InstancedMesh, Matrix4, Mesh, type Object3D } from 'three';

/** Parts must sit on what holds them. A light belongs on its server's face, a strip on its bar, a
 *  fan inside its case: a part that pokes past its host reads as a mistake (a status light hanging
 *  off the side of a server). `mustSit` measures both in one frame and throws when the part leaves
 *  its host, so a figure that breaks the rule fails its audit at build time instead of on the page.
 *
 *  Boxes are taken in the host's own frame, so a rotated monitor is measured along its own axes.
 *  `axes` names the axes that must hold: a light on a face only has to stay inside the face (`xy`),
 *  since it stands proud of it in z. */

const inv = new Matrix4();
const m = new Matrix4();
const local = new Matrix4();

type Axis = 'x' | 'y' | 'z';
type Axes = 'xyz' | 'xy' | 'xz' | 'yz' | 'x' | 'y' | 'z';

/** The box of `o` (one instance of it, if `instance` is given) in `frame`'s local space. */
export function boxIn(o: Object3D, frame: Object3D, instance = -1): Box3 {
  frame.updateWorldMatrix(true, false);
  o.updateWorldMatrix(true, false);
  inv.copy(frame.matrixWorld).invert();
  const out = new Box3();
  if (!(o instanceof Mesh)) return out.setFromObject(o).applyMatrix4(inv);
  const geo = o.geometry;
  geo.computeBoundingBox();
  const own = geo.boundingBox ?? new Box3();
  if (o instanceof InstancedMesh && instance >= 0) {
    o.getMatrixAt(instance, local);
    m.multiplyMatrices(inv, o.matrixWorld).multiply(local);
  } else m.multiplyMatrices(inv, o.matrixWorld);
  return out.copy(own).applyMatrix4(m);
}

/** Throws when `part` reaches past `host` along `axes` by more than `slack` metres. */
export function mustSit(
  part: Object3D,
  host: Object3D,
  what: string,
  opts: { axes?: Axes; slack?: number; instance?: number } = {},
): void {
  const { axes = 'xyz', slack = 0.001, instance = -1 } = opts;
  within(boxIn(part, host, instance), boxIn(host, host), what, axes, slack);
}

/** Throws when box `p` reaches past box `h` along `axes` by more than `slack`. */
export function within(p: Box3, h: Box3, what: string, axes: Axes = 'xyz', slack = 0.001): void {
  for (const a of axes.split('') as Axis[]) {
    const out = Math.max(h.min[a] - p.min[a], p.max[a] - h.max[a]);
    if (out > slack) throw new Error(`bounds: ${what} pokes ${(out * 1000).toFixed(1)} mm past its host along ${a}`);
  }
}

/** Every mesh under `group` must sit inside `envelope`, a box in the group's own frame. */
export function allInside(group: Object3D, envelope: Box3, what: string, slack = 0.001): void {
  group.traverse((o) => {
    if (o instanceof Mesh && o !== group) within(boxIn(o, group), envelope, `${what} part ${o.id}`, 'xyz', slack);
  });
}

/** `mustSit` for every instance of an instanced part, each against the host `hostOf` names. */
export function allSit(
  part: InstancedMesh,
  hostOf: (i: number) => Object3D,
  what: string,
  opts: { axes?: Axes; slack?: number } = {},
): void {
  for (let i = 0; i < part.count; i++) mustSit(part, hostOf(i), `${what} #${i}`, { ...opts, instance: i });
}
