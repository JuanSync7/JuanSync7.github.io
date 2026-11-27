import { BufferGeometry, CylinderGeometry, Matrix4 } from 'three';
import { solids } from './boards';
import type { Tris } from './bodies';
import type { Part } from './city';
import { GROUND_SOLIDS } from './groundsolids';
import { local } from './hardsurface';
import { TREE_SOLIDS } from './treesolids';

/** A district part as a solid (`kit/districtsketch.ts`, `kit/districtlayout.ts`): its triangles
 *  in its own frame, the frame it stands in, and how far it reaches. */

/** The unit solids, round bodies at 24 sides (under the kernel's 24° crease, drawn by outline). */
let unit: Record<string, BufferGeometry> | undefined;
const units = (): Record<string, BufferGeometry> =>
  (unit ??= { ...solids().geo, round: new CylinderGeometry(0.5, 0.5, 1, 24).translate(0, 0.5, 0) });

/** How far a part's solid reaches from its centre across its width and its depth (its own frame):
 *  what `separate` keeps apart for a solid drawing, since a solid may reach past the footprint the
 *  generator gave it (a column's platforms, a reactor's annexe). */
const reaches = new Map<string, [number, number]>();
export function reachOf(p: Part): [number, number] {
  const key = `${p.kind}:${p.w}:${p.d}:${p.h}`;
  const hit = reaches.get(key);
  if (hit) return hit;
  const t = solidOf(p);
  let [hw, hd] = [p.w / 2, p.d / 2];
  for (let i = 0; i < t.length; i += 3)
    [hw, hd] = [Math.max(hw, Math.abs(t[i] ?? 0)), Math.max(hd, Math.abs(t[i + 2] ?? 0))];
  reaches.set(key, [hw, hd]);
  return [hw, hd];
}

/** A part's solid as triangles in its own frame: the hard-surface boards' solid, or for the kinds
 *  those boards drew as wire only, the one in `kit/groundsolids.ts`. */
export const solidOf = (p: Part): Tris => {
  const own = TREE_SOLIDS[p.kind] ?? GROUND_SOLIDS[p.kind];
  if (!own) return local(p, units());
  const o: Tris = [];
  own(o, p.w, p.d, p.h);
  return o;
};

/** The frame a part is drawn in: stood at its place, turned by its rot. */
export const frameOf = (p: Part): Matrix4 =>
  new Matrix4().makeTranslation(p.x, p.y ?? 0, p.z).multiply(new Matrix4().makeRotationY(-(p.rot ?? 0)));
