import type { Box, Pt, Seg } from './sketch';

function interval(s: Seg, [X0, Y0, X1, Y1]: Box): [number, number] | null {
  const [x0, y0, x1, y1] = s;
  const [dx, dy] = [x1 - x0, y1 - y0];
  let [t0, t1] = [0, 1];
  for (const [p, q] of [
    [-dx, x0 - X0],
    [dx, X1 - x0],
    [-dy, y0 - Y0],
    [dy, Y1 - y0],
  ] as const) {
    if (p === 0) {
      if (q < 0) return null;
    } else if (p < 0) t0 = Math.max(t0, q / p);
    else t1 = Math.min(t1, q / p);
  }
  return t0 >= t1 ? null : [t0, t1];
}

const pointAt = ([x0, y0, x1, y1]: Seg, t: number): Pt => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];

/** The parts of a segment outside a box (Liang–Barsky): none, one or two pieces. */
export function outside(s: Seg, box: Box): Seg[] {
  const cut = interval(s, box);
  if (!cut) return [s];
  const [t0, t1] = cut;
  const [x0, y0, x1, y1] = s;
  const out: Seg[] = [];
  if (t0 > 1e-6) out.push([x0, y0, ...pointAt(s, t0)]);
  if (t1 < 1 - 1e-6) out.push([...pointAt(s, t1), x1, y1]);
  return out;
}

export function inside(s: Seg, box: Box): Seg[] {
  const cut = interval(s, box);
  if (!cut) return [];
  const kept: Seg = [...pointAt(s, cut[0]), ...pointAt(s, cut[1])];
  return Math.hypot(kept[2] - kept[0], kept[3] - kept[1]) > 1e-10 ? [kept] : [];
}
