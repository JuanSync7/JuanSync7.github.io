import { cuboid, prism, ring, ringAt, type Out } from './shells';

/** Wire outlines for the hub's lower levels and the energy island's reactor, in the part's
 *  own frame like `kit/shells.ts`. Most are dark solids banded in fine white stripes, the
 *  look that gives the boards their contrast: an SRAM macro (a ribbed array either side of
 *  its decoder spine), a server rack (a stripe per unit), a data hall (ribbed cladding and
 *  chillers on the roof), a control building (louvred). Also the reactor (a containment
 *  drum under a ribbed dome, its crane rail, equipment hatch and vent stack), a PLL (an
 *  inductor on a ring) and a crystal cluster for the mines' mineral nodes. */

const TAU = Math.PI * 2;

/** Lines round a box's four faces every `gap`, from y0 to y1: a dark solid's white bands. */
function bands(o: Out, hw: number, hd: number, y0: number, y1: number, gap: number): void {
  for (let y = y0 + gap; y < y1 - gap / 3; y += gap)
    o.push(-hw, y, -hd, hw, y, -hd, hw, y, -hd, hw, y, hd, hw, y, hd, -hw, y, hd, -hw, y, hd, -hw, y, -hd);
}
/** Vertical ribs along the long faces (±z) every `gap`. */
function ribs(o: Out, hw: number, hd: number, h: number, gap: number): void {
  for (let x = -hw + gap; x < hw - gap / 3; x += gap) for (const z of [-hd, hd]) o.push(x, 0, z, x, h, z);
}

export const STRIPED: Record<string, (o: Out, w: number, d: number, h: number) => void> = {
  macro: (o, w, d, h) => {
    const [hw, hd] = [w / 2, d / 2];
    prism(o, w, d, h, 4);
    // The array's rows across the top either side of the spine, and ribs down its sides.
    for (let x = -hw + 0.012; x < hw; x += 0.012)
      for (const z of [-hd, hd * 0.12]) o.push(x, h, z, x, h, z + hd * 0.88);
    cuboid(o, -hw, h, -hd * 0.12, hw, h + 0.01, hd * 0.12);
    ribs(o, hw, hd, h, 0.02);
  },
  rack: (o, w, d, h) => {
    prism(o, w, d, h, 4);
    bands(o, w / 2, d / 2, 0, h, 0.012);
  },
  datahall: (o, w, d, h) => {
    const [hw, hd] = [w / 2, d / 2];
    prism(o, w, d, h, 4);
    ribs(o, hw, hd, h, 0.012);
    for (let x = -hw + 0.04; x < hw - 0.03; x += 0.07) cuboid(o, x, h, -hd * 0.6, x + 0.04, h + 0.02, hd * 0.6);
  },
  louvred: (o, w, d, h) => {
    prism(o, w, d, h, 4);
    bands(o, w / 2, d / 2, 0, h, 0.008);
  },
  reactor: (o, w, d, h) => {
    const [r, dome] = [w / 2, h * 0.55];
    const wall = h - dome;
    prism(o, w, d, wall, 16, [0, 0.33, 0.66, 1]);
    // The dome: rings of latitude and ribs of longitude, the polar crane's rail inside.
    for (const f of [0.35, 0.65, 0.88])
      ring(
        o,
        wall + Math.sin(f * (Math.PI / 2)) * dome,
        Math.cos(f * (Math.PI / 2)) * r,
        Math.cos(f * (Math.PI / 2)) * (d / 2),
        16,
      );
    for (let i = 0; i < 12; i++) {
      const c = (i / 12) * TAU;
      for (let j = 0; j < 4; j++) {
        const [a, b] = [(j / 4) * (Math.PI / 2), ((j + 1) / 4) * (Math.PI / 2)];
        o.push(Math.cos(c) * Math.cos(a) * r, wall + Math.sin(a) * dome, Math.sin(c) * Math.cos(a) * (d / 2));
        o.push(Math.cos(c) * Math.cos(b) * r, wall + Math.sin(b) * dome, Math.sin(c) * Math.cos(b) * (d / 2));
      }
    }
    ringAt(o, 0, wall * 0.95, 0, r * 0.82, 16);
    cuboid(o, r * 0.85, 0, -r * 0.18, r * 1.15, wall * 0.5, r * 0.18);
    prism(o, w * 0.08, d * 0.08, h * 1.3, 8, [0, 0.5, 1]);
  },
  pll: (o, w, d, h) => {
    prism(o, w, d, h, 12);
    for (let k = 0; k < 3; k++) ring(o, h + 0.002, (w / 2) * (0.85 - k * 0.2), (d / 2) * (0.85 - k * 0.2), 8);
  },
  crystal: (o, w, d, h) => {
    // Hexagonal shafts at angles out of a common base, each ending in a point.
    const shafts: [number, number, number][] = [
      [0, 0, 1],
      [0.5, 0.3, 0.7],
      [-0.4, 0.5, 0.6],
      [0.2, -0.5, 0.55],
      [-0.5, -0.3, 0.45],
    ];
    for (const [tx, tz, f] of shafts) {
      const [ex, ey, ez] = [tx * w * 0.5, f * h * 0.82, tz * d * 0.5];
      const s = w * 0.12;
      for (let k = 0; k < 6; k++) {
        const [a, b] = [(k / 6) * TAU, ((k + 1) / 6) * TAU];
        const at = (u: number, t: number, y0: number): [number, number, number] => [
          t * ex + Math.cos(u) * s,
          y0,
          t * ez + Math.sin(u) * s,
        ];
        o.push(...at(a, 0, 0), ...at(a, 1, ey));
        o.push(...at(a, 1, ey), ...at(b, 1, ey));
        o.push(...at(a, 1, ey), ex * 1.08, ey + f * h * 0.18, ez * 1.08);
      }
    }
  },
};
