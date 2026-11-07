import {
  validBox,
  insideBox,
  boxOverlapInterior,
  routeHitsBoxInterior,
  orthogonalRoute,
  pointOnPolyline,
  polylineSegments,
  segmentIntersection,
  samePoint,
  reachable,
} from './geometry.mjs';

const BOUND = [-1.86, -0.9, 1.86, 0.9];
const key = (p) => p.map((v) => Math.round(v * 1e7)).join(',');
const contains = (a, b) => insideBox(a.slice(0, 2), b) && insideBox(a.slice(2), b);
const corners = (b) => [
  [b[0], b[1]],
  [b[2], b[1]],
  [b[2], b[3]],
  [b[0], b[3]],
];
const boundary = (p, b) => pointOnPolyline(p, [...corners(b), corners(b)[0]]);

export function inspectMap(model) {
  const issues = [];
  const fail = (condition, message) => {
    if (condition) issues.push(message);
  };
  fail(!validBox(model.selected) || !contains(model.selected, BOUND), 'selection: invalid or outside bounds');
  fail(model.roads.length < 2, 'roads: empty graph');
  const edges = [];
  for (const road of model.roads) {
    fail(!orthogonalRoute(road.points) || road.width <= 0, `road ${road.id}: malformed`);
    fail(
      road.points.some((p) => !insideBox(p, BOUND)),
      `road ${road.id}: outside bounds`,
    );
    fail(routeHitsBoxInterior(road.points, model.selected), `road ${road.id}: crosses selection`);
    edges.push([key(road.points[0]), key(road.points.at(-1))]);
    if (model.river) {
      const hits = model.river.banks.map((bank) =>
        polylineSegments(bank).some((s) =>
          polylineSegments(road.points).some((r) => segmentIntersection(s, r).type !== 'none'),
        ),
      );
      fail(hits.some(Boolean) && !road.bridge, `road ${road.id}: water crossing without bridge`);
      fail(road.bridge && !hits.every(Boolean), `road ${road.id}: bridge does not span both banks`);
    }
  }
  const connected = reachable(edges[0]?.[0], edges);
  fail(new Set(edges.flat()).size !== connected.size, 'roads: disconnected graph');
  if (model.kind === 'region') inspectRegion(model, fail);
  else inspectUrban(model, fail);
  return issues;
}

function inspectUrban(model, fail) {
  const selected = model.blocks.filter((b) => b.kind === 'selected');
  fail(
    selected.length !== 1 || selected.some((b) => b.bounds.some((v, i) => Math.abs(v - model.selected[i]) > 1e-7)),
    'selection: must be one actual block',
  );
  const buildings = model.blocks.flatMap((b) => b.buildings);
  for (const [i, block] of model.blocks.entries()) {
    fail(!validBox(block.bounds) || !contains(block.bounds, BOUND), `block ${i}: invalid bounds`);
    fail(
      model.blocks.slice(i + 1).some((b) => boxOverlapInterior(b.bounds, block.bounds)),
      `block ${i}: overlap`,
    );
    fail(model.river && boxOverlapInterior(block.bounds, model.river.corridor), `block ${i}: occupies water corridor`);
    fail(
      model.roads.some((r) => routeHitsBoxInterior(r.points, block.bounds)),
      `block ${i}: road crosses interior`,
    );
    for (const b of block.buildings) {
      fail(!validBox(b.bounds) || !contains(b.bounds, block.bounds), `block ${i}: building outside parcel`);
      fail(!boundary(b.entry, b.bounds) || !samePoint(b.entry, b.access[0]), `block ${i}: entry detached`);
      fail(!boundary(b.access.at(-1), block.bounds), `block ${i}: access misses frontage`);
      fail(
        b.access.some((p) => !insideBox(p, block.bounds)),
        `block ${i}: access outside parcel`,
      );
      fail(
        buildings.some((other) => other !== b && routeHitsBoxInterior(b.access, other.bounds)),
        `block ${i}: access crosses another building`,
      );
      fail(
        buildings.some((other) => other !== b && boxOverlapInterior(b.bounds, other.bounds)),
        `block ${i}: overlapping buildings`,
      );
    }
    fail(
      (block.kind === 'selected' || block.kind === 'park') && block.buildings.length > 0,
      `block ${i}: occupied reserve`,
    );
  }
}

