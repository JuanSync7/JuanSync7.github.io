import { inset, outside, type Seg, type Sketch } from './sketch';
import { paintBridge, paintRiver } from './map-paint';
import type { RegionPlan } from './map-types';

export function paintRegion(S: Sketch, model: RegionPlan): void {
  for (const line of model.contours) {
    for (let i = 1; i < line.points.length; i++) {
      const a = line.points[i - 1];
      const b = line.points[i];
      if (!a || !b) continue;
      let pieces: Seg[] = [[...a, ...b]];
      for (const town of model.towns)
        pieces = pieces.flatMap((segment) => outside(segment, inset(town.bounds, -0.006)));
      for (const segment of pieces) {
        if (Math.hypot(segment[2] - segment[0], segment[3] - segment[1]) > 1e-8)
          S.seg(...segment, line.elevation > 0.79 && line.elevation < 0.81 ? 1 : 2);
      }
    }
  }
  for (const coast of model.coast) S.poly(coast, 0);
  const bridges = [...model.roads.filter((r) => r.bridge), model.railway];
  paintRiver(S, model.river, bridges);
  for (const road of model.roads) {
    const a = road.points[0];
    const b = road.points[1];
    if (!a || !b) continue;
    S.poly(road.points, 1);
    if (road.bridge) paintBridge(S, road, model.river);
  }
  const railY = model.railway.points[0]?.[1];
  if (railY !== undefined) {
    const a = model.railway.points[0];
    const b = model.railway.points[1];
    if (a && b) {
      S.poly(model.railway.points, 2);
      for (let x = a[0] + 0.025; x < b[0]; x += 0.045) S.seg(x, railY - 0.012, x, railY + 0.012, 2);
      paintBridge(S, model.railway, model.river);
      S.poly(model.station.platform, 1);
      S.poly(model.station.access, 2);
    }
  }
  for (const town of model.towns) {
    S.rect(town.bounds, 2);
    for (const street of town.streets) S.poly(street, 2);
    for (const building of town.buildings) S.rect(building, 1);
  }
}
