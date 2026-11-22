import type { Ink, Sketch } from './drawing/monoline';

/** Glassware and small bottles for the lab room (`kit/labroom.ts`), as profiles turned about the
 *  vertical: radius then height, from the foot up and back to the axis, so each is a closed solid.
 *  Glass has no plate (what is behind shows through); the liquid in it is a plate, so the glass's
 *  far side vanishes below the level the way it does in a real one. */

export type Profile = [number, number][];
const GLASS: Ink = { fill: 'none', tier: 'edge' };
const LIQUID: Ink = { fill: 'ground', tier: 'soft' };

/** Cuts a profile at height `level`, pulled in by `inset`: the liquid inside it. */
function fillTo(p: Profile, level: number, inset: number): Profile {
  const out: Profile = [[0, inset]];
  for (let i = 1; i < p.length; i++) {
    const [a, b] = [p[i - 1], p[i]];
    if (!a || !b) continue;
    if (b[1] >= level) {
      const u = (level - a[1]) / (b[1] - a[1] || 1);
      out.push([Math.max(0, a[0] + (b[0] - a[0]) * u - inset), level]);
      break;
    }
    out.push([Math.max(0, b[0] - inset), Math.max(inset, b[1])]);
  }
  out.push([0, level]);
  return out;
}

export const erlenmeyer = (r: number, h: number): Profile => [
  [0, 0],
  [r * 0.94, 0],
  [r, h * 0.04],
  [r * 0.3, h * 0.66],
  [r * 0.26, h * 0.72],
  [r * 0.26, h * 0.95],
  [r * 0.32, h * 0.97],
  [r * 0.32, h],
  [0, h],
];

export const beaker = (r: number, h: number): Profile => [
  [0, 0],
  [r * 0.96, 0],
  [r, h * 0.03],
  [r, h * 0.96],
  [r * 1.06, h],
  [0, h],
];

export function roundFlask(r: number, neck: number, h: number): Profile {
  const out: Profile = [[0, 0]];
  for (let i = 1; i <= 9; i++) {
    const a = -Math.PI / 2 + (i / 10) * (Math.PI - Math.asin(neck / r));
    out.push([Math.cos(a) * r, r + Math.sin(a) * r]);
  }
  return [...out, [neck, h * 0.96], [neck * 1.3, h * 0.98], [neck * 1.3, h], [0, h]];
}

export const testTube = (r: number, h: number): Profile => [
  [0, 0],
  [r * 0.5, r * 0.14],
  [r * 0.86, r * 0.5],
  [r, r],
  [r, h * 0.98],
  [r * 1.15, h],
  [0, h],
];

/** A screw-capped bottle: body, shoulder, neck, cap. */
export const bottle = (r: number, h: number): Profile => [
  [0, 0],
  [r * 0.95, 0],
  [r, h * 0.03],
  [r, h * 0.66],
  [r * 0.82, h * 0.74],
  [r * 0.45, h * 0.8],
  [r * 0.45, h * 0.84],
  [r * 0.52, h * 0.84],
  [r * 0.52, h],
  [0, h],
];

/** A piece of glassware standing on (x, y, z), with liquid up to `level` (0..1 of its height). */
export function glass(k: Sketch, x: number, y: number, z: number, p: Profile, level = 0): void {
  k.lathe(x, y, z, p, GLASS);
  const top = Math.max(...p.map((q) => q[1]));
  if (level > 0) k.lathe(x, y, z, fillTo(p, top * level, Math.max(0.002, top * 0.012)), LIQUID);
}

/** A bottle of something opaque (a reagent, media): a plate, so it hides what is behind. */
export function jar(k: Sketch, x: number, y: number, z: number, r: number, h: number, label = true): void {
  k.lathe(x, y, z, bottle(r, h), { tier: 'edge' });
  if (!label) return;
  // The label: a band round the body, its near half shown.
  for (const v of [0.2, 0.5]) k.circle([x, y + h * v, z], r + 0.001, 'y', 'soft');
}

/** A petri dish: a glass dish with the agar in it, and an optional lid beside it. */
export function dish(k: Sketch, x: number, y: number, z: number, r: number): void {
  k.lathe(x, y, z, [[0, 0], [r, 0], [r, 0.014], [r - 0.002, 0.014], [r - 0.002, 0.002], [0, 0.002]], GLASS); // prettier-ignore
  k.cyl(x, y + 0.002, z, r - 0.003, 0.008, { tier: 'soft' });
}
