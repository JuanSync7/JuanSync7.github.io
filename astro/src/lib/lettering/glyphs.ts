/** The characters of the lettering, each drawn as pen strokes along their centre lines on the
 *  ISO 3098 type B grid: one unit is the line width d = h/10, capitals stand 10 units tall on the
 *  baseline (y up), and a standard capital (B, E, H …) is 6 units wide. Drawn from the standard's
 *  published construction rules, not traced from any font. The pen's width and the spacing are
 *  added by `metrics.ts`; a glyph only says where the pen goes. */

export type Point = [number, number];
/** One pen stroke: a polyline. A single point is a dot. */
export type Stroke = Point[];

/** Points along an ellipse centred on (cx, cy), from angle a0 to a1 in degrees (either way round),
 *  about one point per 10°, and always on the quarter points it passes, so a bowl reaches its
 *  exact top, bottom and sides. */
export function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number): Stroke {
  const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 10));
  const [lo, hi] = [Math.min(a0, a1), Math.max(a0, a1)];
  const quarters = Array.from({ length: 17 }, (_, k) => (k - 8) * 90).filter((q) => q > lo && q < hi);
  const steps = Array.from({ length: n + 1 }, (_, k) => a0 + ((a1 - a0) * k) / n);
  const angles = [...new Set([...steps, ...quarters])].sort((p, q) => (a1 > a0 ? p - q : q - p));
  return angles.map((deg): Point => {
    const a = (deg * Math.PI) / 180;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  });
}

const O: Stroke = arc(3, 5, 3, 5, 0, 360);
const P_BOWL: Stroke[] = [
  [
    [0, 0],
    [0, 10],
    [3.5, 10],
  ],
  [...arc(3.5, 7.5, 2.5, 2.5, 90, -90), [0, 5]],
];
const SIX: Stroke[] = [[...arc(3, 5, 3, 5, 55, 180), [0, 3]], arc(3, 3, 3, 3, 0, 360)];

// prettier-ignore
export const GLYPHS: Record<string, Stroke[]> = {
  A: [[[0, 0], [3, 10], [6, 0]], [[1, 3.3], [5, 3.3]]],
  B: [[[3.5, 0], [0, 0], [0, 10], [3.5, 10]], [...arc(3.5, 7.5, 2.5, 2.5, 90, -90), [0, 5]], arc(3.5, 2.5, 2.5, 2.5, 90, -90)],
  C: [arc(3, 5, 3, 5, 40, 320)],
  D: [[[2, 0], [0, 0], [0, 10], [2, 10]], arc(2, 5, 4, 5, 90, -90)],
  E: [[[6, 10], [0, 10], [0, 0], [6, 0]], [[0, 5], [5, 5]]],
  F: [[[6, 10], [0, 10], [0, 0]], [[0, 5], [5, 5]]],
  G: [arc(3, 5, 3, 5, 40, 340), [[3.5, 4.5], [6, 4.5], [6, 3.3]]],
  H: [[[0, 0], [0, 10]], [[6, 0], [6, 10]], [[0, 5], [6, 5]]],
  I: [[[0, 0], [0, 10]]],
  J: [[[5, 10], [5, 2.5], ...arc(2.5, 2.5, 2.5, 2.5, 0, -180).slice(1)]],
  K: [[[0, 0], [0, 10]], [[6, 10], [0, 4]], [[2, 6], [6, 0]]],
  L: [[[0, 10], [0, 0], [5, 0]]],
  M: [[[0, 0], [0, 10], [3.5, 3], [7, 10], [7, 0]]],
  N: [[[0, 0], [0, 10], [6, 0], [6, 10]]],
  O: [O],
  P: P_BOWL,
  Q: [O, [[3.8, 2.2], [6.2, -0.5]]],
  R: [...P_BOWL, [[3, 5], [6, 0]]],
  S: [arc(3, 7.5, 3, 2.5, 30, 270), arc(3, 2.5, 3, 2.5, 90, -150)],
  T: [[[0, 10], [6, 10]], [[3, 10], [3, 0]]],
  U: [[[0, 10], [0, 3], ...arc(3, 3, 3, 3, 180, 360).slice(1), [6, 10]]],
  V: [[[0, 10], [3, 0], [6, 10]]],
  W: [[[0, 10], [2.25, 0], [4.5, 8], [6.75, 0], [9, 10]]],
  X: [[[0, 10], [6, 0]], [[0, 0], [6, 10]]],
  Y: [[[0, 10], [3, 5], [6, 10]], [[3, 5], [3, 0]]],
  Z: [[[0, 10], [6, 10], [0, 0], [6, 0]]],
  // Figures: the zero narrower than the O, the one with a flag and no foot.
  '0': [arc(2.5, 5, 2.5, 5, 0, 360)],
  '1': [[[0, 7], [3, 10], [3, 0]]],
  '2': [[...arc(3, 7, 3, 3, 160, -40), [0, 0], [6, 0]]],
  '3': [arc(3, 7.5, 2.7, 2.5, 150, -90), arc(3, 2.5, 3, 2.5, 90, -150)],
  '4': [[[4.5, 0], [4.5, 10], [0, 3], [6, 3]]],
  '5': [[[5.5, 10], [0.5, 10], [0.2, 5.6], ...arc(3, 3.3, 3, 3.3, 140, -150).slice(1)]],
  '6': SIX,
  '7': [[[0, 10], [6, 10], [2, 0]]],
  '8': [arc(3, 7.6, 2.6, 2.4, 0, 360), arc(3, 2.6, 3, 2.6, 0, 360)],
  '9': SIX.map((s) => s.map(([x, y]): Point => [6 - x, 10 - y])),
  // Marks used on drawings.
  '-': [[[0, 5], [3, 5]]],
  '.': [[[0, 0]]],
  ',': [[[0.5, 0.5], [0, -1.5]]],
  ':': [[[0, 0]], [[0, 6]]],
  '/': [[[0, 0], [4, 10]]],
  '(': [arc(3.5, 5, 3.5, 6.2, 126, 234)],
  ')': [arc(-2, 5, 3.5, 6.2, 54, -54)],
  '\u00D8': [O, [[-0.5, -0.5], [6.5, 10.5]]],
  '\u00B1': [[[3, 9], [3, 3]], [[0, 6], [6, 6]], [[0, 0.5], [6, 0.5]]],
  '\u00B0': [arc(1.5, 8.5, 1.5, 1.5, 0, 360)],
  '=': [[[0, 3.5], [6, 3.5]], [[0, 6.5], [6, 6.5]]],
  '+': [[[3, 2], [3, 8]], [[0, 5], [6, 5]]],
  '\u00D7': [[[0.5, 2.5], [5.5, 7.5]], [[0.5, 7.5], [5.5, 2.5]]],
  "'": [[[0, 10], [0, 7.5]]],
  '"': [[[0, 10], [0, 7.5]], [[2, 10], [2, 7.5]]],
  '#': [[[1.5, 0], [2.5, 10]], [[4, 0], [5, 10]], [[0, 3.3], [6, 3.3]], [[0.5, 6.7], [6.5, 6.7]]],
  '!': [[[0, 10], [0, 3]], [[0, 0]]],
  '?': [[...arc(3, 7.5, 2.5, 2.5, 160, -60), [3, 4], [3, 3]], [[3, 0]]],
  '%': [arc(1.2, 8.3, 1.2, 1.7, 0, 360), [[0, 0], [6, 10]], arc(4.8, 1.7, 1.2, 1.7, 0, 360)],
};
