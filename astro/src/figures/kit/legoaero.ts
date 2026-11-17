// One source: JuanSync7/frontend-kit, bricks/src (@juansync7/bricks). A project's copy is synced from it, never edited.
import { onHinge } from './legopose.ts';
import { piece, type Shape } from './legoswap.ts';

/** Wing parts any LEGO car uses: hinged flaps, as sub-assemblies. */

/** A flap: a row of click hinges with one finger (44567), turned round on the row of two-finger
 *  hinges (60471) it hangs from, `span` studs long and a stud in chord, tiled on top. A next flap
 *  hangs from a two-finger row laid on this one in place of the tiles, so the slot between them
 *  is the stud the knuckles take, and the next flap stands a plate higher. `extra` shapes go on the
 *  flap's own grid on the next flap's row, in place of its tiles. */
export function flap(
  id: string,
  hinge: Shape,
  angle: number,
  span: number,
  next?: (h: Shape) => Shape,
  extra: Shape[] = [],
): Shape {
  // prettier-ignore
  const row = (y: number, fingers: 1 | 2): Shape => ({ kind: 'part', part: 'hinge', x: 0, y, z: 0, w: span, d: 1, h: 1, fingers, tone: 'line4', ...(fingers === 1 ? { dir: 'x-' } : {}) }); // prettier-ignore
  const back = row(1, 2);
  const tiles = (y: number): Shape => flapTiles(y, 0, span);
  return {
    kind: 'sub',
    id,
    pose: onHinge(piece(hinge), angle),
    shapes: [row(0, 1), ...(next ? [back, ...(extra.length ? extra : [tiles(2)]), next(back)] : [tiles(1)])],
  };
}

/** Tiles over `w` studs of a flap's top row (y plates up its grid), from `x`. */
export const flapTiles = (y: number, x: number, w: number): Shape => ({ kind: 'block', x, y, z: 0, w, d: 1, h: 1, top: 'tiles', tone: 'ink2' }); // prettier-ignore
