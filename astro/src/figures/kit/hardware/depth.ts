interface Occluder {
  lo: number[];
  hi: number[];
  depth: number;
}
/** Depth is the tie-breaker; a lower overlapping solid must paint before the one above it. */
export function orderSolids<T extends Occluder>(solids: T[]): T[] {
  const incoming = solids.map(() => 0),
    edges = solids.map(() => [] as number[]);
  for (let i = 0; i < solids.length; i++)
    for (let j = i + 1; j < solids.length; j++) {
      const a = solids[i],
        b = solids[j];
      if (!a || !b) continue;
      const x = Math.min(a.hi[0] ?? 0, b.hi[0] ?? 0) - Math.max(a.lo[0] ?? 0, b.lo[0] ?? 0);
      const z = Math.min(a.hi[2] ?? 0, b.hi[2] ?? 0) - Math.max(a.lo[2] ?? 0, b.lo[2] ?? 0);
      if (x <= 0.00001 || z <= 0.00001) continue;
      const ay = ((a.lo[1] ?? 0) + (a.hi[1] ?? 0)) / 2,
        by = ((b.lo[1] ?? 0) + (b.hi[1] ?? 0)) / 2;
      let from = -1,
        to = -1;
      if (ay < by - 0.00001 && (a.hi[1] ?? 0) <= (b.lo[1] ?? 0) + 0.00001) {
        from = i;
        to = j;
      } else if (by < ay - 0.00001 && (b.hi[1] ?? 0) <= (a.lo[1] ?? 0) + 0.00001) {
        from = j;
        to = i;
      }
      if (from >= 0 && to >= 0) {
        edges[from]?.push(to);
        incoming[to] = (incoming[to] ?? 0) + 1;
      }
    }
  const ready = solids.map((_, i) => i).filter((i) => incoming[i] === 0),
    result: T[] = [];
  while (ready.length) {
    ready.sort((a, b) => (solids[b]?.depth ?? 0) - (solids[a]?.depth ?? 0));
    const index = ready.pop();
    if (index === undefined) break;
    const solid = solids[index];
    if (solid) result.push(solid);
    for (const next of edges[index] ?? []) {
      incoming[next] = (incoming[next] ?? 0) - 1;
      if (incoming[next] === 0) ready.push(next);
    }
  }
  return result;
}
