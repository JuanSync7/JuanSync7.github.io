import type { NightKey } from '../../styles/tokens/palette.ts';
import type { Rng } from './rng.ts';
import type { Dir, Shape } from './legoswap.ts';

/** The LEGO city's plan and its shaped parts. Buildings are planned as voxels (one voxel = one
 *  stud by two plates), which `legocity.ts` lays as bricks and plates; everything that is not a
 *  box is a shape of catalogue pieces placed here: gable roofs of 45° slopes, domes, onion spires,
 *  trees with rounded crowns, lamps, benches and cars. A part placed "on the ground" waits until
 *  the voxels are done and then stands on whatever is highest under it. */
type T = NightKey;
export type Voxels = Map<string, NightKey>;
export interface Edit {
  vox: Voxels;
  rng: Rng;
  shapes: Shape[];
  /** Parts that stand on the highest voxel under their footprint, placed once the plan is done. */
  later: { cells: [number, number][]; make: (y: number) => Shape[] }[];
}
/** The bottom of voxel layer l in plates: the baseplate is y 0, the street layer y 1. */
export const yOf = (l: number): number => (l <= 0 ? 1 : 2 + 2 * (l - 1));
export const put = (e: Edit, l: number, x: number, z: number, t: T): void => void e.vox.set(`${l}|${x}|${z}`, t);
export const fill = (e: Edit, l: number, x0: number, z0: number, w: number, d: number, t: T): void => {
  for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) put(e, l, x, z, t);
};

/** A tree on the ground: a round trunk, a three-by-three crown rounded with quarter tiles and
 *  1 x 1 slopes, a cone on top. */
export function tree(e: Edit, x: number, z: number, tall = 3): void {
  const crown = (y: number): Shape[] => {
    const top = y + 2;
    const at = (dx: number, dz: number, p: 'quarter' | 'cheese', dir: Dir): Shape =>
      ({ kind: 'part', part: p, x: x + dx, y: top, z: z + dz, w: 1, d: 1, h: p === 'quarter' ? 1 : 2, dir, tone: 'inkSoft' }); // prettier-ignore
    return [
      { kind: 'block', x: x - 1, y, z: z - 1, w: 3, d: 3, h: 2, tone: 'inkSoft' },
      at(-1, -1, 'quarter', 'x-'),
      at(1, -1, 'quarter', 'z-'),
      at(1, 1, 'quarter', 'x+'),
      at(-1, 1, 'quarter', 'z+'),
      at(0, -1, 'cheese', 'z-'),
      at(1, 0, 'cheese', 'x+'),
      at(0, 1, 'cheese', 'z+'),
      at(-1, 0, 'cheese', 'x-'),
      { kind: 'part', part: 'cone', x, y: top, z, w: 1, d: 1, h: 3, tone: 'inkSoft' },
    ];
  };
  e.later.push({
    cells: [[x, z]],
    make: (y) => [{ kind: 'round', x, y, z, size: 1, h: 2 * tall, tone: 'line4' }, ...crown(y + 2 * tall)],
  });
}

/** A street lamp: a round post of two bricks with the light on top. */
export const lamp = (e: Edit, x: number, z: number): void =>
  void e.later.push({
    cells: [[x, z]],
    make: (y) => [
      { kind: 'round', x, y, z, size: 1, h: 6, tone: 'inkMuted' },
      { kind: 'part', part: 'roundtile', x, y: y + 6, z, w: 1, d: 1, h: 1, tone: 'signal' },
    ],
  });

/** A bench: a 1 x 3 seat on a plate, its back a row of 1 x 1 slopes. */
export function bench(e: Edit, x: number, z: number, alongX: boolean): void {
  const [w, d] = alongX ? [3, 1] : [1, 3];
  e.later.push({
    cells: Array.from({ length: 3 }, (_, i): [number, number] => (alongX ? [x + i, z] : [x, z + i])),
    make: (y) => [
      { kind: 'block', x, y, z, w, d, h: 1, tone: 'line4' },
      { kind: 'ramp', x, y: y + 1, z, profile: 'cheese', wid: 3, dir: alongX ? 'z+' : 'x+', tone: 'line4' },
    ],
  });
}

