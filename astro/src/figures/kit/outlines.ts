import { bodyOf, place, type Part } from './city';
import { rig } from './rigs';
import { cone, prism, rect, ring, shell, type Out } from './shells';

/** Outlines of a city's parts (`kit/city.ts`) as line segments, ready for one batch. Each
 *  part is drawn in its own frame (`kit/shells.ts` has the special shapes) and then turned
 *  and lifted into the district's frame, so any kind can stand rotated or on a roof. */

const TAU = Math.PI * 2;
/** A cooling tower is a ruled hyperboloid: straight lines from the base ring to a smaller top
 *  ring, each turned by TWIST. Radii are for a unit part (diameter 1, height 1). */
const TWIST = 1.15;
const [BASE, TOP] = [0.5, 0.33];
const ruled = (a: number, s: number): [number, number] => [
  (1 - s) * BASE * Math.cos(a) + s * TOP * Math.cos(a + TWIST),
  (1 - s) * BASE * Math.sin(a) + s * TOP * Math.sin(a + TWIST),
];
/** The cooling tower's profile as (radius, height) pairs, for a lathe body of the same shape. */
export const COOLER: [number, number][] = Array.from({ length: 9 }, (_, i) => {
  const [x, z] = ruled(0, i / 8);
  return [Math.hypot(x, z), i / 8];
});

/** One part's outline in its own frame. */
function local(o: Out, { kind, w, d, h }: Part): void {
  const [hw, hd] = [w / 2, d / 2];
  const body = bodyOf(kind);
  if (shell(o, kind, w, d, h) || rig(o, kind, w, d, h)) return;
  if (kind === 'cell') {
    // A standard cell is a tile only a few units high: its top is all that reads.
    rect(o, hw, hd, h);
  } else if (kind === 'apartment') {
    // An apartment is see-through: its floors are drawn as rings round the frame.
    const floors = Math.max(2, Math.round(h / 0.04));
    prism(
      o,
      w,
      d,
      h,
      4,
      Array.from({ length: floors + 1 }, (_, f) => f / floors),
    );
  } else if (body === 'box') {
    prism(o, w, d, h, 4);
    // A shed's roof is a row of saw teeth; a house has a gable along x.
    if (kind === 'shed')
      for (let i = 0, n = Math.max(2, Math.round(w / 0.07)); i < n; i++) {
        const [a, b] = [-hw + (w * i) / n, -hw + (w * (i + 1)) / n];
        for (const z of [-hd, hd]) o.push(a, h, z, a, h + 0.035, z, a, h + 0.035, z, b, h, z);
        o.push(a, h + 0.035, -hd, a, h + 0.035, hd);
      }
    if (kind === 'house') {
      const top = h + d * 0.45;
      for (const x of [-hw, hw]) o.push(x, h, -hd, x, top, 0, x, top, 0, x, h, hd);
      o.push(-hw, top, 0, hw, top, 0);
    }
  } else if (body === 'round' || body === 'hex' || body === 'tri') {
    const n = body === 'hex' ? 6 : body === 'tri' ? 3 : 12;
    prism(o, w, d, h, n, kind === 'tower' || kind === 'stack' ? [0, 0.5, 1] : [0, 1]);
    if (kind === 'silo') cone(o, hw, hd, h, h + w * 0.45, 8);
  } else if (body === 'cone') {
    cone(o, hw, hd, 0, h, 7);
  } else if (body === 'dome') {
    for (const a of [0, 0.5, 0.95]) ring(o, Math.sin(a) * h, Math.cos(a) * hw, Math.cos(a) * hd, 16);
    for (let i = 0; i < 6; i++) {
      const c = (i / 6) * TAU;
      for (let j = 0; j < 4; j++) {
        const [a, b] = [(j / 4) * 1.57, ((j + 1) / 4) * 1.57];
        o.push(Math.cos(c) * Math.cos(a) * hw, Math.sin(a) * h, Math.sin(c) * Math.cos(a) * hd);
        o.push(Math.cos(c) * Math.cos(b) * hw, Math.sin(b) * h, Math.sin(c) * Math.cos(b) * hd);
      }
    }
  } else if (body === 'cooler') {
    for (const i of [0, 4, 8]) {
      const [r, y] = COOLER[i] ?? [0.5, 0];
      ring(o, y * h, r * w, r * d, 16);
    }
    for (let i = 0; i < 14; i++) {
      const [bx, bz] = ruled((i / 14) * TAU, 0);
      const [tx, tz] = ruled((i / 14) * TAU, 1);
      o.push(bx * w, 0, bz * d, tx * w, h, tz * d);
    }
  } else if (kind === 'park') {
    rect(o, hw, hd, 0.002);
  } else if (kind === 'pine') {
    cone(o, hw, hd, 0, h, 5);
  } else {
    // A broadleaf tree: a diamond crown on a short trunk.
    const [base, mid, top] = [h * 0.35, h * 0.6, h * 0.9];
    ring(o, mid, hw, hd, 4);
    for (let i = 0; i < 4; i++) {
      const [cx, cz] = [(Math.cos((i / 4) * TAU) * w) / 2, (Math.sin((i / 4) * TAU) * d) / 2];
      o.push(cx, mid, cz, 0, top, 0, cx, mid, cz, 0, base, 0);
    }
    o.push(0, 0, 0, 0, base, 0);
  }
}

/** Every part's outline as segment endpoints (x, y, z, x, y, z, …), for one line batch. */
export function outlines(parts: readonly Part[]): number[] {
  const o: Out = [];
  const one: Out = [];
  for (const p of parts) {
    one.length = 0;
    local(one, p);
    for (let i = 0; i < one.length; i += 3) o.push(...place(p, one[i] ?? 0, one[i + 1] ?? 0, one[i + 2] ?? 0));
  }
  return o;
}
