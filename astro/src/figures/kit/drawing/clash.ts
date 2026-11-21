// One source: the experience vault's Playbooks/drawing/kernel. A project's copy is synced from it, never edited.
import { Box3, Float32BufferAttribute, Matrix3, Vector3, type BufferGeometry, type Matrix4 } from 'three';
import { OBB } from 'three/examples/jsm/math/OBB.js';
import type { Live, Part, V3 } from './monoline';

/** The clash check of the hidden-line pen (monoline.ts, R-FIG-31): no part of one object stands
 *  inside a part of another. */

/** A geometry's positions as a plain float attribute. */
export const posOf = (g: BufferGeometry): Float32BufferAttribute => {
  const p = g.getAttribute('position');
  return p instanceof Float32BufferAttribute ? p : new Float32BufferAttribute(Array.from(p.array), 3);
};

/** A box in a frame's local space, as an oriented box in the world. (OBB.applyMatrix4 moves the
 *  centre by the translation alone, which is wrong for a box off its frame's origin in a turned
 *  frame, so the centre is carried through the whole matrix here.) */
export function oriented(box: Box3, m: Matrix4): OBB {
  const [x, y, z] = [new Vector3(), new Vector3(), new Vector3()];
  m.extractBasis(x, y, z);
  const [lx, ly, lz] = [x.length() || 1, y.length() || 1, z.length() || 1];
  const half = box
    .getSize(new Vector3())
    .multiplyScalar(0.5)
    .multiply(new Vector3(lx, ly, lz));
  const rot = new Matrix3().set(
    x.x / lx,
    y.x / ly,
    z.x / lz,
    x.y / lx,
    y.y / ly,
    z.y / lz,
    x.z / lx,
    y.z / ly,
    z.z / lz,
  );
  return new OBB(box.getCenter(new Vector3()).applyMatrix4(m), half, rot);
}

/** Every pair of parts from different objects that stand in each other by more than `tol`.
 *  Each part is tested as its own box turned with it (an oriented box), shrunk by `tol / 2`
 *  on every side, so touching passes: a flask stands on the bench, it does not stand in it. A
 *  round part is tested as the box round it, so keep a hair of air between round neighbours. */
export function clashesOf(parts: Part[], lives: Live[], tol = 0.002): string[] {
  const shrunk = (p: Part, at: V3 = [0, 0, 0]): { obj: string; b: OBB; w: Box3 } => {
    const b = p.obb.clone();
    b.center.add(new Vector3(...at));
    b.halfSize.subScalar(tol / 2).max(new Vector3());
    return {
      obj: p.obj,
      b,
      w: new Box3().setFromBufferAttribute(posOf(p.geo)).translate(new Vector3(...at)),
    };
  };
  const all = [...parts.map((p) => shrunk(p)), ...lives.flatMap((l) => l.parts.map((p) => shrunk(p, l.pivot)))];
  const out = new Set<string>();
  for (let i = 0; i < all.length; i++)
    for (let j = i + 1; j < all.length; j++) {
      const [p, q] = [all[i], all[j]];
      if (!p || !q || p.obj === q.obj || !p.w.intersectsBox(q.w)) continue;
      if (p.b.intersectsOBB(q.b)) out.add(`${p.obj} × ${q.obj}`);
    }
  return [...out];
}
