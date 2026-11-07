import { inset, type Pt, type Sketch } from './sketch';
import type { MapBlock, MapRoad, MapRiver, UrbanPlan } from './map-types';

/** Banks stop at bridge decks; drawing the water through the deck would flatten the crossing. */
export function paintRiver(S: Sketch, river: MapRiver, bridges: readonly MapRoad[]): void {
  for (const bank of river.banks) {
    for (let i = 1; i < bank.length; i++) {
      const a = bank[i - 1];
      const b = bank[i];
      if (!a || !b) continue;
      const cuts = [0, 1];
      for (const bridge of bridges) {
        const y = bridge.points[0]?.[1];
        if (y === undefined) continue;
        for (const edge of [y - bridge.width / 2 - 0.004, y + bridge.width / 2 + 0.004]) {
          const t = (edge - a[1]) / (b[1] - a[1]);
          if (t > 0 && t < 1) cuts.push(t);
        }
      }
      cuts.sort((x, y) => x - y);
      for (let j = 1; j < cuts.length; j++) {
        const t0 = cuts[j - 1];
        const t1 = cuts[j];
        if (t0 === undefined || t1 === undefined) continue;
        const midY = a[1] + ((b[1] - a[1]) * (t0 + t1)) / 2;
        if (bridges.some((r) => Math.abs(midY - (r.points[0]?.[1] ?? Infinity)) < r.width / 2 + 0.004)) continue;
        S.seg(
          a[0] + (b[0] - a[0]) * t0,
          a[1] + (b[1] - a[1]) * t0,
          a[0] + (b[0] - a[0]) * t1,
          a[1] + (b[1] - a[1]) * t1,
          1,
        );
      }
    }
  }
}

export function paintBridge(S: Sketch, r: MapRoad, river: MapRiver): void {
  const y = r.points[0]?.[1];
  if (y === undefined) return;
  const [x0, , x1] = river.corridor;
  for (const side of [-1, 1]) {
    const yy = y + (side * r.width) / 2;
    S.seg(x0 - 0.025, yy, x1 + 0.025, yy, 1);
    for (const x of [x0 - 0.02, x1 + 0.02]) S.seg(x, yy - 0.008, x, yy + 0.008, 2);
  }
}

function park(S: Sketch, block: MapBlock): void {
  const b = inset(block.bounds, 0.025);
  const [cx, cy] = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
  S.seg(cx, block.bounds[1], cx, block.bounds[3], 2);
  S.seg(block.bounds[0], cy, block.bounds[2], cy, 2);
  const gap = Math.min(0.09, (b[3] - b[1]) / 3);
  if (gap < 0.025) return;
  for (let x = b[0] + gap / 2; x < b[2]; x += gap) {
    for (let y = b[1] + gap / 2; y < b[3]; y += gap) {
      if (Math.abs(x - cx) > 0.025 && Math.abs(y - cy) > 0.025) S.circle(x, y, gap * 0.17, 2);
    }
  }
}

export function paintUrban(S: Sketch, model: UrbanPlan): void {
  const bridges = model.roads.filter((r) => r.bridge);
  if (model.river) paintRiver(S, model.river, bridges);
  for (const r of model.roads) {
    const a = r.points[0];
    const b = r.points[1];
    if (!a || !b) continue;
    S.dashed(a[0], a[1], b[0], b[1], model.kind === 'city' ? 0.018 : 0.04, model.kind === 'city' ? 0.025 : 0.035, 2);
    if (r.bridge && model.river) paintBridge(S, r, model.river);
  }
  for (const block of model.blocks) {
    if (block.kind === 'selected') continue;
    S.rect(block.bounds, model.kind === 'city' ? 2 : 1);
    if (model.kind === 'district') S.rect(inset(block.bounds, 0.012), 2);
    if (block.kind === 'park') {
      park(S, block);
      continue;
    }
    for (const building of block.buildings) {
      const b = building.bounds;
      S.rect(b, 1);
      if (building.kind === 'court') {
        const court = inset(b, Math.min(b[2] - b[0], b[3] - b[1]) * 0.27);
        S.rect(court, 2);
      } else if (model.kind === 'district') {
        S.rect(inset(b, 0.009), 2);
        if (b[2] - b[0] > 0.1 && b[3] - b[1] > 0.09) {
          const ridge: Pt[] = [
            [b[0] + 0.012, (b[1] + b[3]) / 2],
            [b[2] - 0.012, (b[1] + b[3]) / 2],
          ];
          S.poly(ridge, 2);
        }
      }
      S.poly(building.access, 2);
      if (model.kind === 'district') S.dot(building.entry[0], building.entry[1]);
    }
  }
}
