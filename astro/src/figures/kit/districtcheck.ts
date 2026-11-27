import { Box3 } from 'three';
import { posOf } from './drawing/clash';
import type { Sketch } from './drawing/monoline';
import { riseUnder, SINK, TOL } from './districtlayout';

/** The district's clash check: the kernel's (`Sketch.clashes`, each part's box), except that a
 *  part is held against the terrain by the terrain itself. The terrain is one surface, and its box
 *  covers everything standing near a hill; so a pair of the board and a part is kept only when
 *  the part sinks into the ground under it by more than TOL (its foot below the height field at
 *  any of nine points over its footprint), or into the board's slab. */
export function districtClashes(k: Sketch, ground: ((x: number, z: number) => number) | undefined): string[] {
  const all = k.clashes(TOL);
  if (!ground) return all;
  return all.filter((pair) => {
    const [a, b] = pair.split(' × ');
    const other = a === 'board' ? b : b === 'board' ? a : undefined;
    if (other === undefined) return true;
    return k.parts
      .filter((p) => p.obj === other)
      .some((p) => {
        const box = new Box3().setFromBufferAttribute(posOf(p.geo));
        return box.min.y < -TOL || box.min.y < riseUnder(box, ground) - SINK - TOL;
      });
  });
}