/** A car: a body plate, a curved windscreen and roof, a tiled boot and bonnet. */
export function car(e: Edit, x: number, z: number, alongX: boolean, body: T): void {
  const [w, d] = alongX ? [4, 2] : [2, 4];
  const cells: [number, number][] = [];
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) cells.push([x + i, z + j]);
  e.later.push({
    cells,
    make: (y) => [
      { kind: 'block', x, y, z, w, d, h: 1, tone: body },
      alongX
        ? { kind: 'ramp', x: x + 1, y: y + 1, z, profile: 'curve2', wid: 2, dir: 'x-', tone: 'line4' }
        : { kind: 'ramp', x, y: y + 1, z: z + 1, profile: 'curve2', wid: 2, dir: 'z-', tone: 'line4' },
      alongX
        ? { kind: 'block', x, y: y + 1, z, w: 1, d: 2, h: 1, top: 'tiles', tone: body }
        : { kind: 'block', x, y: y + 1, z, w: 2, d: 1, h: 1, top: 'tiles', tone: body },
      alongX
        ? { kind: 'block', x: x + 3, y: y + 1, z, w: 1, d: 2, h: 1, top: 'tiles', tone: body }
        : { kind: 'block', x, y: y + 1, z: z + 3, w: 2, d: 1, h: 1, top: 'tiles', tone: body },
    ],
  });
}

/** A gable roof on voxel layer l0 over a w x d footprint, its ridge along x (or z): each course a
 *  45° slope from both eaves on the stud row of the course below, the gap between filled so the
 *  next course has studs, closed by 1 x 1 slopes and a tiled ridge. */
export function gable(e: Edit, x0: number, z0: number, w: number, d: number, l0: number, t: T, alongX = true): void {
  const span = alongX ? d : w;
  const len = alongX ? w : d;
  // A run of columns [a, a + n) across the span, at plate height y, as a shape.
  const at = (a: number, n: number, y: number, h: number, top?: 'tiles'): Shape =>
    alongX
      ? { kind: 'block', x: x0, y, z: z0 + a, w: len, d: n, h, tone: t, ...(top ? { top } : {}) }
      : { kind: 'block', x: x0 + a, y, z: z0, w: n, d: len, h, tone: t, ...(top ? { top } : {}) };
  const slope = (a: number, y: number, out: boolean, profile: 'slope45' | 'cheese'): Shape => {
    const dir: Dir = alongX ? (out ? 'z-' : 'z+') : out ? 'x-' : 'x+';
    const run = profile === 'slope45' ? 2 : 1;
    const c = out ? a : a - run + 1;
    return alongX
      ? { kind: 'ramp', x: x0, y, z: z0 + c, profile, wid: len, dir, tone: t }
      : { kind: 'ramp', x: x0 + c, y, z: z0, profile, wid: len, dir, tone: t };
  };
  let y = yOf(l0);
  for (let k = 0; ; k++) {
    const r = span - 2 * k;
    if (r >= 4) {
      e.shapes.push(slope(k, y, true, 'slope45'), slope(span - 1 - k, y, false, 'slope45'));
      if (r > 4) e.shapes.push(at(k + 2, r - 4, y, 3));
      y += 3;
      continue;
    }
    if (r === 3)
      e.shapes.push(slope(k, y, true, 'cheese'), slope(k + 2, y, false, 'cheese'), at(k + 1, 1, y, 2, 'tiles')); // prettier-ignore
    else if (r === 2) e.shapes.push(slope(k, y, true, 'cheese'), slope(k + 1, y, false, 'cheese'));
    else if (r === 1) e.shapes.push(at(k, 1, y, 1, 'tiles'));
    return;
  }
}

/** A dome on voxel layer l0, centred on (cx, cz): the 4 x 4 smooth dome LEGO makes (86500), so
 *  a larger roof steps in to it rather than inventing a bigger dome. */
export function dome(e: Edit, cx: number, cz: number, l0: number, t: T): void {
  e.shapes.push({ kind: 'part', part: 'dome', x: cx - 2, y: yOf(l0), z: cz - 2, w: 4, d: 4, h: 5, tone: t });
}

/** An onion spire on voxel layer l0: a round 2 x 2 brick and a dome, the one bright mark. */
export function spire(e: Edit, x0: number, z0: number, l0: number, t: T, tip: T = 'signal'): void {
  const y = yOf(l0);
  e.shapes.push(
    { kind: 'round', x: x0, y, z: z0, size: 2, h: 3, tone: t },
    { kind: 'part', part: 'dome', x: x0, y: y + 3, z: z0, w: 2, d: 2, h: 3, tone: tip },
  );
}
