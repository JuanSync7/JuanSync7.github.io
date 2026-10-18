import { PLANT, TREES } from './plant';
import { cone, cuboid, lattice, prism, rect, ringAt, type Out } from './shells';

/** Wire outlines for heavy machinery (`kit/city.ts` kinds), each in the part's own frame
 *  like `kit/shells.ts`: centred on the origin, ground at y = 0, w across x, d across z, h
 *  tall. Drill rigs, mining shovels, rotary kilns, distillation columns, flares, hoppers
 *  and gantry cranes; `rig` also dispatches to the plant and trees of `kit/plant.ts`. */

const TAU = Math.PI * 2;

const MACHINES: Record<string, (o: Out, w: number, d: number, h: number) => void> = {
  // A drill rig: a skid with its doghouse, a braced mast with the crown block on top, and
  // the drill string down the middle.
  drill: (o, w, d, h) => {
    const [hw, hd] = [w / 2, d / 2];
    cuboid(o, -hw, 0, -hd, hw, h * 0.1, hd);
    cuboid(o, hw * 0.35, h * 0.1, -hd * 0.9, hw * 0.95, h * 0.22, -hd * 0.2);
    const mast: Out = [];
    lattice(mast, w * 0.4, d * 0.4, h * 0.88, 0.45, 0.16);
    for (let i = 0; i < mast.length; i += 3) o.push(mast[i] ?? 0, (mast[i + 1] ?? 0) + h * 0.1, mast[i + 2] ?? 0);
    cuboid(o, -w * 0.08, h * 0.96, -d * 0.08, w * 0.08, h, d * 0.08);
    o.push(0, h * 0.96, 0, 0, 0, 0);
  },
  // A mining shovel: crawler tracks, the house and cab on its turntable, the boom out
  // front and the dipper hanging off the stick.
  excavator: (o, w, d, h) => {
    const [hw, hd] = [w / 2, d / 2];
    for (const s of [-1, 1]) cuboid(o, -hw * 0.75, 0, s * hd * 0.55, hw * 0.55, h * 0.16, s * hd);
    cuboid(o, -hw * 0.8, h * 0.18, -hd * 0.6, hw * 0.25, h * 0.48, hd * 0.6);
    cuboid(o, hw * 0.05, h * 0.48, -hd * 0.6, hw * 0.3, h * 0.66, -hd * 0.1);
    o.push(hw * 0.2, h * 0.4, 0, hw * 0.95, h, 0, hw * 0.95, h, 0, hw * 0.75, h * 0.35, 0);
    o.push(hw * 0.2, h * 0.4, 0, hw * 0.75, h * 0.35, 0);
    cuboid(o, hw * 0.62, h * 0.12, -hd * 0.25, hw, h * 0.36, hd * 0.25);
  },
  // A rotary kiln: a long drum lying a little downhill along x on piers, with tyres.
  kiln: (o, w, d, h) => {
    const [hw, r] = [w / 2, Math.min(d / 2, h * 0.4)];
    const y = (x: number): number => h - r - (x + hw) * 0.08;
    const ax = (x: number, a: number): [number, number, number] => [x, y(x) + Math.sin(a) * r, Math.cos(a) * r];
    for (let i = 0; i <= 6; i++) {
      const x = -hw + (w * i) / 6;
      for (let k = 0; k < 10; k++) o.push(...ax(x, (k / 10) * TAU), ...ax(x, ((k + 1) / 10) * TAU));
    }
    for (let k = 0; k < 4; k++) o.push(...ax(-hw, (k / 4) * TAU), ...ax(hw, (k / 4) * TAU));
    for (const f of [-0.6, 0, 0.6]) cuboid(o, f * hw - 0.01, 0, -r * 0.6, f * hw + 0.01, y(f * hw) - r, r * 0.6);
  },
  // A distillation column: a tall drum banded at every tray, with platforms and a ladder.
  column: (o, w, d, h) => {
    prism(
      o,
      w,
      d,
      h,
      12,
      Array.from({ length: 9 }, (_, i) => i / 8),
    );
    for (const f of [0.3, 0.62, 0.95]) {
      ringAt(o, 0, f * h, 0, w * 0.85, 8);
      ringAt(o, 0, f * h + 0.015, 0, w * 0.85, 8);
    }
    o.push(w * 0.55, 0, 0, w * 0.55, h, 0, w * 0.68, 0, 0, w * 0.68, h, 0);
    cone(o, w / 2, d / 2, h, h + w * 0.3, 8);
  },
  // A flare stack: a slim stack held up by guy wires, its tip lit.
  flare: (o, w, d, h) => {
    prism(o, w * 0.25, d * 0.25, h, 6, [0, 0.5, 1]);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU;
      o.push(0, h * 0.85, 0, Math.cos(a) * w * 2, 0, Math.sin(a) * d * 2);
    }
    cone(o, w * 0.2, d * 0.2, h, h + w * 0.6, 5);
  },
  // A hopper: an ore bin on four legs that trucks tip into, its chute under it.
  hopper: (o, w, d, h) => {
    const [hw, hd] = [w / 2, d / 2];
    for (const [x, z] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ] as const) {
      o.push(x * hw * 0.6, 0, z * hd * 0.6, x * hw * 0.6, h * 0.5, z * hd * 0.6);
      o.push(x * hw, h, z * hd, x * hw * 0.25, h * 0.45, z * hd * 0.25);
    }
    rect(o, hw, hd, h);
    rect(o, hw * 0.25, hd * 0.25, h * 0.45);
    o.push(0, h * 0.45, 0, hw * 0.4, h * 0.2, 0);
  },
  // A gantry crane over a yard: two A-frame legs, the girder across and a hoist.
  crane: (o, w, d, h) => {
    const [hw, hd] = [w / 2, d / 2];
    for (const x of [-hw, hw]) o.push(x, 0, -hd, x, h, 0, x, 0, hd, x, h, 0);
    for (const z of [-0.04, 0.04]) o.push(-hw * 1.15, h, z * d, hw * 1.15, h, z * d);
    cuboid(o, hw * 0.15, h, -d * 0.06, hw * 0.35, h + h * 0.08, d * 0.06);
    o.push(hw * 0.25, h, 0, hw * 0.25, h * 0.35, 0);
  },
};

/** The kinds drawn here. Returns false for a kind it does not draw. */
export function rig(o: Out, kind: string, w: number, d: number, h: number): boolean {
  const f = MACHINES[kind] ?? PLANT[kind] ?? TREES[kind];
  if (!f) return false;
  f(o, w, d, h);
  return true;
}

export const RIG_KINDS = [...Object.keys(MACHINES), ...Object.keys(PLANT), ...Object.keys(TREES)];
