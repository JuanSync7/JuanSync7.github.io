import { BufferGeometry } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Baked, Layer } from './drawing/monodraw';
import { posOf, type Part, type Sketch } from './drawing/monoline';

/** A big scene's plates (the ground-coloured faces that hide its moving parts) are two thirds of
 *  its baked file and cost little to make, so its build ships only the lines (`plates: false` in
 *  `pages/baked/[scene].json.ts`) and the page merges the plates from the sketch here: about 40 ms
 *  for the lab against the 360 ms its lines take to work out. */

function platesOf(parts: Part[]): Layer['fill'] {
  const out: Layer['fill'] = {};
  for (const fill of ['ground', 'signal'] as const) {
    const geos = parts
      .filter((p) => p.fill === fill)
      .map((p) => new BufferGeometry().setAttribute('position', posOf(p.geo.index ? p.geo.toNonIndexed() : p.geo)));
    if (!geos.length) continue;
    const merged = mergeGeometries(geos);
    geos.forEach((g) => g.dispose());
    out[fill] = Float32Array.from(merged.getAttribute('position').array);
    merged.dispose();
  }
  return out;
}

/** The baked lines of `b` with the plates of the sketch `k` they were baked from. */
export function withPlates(b: Baked, k: Sketch): Baked {
  const live = new Map(k.lives.map((l) => [l.name, l.parts]));
  const out: Baked = {
    root: { fill: platesOf(k.parts), line: b.root.line },
    lives: b.lives.map((l) => ({ ...l, layer: { fill: platesOf(live.get(l.name) ?? []), line: l.layer.line } })),
  };
  [...k.parts, ...k.lives.flatMap((l) => l.parts)].forEach((p) => p.geo.dispose());
  return out;
}

/** The baked drawing without its plates, for the build to ship. */
export const linesOnly = (b: Baked): Baked => ({
  root: { fill: {}, line: b.root.line },
  lives: b.lives.map((l) => ({ ...l, layer: { fill: {}, line: l.layer.line } })),
});