function inspectRegion(model, fail) {
  fail(model.coast.length === 0 || model.contours.length < 4, 'terrain: missing coast or elevations');
  for (const line of [...model.contours, ...model.coast.map((points) => ({ points, elevation: 0 }))]) {
    fail(
      line.points.length < 2 || line.points.some((p) => !insideBox(p, BOUND)),
      'contour: malformed or out of bounds',
    );
    fail(
      line.points.some((p) => Math.abs(model.elevation(...p) - line.elevation) > 0.025),
      'contour: does not follow shared elevation',
    );
    fail(
      !samePoint(line.points[0], line.points.at(-1), 1e-6) &&
        (!boundary(line.points[0], BOUND) || !boundary(line.points.at(-1), BOUND)),
      'contour: hanging endpoint',
    );
  }
  fail(contourCrossings(model.contours), 'terrain: contour crossing');
  const center = model.river.banks[0].map((p, i) => [
    (p[0] + model.river.banks[1][i][0]) / 2,
    (p[1] + model.river.banks[1][i][1]) / 2,
  ]);
  const z = center.map((p) => model.elevation(...p));
  fail(
    z.some((v, i) => i > 0 && v >= z[i - 1]),
    'river: flows uphill',
  );
  fail(Math.abs(z.at(-1)) > 0.01, 'river: mouth disconnected from sea');
  fail(model.towns.length < 3, 'settlements: insufficient towns');
  fail(!pointOnPolyline(model.station.access[0], model.station.platform), 'station: access detached from platform');
  fail(
    !model.roads.some((r) => pointOnPolyline(model.station.access.at(-1), r.points)),
    'station: access detached from road',
  );
  fail(
    polylineSegments(model.station.access).some((a) =>
      polylineSegments(model.railway.points).some((b) => segmentIntersection(a, b).type !== 'none'),
    ),
    'station: access crosses track without crossing',
  );
  for (const [i, town] of model.towns.entries()) {
    fail(!validBox(town.bounds) || !contains(town.bounds, BOUND), `town ${i}: invalid bounds`);
    fail(
      corners(town.bounds).some((p) => model.elevation(...p) < 0),
      `town ${i}: in sea`,
    );
    fail(
      boxOverlapInterior(town.bounds, model.selected) || boxOverlapInterior(town.bounds, model.river.corridor),
      `town ${i}: in reserved area`,
    );
    fail(
      !boundary(town.entry, town.bounds) ||
        !model.roads.some((r) => samePoint(r.points[0], town.entry) || samePoint(r.points.at(-1), town.entry)),
      `town ${i}: no road access`,
    );
    fail(
      model.roads.some((r) => routeHitsBoxInterior(r.points, town.bounds)),
      `town ${i}: road cuts buildings`,
    );
    fail(
      !town.streets.some((street) => pointOnPolyline(town.entry, street)),
      `town ${i}: entry misses internal streets`,
    );
    for (const building of town.buildings) {
      fail(!validBox(building) || !contains(building, town.bounds), `town ${i}: building outside boundary`);
      fail(
        town.streets.some((street) => routeHitsBoxInterior(street, building)),
        `town ${i}: internal road cuts building`,
      );
    }
  }
}

/** Compare actual line segments through a spatial bucket, including nonadjacent segments of one contour. */
export function contourCrossings(lines) {
  const buckets = new Map();
  for (const [lineIndex, line] of lines.entries()) {
    for (const [index, s] of polylineSegments(line.points).entries()) {
      const loX = Math.floor(Math.min(s[0], s[2]) * 10),
        hiX = Math.floor(Math.max(s[0], s[2]) * 10);
      const loY = Math.floor(Math.min(s[1], s[3]) * 10),
        hiY = Math.floor(Math.max(s[1], s[3]) * 10);
      const checked = new Set();
      for (let x = loX; x <= hiX; x++)
        for (let y = loY; y <= hiY; y++) {
          const k = `${x},${y}`;
          for (const other of buckets.get(k) ?? []) {
            const id = `${other.lineIndex},${other.index}`;
            if (checked.has(id)) continue;
            checked.add(id);
            const hit = segmentIntersection(s, other.s);
            if (hit.type === 'proper' || hit.type === 'overlap') return true;
            if (hit.type === 'touch' && other.lineIndex !== lineIndex && line.elevation !== other.elevation)
              return true;
          }
          const list = buckets.get(k) ?? [];
          list.push({ s, lineIndex, index, elevation: line.elevation });
          buckets.set(k, list);
        }
    }
  }
  return false;
}
