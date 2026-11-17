// One source: JuanSync7/frontend-kit, bricks/src (@juansync7/bricks). A project's copy is synced from it, never edited.
import { onHinge } from './legopose.ts';
import { piece, type Shape } from './legoswap.ts';

/** Wing parts any LEGO car uses: hinged flaps, as sub-assemblies. */

/** The flap hung from this one: made by `make` from the two-finger row it hangs from, which lies
 *  `span` studs long (this flap's span unless given) from `at` along this flap. `top` replaces the
 *  tiles on that row (an actuator's fairing, say). */
export interface Next {
  make: (h: Shape) => Shape;
  at?: number;
  span?: number;
  top?: Shape[];
}

/** A flap: a row of click hinges with one finger (44567), turned round on the row of two-finger
 *  hinges (60471) it hangs from, `span` studs long and a stud in chord, tiled on top. A next flap
 *  hangs from a two-finger row laid on this one in place of the tiles, so the slot between them
 *  is the stud the knuckles take, and the next flap stands a plate higher. A shorter next flap
 *  (`next.span`, from `next.at`) leaves this one tiled either side of its row. */
export function flap(id: string, hinge: Shape, angle: number, span: number, next?: Next): Shape {
  const row = (x: number, y: number, w: number, fingers: 1 | 2): Shape => ({ kind: 'part', part: 'hinge', x, y, z: 0, w, d: 1, h: 1, fingers, tone: 'line4', ...(fingers === 1 ? { dir: 'x-' } : {}) }); // prettier-ignore
  const shapes: Shape[] = [row(0, 0, span, 1)];
  if (!next) shapes.push(flapTiles(1, 0, span));
  else {
    const [at, w] = [next.at ?? 0, next.span ?? span];
    if (at < 0 || at + w > span) throw new Error(`lego: flap ${id}: the next flap's row runs past its ends`);
    const back = row(at, 1, w, 2);
    if (at > 0) shapes.push(flapTiles(1, 0, at));
    if (at + w < span) shapes.push(flapTiles(1, at + w, span - at - w));
    shapes.push(back, ...(next.top ?? [flapTiles(2, at, w)]), next.make(back));
  }
  return { kind: 'sub', id, pose: onHinge(piece(hinge), angle), shapes };
}
/** Tiles over `w` studs of a flap's top row (y plates up its grid), from `x`. */
export const flapTiles = (y: number, x: number, w: number): Shape => ({ kind: 'block', x, y, z: 0, w, d: 1, h: 1, top: 'tiles', tone: 'ink2' }); // prettier-ignore
