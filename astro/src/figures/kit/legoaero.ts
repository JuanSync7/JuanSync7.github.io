import { onHinge, onSide } from './legopose.ts';
import { piece, type Shape } from './legoswap.ts';

/** Wing parts any LEGO car uses: hinged flaps and thin endplates, as sub-assemblies. */

/** A flap: a hinge plate (`chord` deep, 1 or 2) turned round on its partner, tiled on top. A
 *  next flap hangs from a hinge on this one's back row, a plate higher, so a slot opens under it. */
export function flap(
  id: string,
  hinge: Shape,
  angle: number,
  span: number,
  next?: (h: Shape) => Shape,
  chord = 2,
): Shape {
  // prettier-ignore
  const tiles = (d: number): Shape => ({ kind: 'block', x: 0, y: 1, z: 0, w: span, d, h: 1, top: 'tiles', tone: 'ink2' }); // prettier-ignore
  const back: Shape = { kind: 'part', part: 'hinge', x: 0, y: 1, z: 1, w: span, d: 1, h: 1, tone: 'line4' };
  return {
    kind: 'sub',
    id,
    pose: onHinge(piece(hinge), angle),
    shapes: [
      { kind: 'part', part: 'hinge', x: 0, y: 0, z: 0, w: span, d: chord, h: 1, dir: 'x-', tone: 'line4' },
      ...(next && chord === 2 ? [tiles(1), back, next(back)] : [tiles(chord)]),
    ],
  };
}

/** A thin endplate: a plate and its tiles, standing on a bracket's side studs, `tall` studs high. */
export const endplate = (id: string, bracket: Shape, len: number, tall: number): Shape => ({
  kind: 'sub',
  id,
  pose: onSide(piece(bracket)),
  shapes: [{ kind: 'block', x: 0, y: 0, z: 0, w: len, d: tall, h: 2, top: 'tiles', tone: 'inkSoft' }],
});
