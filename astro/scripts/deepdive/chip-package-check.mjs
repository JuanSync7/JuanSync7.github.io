import {
  EPS,
  insideBox,
  pointOnSegment,
  polylineSegments,
  routeCoveredByLinework,
  samePoint,
  segmentCoveredByLinework,
  segmentHitsBoxInterior,
} from './geometry.mjs';

export function chipAncestor(model, descendantId, ancestorId) {
  const seen = new Set();
  let child = model.components.find((c) => c.id === descendantId);
  while (child?.parent && !seen.has(child.id)) {
    if (child.parent === ancestorId) return true;
    seen.add(child.id);
    child = model.components.find((c) => c.id === child.parent);
  }
  return false;
}
const sameBox = (a, b) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) <= EPS);
const boxSegments = ([x0, y0, x1, y1]) => [
  [x0, y0, x1, y0],
  [x1, y0, x1, y1],
  [x1, y1, x0, y1],
  [x0, y1, x0, y0],
];

/** Recover the real circular landing stroke independently of its tessellation. A
 * closed, once-winding ring must survive as complete segment intervals after clipping. */
function landingRing(raw, center) {
  const radial = (p) => Math.abs(Math.hypot(p[0] - center[0], p[1] - center[1]) - 0.004) <= EPS;
  const ring = raw.segs.flat().filter((s) => radial(s.slice(0, 2)) && radial(s.slice(2)));
  if (ring.length < 6) return [];
  for (const s of ring)
    for (const p of [s.slice(0, 2), s.slice(2)])
      if (ring.filter((v) => samePoint(p, v.slice(0, 2)) || samePoint(p, v.slice(2))).length !== 2) return [];
  const winding = ring.reduce((total, [x0, y0, x1, y1]) => {
    const [ax, ay, bx, by] = [x0 - center[0], y0 - center[1], x1 - center[0], y1 - center[1]];
    return total + Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
  }, 0);
  return Math.abs(Math.abs(winding) - 2 * Math.PI) < EPS ? ring : [];
}

/** Compare with the actual independently seeded child plan, never a parent-generated
 * substitute pad list. Finished interface strokes must carry each full bond across
 * the portal to that child's real pad geometry. */
export function inspectBondRegistration(raw, model, finished) {
  const issues = [],
    child = raw.nextPlan;
  if (!child?.model || child.model.type !== 'chip' || !Array.isArray(child.model.components))
    return ['missing actual next-die pad contract'];
  const pads = child.model.components.filter((c) => c.kind === 'pad' && !c.parent);
  if (!pads.length || pads.some((p) => !['n', 'e', 's', 'w'].includes(p.side)))
    return ['missing actual next-die pad side'];
  const links = model.childPadMap ?? [];
  if (
    links.length !== pads.length ||
    new Set(links.map((l) => l.childId)).size !== pads.length ||
    model.nets.length !== pads.length
  )
    issues.push('child pad count/order mismatch');
  if (model.nets.some((n) => n.layer !== 'bond-wire')) issues.push('bonded package must use physical wire bonds');
  const project = ([x, y]) => [raw.w[0] + x / 4, raw.w[1] + y / 4];
  const win = [raw.w[0] - 0.5, raw.w[1] - 0.25, raw.w[0] + 0.5, raw.w[1] + 0.25];
  const interfaceLines = finished?.interfaces?.segs.flat() ?? [];
  const retained = [...(finished?.segs.flat() ?? []), ...interfaceLines];
  if (!finished || !interfaceLines.length) issues.push('missing retained inside bond interface');
  for (const side of ['n', 'e', 's', 'w']) {
    const axis = side === 'n' || side === 's' ? 0 : 1;
    const ordered = pads
      .filter((p) => p.side === side)
      .sort((a, b) => a.box[axis] + a.box[axis + 2] - b.box[axis] - b.box[axis + 2]);
    for (const [index, pad] of ordered.entries()) {
      const link = links.find((l) => l.childId === pad.id);
      const copied = model.components.find((c) => c.id === link?.parentId);
      const lo = project(pad.box.slice(0, 2)),
        hi = project(pad.box.slice(2));
      if (
        !copied ||
        copied.parent !== 'die' ||
        link.side !== side ||
        copied.side !== pad.side ||
        !sameBox(copied.box, [...lo, ...hi])
      ) {
        issues.push(`misregistered child pad ${pad.id}`);
        continue;
      }
      if (!insideBox(lo, win) || !insideBox(hi, win)) issues.push('projected child pad outside die');
      for (const p of pad.ports) {
        const id = `${copied.id}:${p.id.slice(pad.id.length + 1)}`,
          cp = copied.ports.find((v) => v.id === id);
        if (!cp || cp.side !== p.side || !samePoint(cp.point, project(p.point)))
          issues.push(`misregistered child pad port ${pad.id}`);
      }
      // Pin declarations must correspond to child geometry that actually renders.
      if (!boxSegments(pad.box).every((s) => segmentCoveredByLinework(s, child.segs.flat())))
        issues.push(`child pad missing from emitted geometry ${pad.id}`);
      const inward = { n: 's', e: 'w', s: 'n', w: 'e' }[side];
      const from = `pin${side}${index}:${inward}2`,
        to = `${copied.id}:${side}2`;
      const net = model.nets.find((n) => n.from === from && n.to === to);
      if (!net) {
        issues.push('child pad count/order mismatch');
        continue;
      }
      const originalPort = pad.ports.find((p) => p.side === side);
      if (!originalPort || !samePoint(net.points.at(-1), project(originalPort.point)))
        issues.push('bond landing misses actual child pad');
      if (!routeCoveredByLinework(net.points, retained)) issues.push('missing retained inside bond interface');
      for (const point of [net.points[0], net.points.at(-1)]) {
        const ring = landingRing(raw, point);
        if (!ring.length || !ring.every((s) => segmentCoveredByLinework(s, retained)))
          issues.push('bond landing ring missing from finished linework');
      }
      for (const s of polylineSegments(net.points)) {
        if (!segmentHitsBoxInterior(s, win)) issues.push('bond never enters its selected die');
      }
      if (originalPort && !boxSegments(pad.box).some((s) => pointOnSegment(originalPort.point, s)))
        issues.push('bond landing is not on actual child pad edge');
    }
  }
  return [...new Set(issues)];
}
