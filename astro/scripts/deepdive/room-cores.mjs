import { boxOverlapInterior, EPS, insideBox, pointOnSegment, validBox } from './geometry.mjs';

export function inspectCoreRoom(raw, model, room) {
  const issues = [],
    issue = (s) => issues.push(`room ${room.id}: ${s}`);
  const cores = room.coreFixtures ?? [],
    metre = model.unitsPerMeter;
  const onWall = (p) =>
    raw.segs
      .slice(0, 2)
      .flat()
      .some((s) => pointOnSegment(p, s));
  if (['stair', 'lift'].includes(room.use) && !cores.length) issue('missing core fixture');
  for (const [index, core] of cores.entries()) {
    if (
      !validBox(core.bounds) ||
      !insideBox(core.bounds.slice(0, 2), room.bounds) ||
      !insideBox(core.bounds.slice(2), room.bounds)
    )
      issue('core fixture outside room');
    for (const other of cores.slice(index + 1))
      if (boxOverlapInterior(core.bounds, other.bounds)) issue('core fixtures overlap');
    const d = room.door,
      leaf = d.width / d.leaves;
    const envelope = [
      d.hinge[0],
      Math.min(d.hinge[1], d.hinge[1] + d.inward * leaf),
      d.hinge[0] + d.width,
      Math.max(d.hinge[1], d.hinge[1] + d.inward * leaf),
    ];
    if (boxOverlapInterior(core.bounds, envelope)) issue('core blocks door sweep');
    const width = (core.bounds[2] - core.bounds[0]) / metre,
      depth = (core.bounds[3] - core.bounds[1]) / metre;
    if (core.kind === 'stair') {
      if (
        Math.abs(width - 2.4) > EPS ||
        Math.abs(depth - 3.8) > EPS ||
        Math.abs(core.treadPitch / metre - 0.28) > EPS ||
        Math.abs(core.flightWidth / metre - 1.05) > EPS ||
        Math.abs(core.landingDepth / metre - 1) > EPS ||
        core.treadsPerFlight !== 10
      )
        issue('stair prototype dimensions/pitch mismatch');
      if (Math.abs(Math.abs(core.farY - core.nearY) - core.treadsPerFlight * core.treadPitch - core.landingDepth) > EPS)
        issue('stair flight misses landing');
      if (
        core.walk.length !== 4 ||
        Math.sign(core.walk[1][1] - core.walk[0][1]) !== core.inward ||
        Math.sign(core.walk[3][1] - core.walk[2][1]) !== -core.inward
      )
        issue('stair walk direction invalid');
      for (let step = 1; step <= Math.min(16, core.treadsPerFlight); step++) {
        const y = core.nearY + core.inward * step * core.treadPitch;
        for (const x of [core.bounds[0] + core.flightWidth / 2, core.bounds[2] - core.flightWidth / 2])
          if (!raw.segs[2].some((s) => Math.abs(s[1] - s[3]) < EPS && pointOnSegment([x, y], s)))
            issue('stair tread not drawn');
      }
    } else if (core.kind === 'lift') {
      if (
        Math.abs(width - 2.2) > EPS ||
        Math.abs(depth - 2.2) > EPS ||
        !insideBox(core.car.slice(0, 2), core.bounds) ||
        !insideBox(core.car.slice(2), core.bounds)
      )
        issue('lift prototype dimensions mismatch');
      const cx = (core.opening[0][0] + core.opening[1][0]) / 2;
      for (const y of [core.opening[0][1], core.opening[0][1] + core.inward * 0.2 * metre])
        if (onWall([cx, y], raw)) issue('lift entrance sealed');
    }
  }
  return issues;
}
