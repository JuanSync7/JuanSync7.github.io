import type { Pt } from './sketch';
const EPS = 1e-7;
const distance = (a: Pt, b: Pt): number => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);

export function channelRoute(
  start: Pt,
  end: Pt,
  xValues: number[],
  yValues: number[],
  legal: (a: Pt, b: Pt) => boolean,
): Pt[] | undefined {
  const xs = [...new Set(xValues)].sort((a, b) => a - b);
  const ys = [...new Set(yValues)].sort((a, b) => a - b);
  const nodes = xs.flatMap((x) => ys.map((y): Pt => [x, y]));
  const index = (p: Pt): number => xs.indexOf(p[0]) * ys.length + ys.indexOf(p[1]);
  const source = index(start),
    target = index(end);
  if (source < 0 || target < 0) return undefined;
  const open = new Set([source]),
    costs = new Map([[source, 0]]),
    prev = new Map<number, number>();
  while (open.size) {
    let at = -1,
      score = Infinity;
    for (const k of open) {
      const p = nodes[k];
      if (!p) continue;
      const estimate = (costs.get(k) ?? Infinity) + distance(p, end);
      if (estimate < score) {
        at = k;
        score = estimate;
      }
    }
    if (at === target) {
      const path: Pt[] = [];
      for (let k: number | undefined = at; k !== undefined; k = prev.get(k)) {
        const p = nodes[k];
        if (p) path.unshift(p);
      }
      return path;
    }
    open.delete(at);
    const p = nodes[at];
    if (!p) break;
    const xi = Math.floor(at / ys.length),
      yi = at % ys.length;
    for (const [xj, yj] of [
      [xi - 1, yi],
      [xi + 1, yi],
      [xi, yi - 1],
      [xi, yi + 1],
    ]) {
      if (xj === undefined || yj === undefined || xj < 0 || yj < 0 || xj >= xs.length || yj >= ys.length) continue;
      const k = xj * ys.length + yj,
        q = nodes[k];
      if (!q || !legal(p, q)) continue;
      const next = (costs.get(at) ?? Infinity) + distance(p, q);
      if (next >= (costs.get(k) ?? Infinity) - EPS) continue;
      costs.set(k, next);
      prev.set(k, at);
      open.add(k);
    }
  }
  return undefined;
}
