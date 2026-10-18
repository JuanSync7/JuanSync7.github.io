import { BOUND, inset, type Box, type Pt, type Sketch } from './sketch';

/** The devices of an analog or RF layout, drawn the way simple layouts and textbook plots
 *  show them, for the silicon dive's older and sparser chips (`kit/eras.ts`): bond pads
 *  (and RF probe pads in ground-signal-ground triplets), octagonal spiral inductors,
 *  resistor meanders, capacitor plates, bipolar transistors as nested rectangles,
 *  transistor fingers in a common-centroid pattern, guard rings, and wide straight tracks.
 *  Each takes its size from the seed and returns where it connects. */

/** A contact: a small square crossed. */
export function contact(S: Sketch, x: number, y: number, s: number): void {
  S.rect([x - s, y - s, x + s, y + s], 1);
  S.seg(x - s, y - s, x + s, y + s, 2);
  S.seg(x - s, y + s, x + s, y - s, 2);
}

/** Bond pads along the chosen sides (0 top, 1 right, 2 bottom, 3 left), `size` across,
 *  each with its passivation opening; in threes (ground, signal, ground) if `gsg`. Returns
 *  the pads' centres; `spread` is the pitch in pad widths. */
export function pads(S: Sketch, sides: readonly number[], size: number, gsg = false, spread = 1.9): Pt[] {
  const out: Pt[] = [];
  const b = inset(BOUND, 0.06 + size / 2);
  for (const side of sides) {
    const along = side % 2 === 0;
    const [a0, a1] = along ? [b[0] + 0.1, b[2] - 0.1] : [b[1] + 0.1, b[3] - 0.1];
    const n = gsg
      ? 3 * Math.max(1, Math.floor((a1 - a0) / (size * 6)))
      : Math.max(2, Math.floor((a1 - a0) / (size * spread)));
    const step = (a1 - a0) / n;
    for (let i = 0; i < n; i++) {
      if (gsg && i % 3 === 0 && i > 0) continue;
      const u = a0 + step * (i + 0.5);
      const p: Pt = along ? [u, side === 0 ? b[1] : b[3]] : [side === 3 ? b[0] : b[2], u];
      S.rect([p[0] - size / 2, p[1] - size / 2, p[0] + size / 2, p[1] + size / 2], 1);
      S.rect([p[0] - size / 2.8, p[1] - size / 2.8, p[0] + size / 2.8, p[1] + size / 2.8], 2);
      out.push(p);
    }
  }
  return out;
}

/** An octagonal spiral inductor at (x, y), r across its outer turn, `turns` turns in, with
 *  the underpass out from its centre. */
export function spiral(S: Sketch, x: number, y: number, r: number, turns: number): void {
  const pitch = (r * 0.55) / turns;
  const pts: Pt[] = [];
  for (let k = 0; k <= turns * 8; k++) {
    const rad = (r - (k / 8) * pitch) / Math.cos(Math.PI / 8);
    const a = Math.PI / 8 + (k * Math.PI) / 4;
    pts.push([x + Math.cos(a) * rad, y + Math.sin(a) * rad]);
  }
  for (const w of [0, pitch * 0.45])
    S.poly(
      pts.map(([px, py]): Pt => [x + (px - x) * (1 - w / r), y + (py - y) * (1 - w / r)]),
      1,
    );
  const last = pts[pts.length - 1] ?? [x, y];
  S.seg(last[0], last[1], x + r * 1.15, last[1], 2);
  S.seg(x + r * 1.15, last[1], x + r * 1.15, y, 2);
}

/** A resistor meander filling box b: n legs, up and down, joined at alternate ends. */
export function meander(S: Sketch, b: Box, n: number): void {
  const [x0, y0, x1, y1] = b;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const x = x0 + ((x1 - x0) * (i + 0.5)) / n;
    pts.push(
      ...(i % 2
        ? ([
            [x, y1],
            [x, y0],
          ] as Pt[])
        : ([
            [x, y0],
            [x, y1],
          ] as Pt[])),
    );
  }
  S.poly(pts, 1);
  contact(S, pts[0]?.[0] ?? x0, (pts[0]?.[1] ?? y0) - 0.015, 0.008);
}

/** A capacitor: a top plate over a larger bottom plate, a grid of vias on the top. */
export function capacitor(S: Sketch, b: Box): void {
  S.rect(inset(b, -0.015), 2);
  S.rect(b, 1);
  for (let x = b[0] + 0.03; x < b[2] - 0.01; x += 0.04)
    for (let y = b[1] + 0.03; y < b[3] - 0.01; y += 0.04) S.dot(x, y);
}

/** A bipolar transistor, s across: the collector, the base inside it, the emitter inside
 *  that, a contact in each. Returns its three terminals: collector, base, emitter. */
export function bjt(S: Sketch, x: number, y: number, s: number): [Pt, Pt, Pt] {
  S.rect([x - s, y - s * 0.6, x + s, y + s * 0.6], 1);
  S.rect([x - s * 0.45, y - s * 0.45, x + s * 0.85, y + s * 0.45], 1);
  S.rect([x + s * 0.05, y - s * 0.22, x + s * 0.55, y + s * 0.22], 2);
  const c: Pt = [x - s * 0.75, y];
  const b: Pt = [x - s * 0.2, y];
  const e: Pt = [x + s * 0.3, y];
  for (const p of [c, b, e]) contact(S, p[0], p[1], s * 0.1);
  return [c, b, e];
}

/** Transistor fingers in box b, n of them, gates shared in a common-centroid order (A B B
 *  A ...): A's gates strapped above, B's below, contacts between. */
export function fingers(S: Sketch, b: Box, n: number): void {
  const [x0, y0, x1, y1] = b;
  const d: Box = [x0, y0 + (y1 - y0) * 0.25, x1, y1 - (y1 - y0) * 0.25];
  S.rect(d, 2);
  const pitch = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const x = x0 + pitch * (i + 0.5);
    const a = [0, 3].includes(i % 4);
    S.seg(x, a ? y0 : d[1], x, a ? d[3] : y1, 1);
    if (i < n - 1) contact(S, x + pitch / 2, (d[1] + d[3]) / 2, Math.min(0.01, pitch * 0.15));
  }
  S.seg(x0, y0, x1, y0, 0);
  S.seg(x0, y1, x1, y1, 0);
}

/** A guard ring round box b: two rings with a row of contacts between. */
export function guard(S: Sketch, b: Box): void {
  const [o, i] = [inset(b, -0.03), inset(b, -0.012)];
  S.rect(o, 1);
  S.rect(i, 2);
  for (let x = o[0] + 0.02; x < o[2] - 0.01; x += 0.035)
    for (const y of [(o[1] + i[1]) / 2, (o[3] + i[3]) / 2]) S.dot(x, y);
  for (let y = o[1] + 0.03; y < o[3] - 0.01; y += 0.035)
    for (const x of [(o[0] + i[0]) / 2, (o[2] + i[2]) / 2]) S.dot(x, y);
}

/** A wide metal track from a to b, along x then along y: two edges, `w` apart. */
export function track(S: Sketch, a: Pt, b: Pt, w = 0.02): void {
  for (const k of [-w / 2, w / 2])
    S.poly(
      [
        [a[0], a[1] + k],
        [b[0] + k, a[1] + k],
        [b[0] + k, b[1]],
      ],
      1,
    );
}
