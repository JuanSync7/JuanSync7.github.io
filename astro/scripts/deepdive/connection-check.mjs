#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { loadKernel } from './load.mjs';
import {
  EPS,
  insideBox,
  inspectLinework,
  polylineSegments,
  routeConflicts,
  routeHitsBoxInterior,
  samePoint,
  segmentCoveredByLinework,
  segmentIntersection,
  selfIntersections,
} from './geometry.mjs';

const midpoint = ([a, b]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const equalOpening = (a, b) =>
  (samePoint(a[0], b[0]) && samePoint(a[1], b[1])) || (samePoint(a[0], b[1]) && samePoint(a[1], b[0]));
const sourceOpenings = (parent) => {
  const m = parent.model;
  if (m.kind === 'architecture') return [{ id: 'wing', opening: m.rooms.find((r) => r.selected).door.opening }];
  const lot = m.lots.find((l) => l.selected);
  return [
    ['front', lot.path[0]],
    ['rear', lot.rearAccess[0]],
  ].map(([id, p]) => ({
    id,
    opening: [
      [p[0] - 0.0125, p[1]],
      [p[0] + 0.0125, p[1]],
    ],
  }));
};

export function inspectConnection(parent, child, connection, outline) {
  const issues = [],
    issue = (s) => issues.push(s);
  if (!connection || !connection.routes?.length) return ['no nesting connection evidence'];
  const win = [parent.w[0] - 0.5, parent.w[1] - 0.25, parent.w[0] + 0.5, parent.w[1] + 0.25];
  const project = (p) => [parent.w[0] + p[0] / 4, parent.w[1] + p[1] / 4];
  const shell = [...project(child.model.shell.slice(0, 2)), ...project(child.model.shell.slice(2))];
  if (
    !connection.aperture.every((v, i) => Math.abs(v - win[i]) < EPS) ||
    !connection.childShell.every((v, i) => Math.abs(v - shell[i]) < EPS)
  )
    issue('connection frame/shell projection disagrees with plans');
  issues.push(...inspectLinework(connection.linework, win));
  const expected = sourceOpenings(parent),
    entrances = child.model.entrances.map((o) => o.map(project));
  if (connection.routes.length !== expected.length) issue('not every parent approach has a route');
  const emitted = connection.linework.segs.flat();
  for (const route of connection.routes) {
    const source = expected.find((o) => o.id === route.id);
    if (!source || !equalOpening(source.opening, route.source.opening)) issue('source opening misses parent doorway');
    if (!entrances.some((o) => equalOpening(o, route.target.opening))) issue('target opening misses child doorway');
    // Sweep arcs touch the closed-position midpoint. A wall has positive overlap.
    const sourceSegment = [...route.source.opening[0], ...route.source.opening[1]];
    const childOpening = route.target.opening.map((p) => [(p[0] - parent.w[0]) * 4, (p[1] - parent.w[1]) * 4]);
    const targetSegment = [...childOpening[0], ...childOpening[1]];
    if (parent.segs.flat().some((s) => segmentIntersection(sourceSegment, s).type === 'overlap'))
      issue('parent linework seals source entrance');
    if (child.segs.flat().some((s) => segmentIntersection(targetSegment, s).type === 'overlap'))
      issue('child linework seals target entrance');
    for (const end of ['source', 'target']) {
      const opening = route[end],
        center = midpoint(opening.opening),
        width = Math.hypot(
          opening.opening[1][0] - opening.opening[0][0],
          opening.opening[1][1] - opening.opening[0][1],
        );
      if (!samePoint(center, opening.center) || Math.abs(width - opening.width) > EPS)
        issue(`${end} endpoint metadata inconsistent`);
    }
    if (
      !samePoint(route.centerline[0], route.source.center) ||
      !samePoint(route.centerline.at(-1), route.target.center)
    )
      issue('centre route does not terminate at both openings');
    if (selfIntersections(route.centerline).length || routeHitsBoxInterior(route.centerline, shell))
      issue('centre route self-crosses or enters child room');
    if (route.curbs.length !== 2) issue('route does not have two physical curbs');
    for (const curb of route.curbs) {
      if (!curb.every((p) => insideBox(p, win))) issue('curb leaves aperture');
      if (selfIntersections(curb).length) issue('curb self-crosses');
      if (routeHitsBoxInterior(curb, shell)) issue('curb traverses child shell interior');
      if (
        !route.source.opening.some((p) => samePoint(p, curb[0])) ||
        !route.target.opening.some((p) => samePoint(p, curb.at(-1)))
      )
        issue('curb does not join opening endpoints');
      for (const segment of polylineSegments(curb))
        if (!segmentCoveredByLinework(segment, emitted)) issue('curb has a gap in emitted linework');
    }
    if (routeConflicts(...route.curbs, { allowSharedEndpoints: false }).length) issue('opposite curbs cross');
    if (samePoint(route.curbs[0][0], route.curbs[1][0]) || samePoint(route.curbs[0].at(-1), route.curbs[1].at(-1)))
      issue('ribbon collapses at doorway');
    for (const segment of emitted)
      if (routeHitsBoxInterior([segment.slice(0, 2), segment.slice(2)], shell))
        issue('emitted curb crosses child interior');
  }
  for (let i = 0; i < connection.routes.length; i++)
    for (const other of connection.routes.slice(i + 1))
      for (const a of connection.routes[i].curbs)
        for (const b of other.curbs)
          if (routeConflicts(a, b, { allowSharedEndpoints: false }).length) issue('independent approaches cross');
  // The teal frame must stop across every real opening, and be complete everywhere else.
  for (const item of expected)
    for (const s of outline)
      if (segmentIntersection([...item.opening[0], ...item.opening[1]], s).type === 'overlap')
        issue('inspection outline seals parent doorway');
  for (const s of outline) {
    const onEdge = (p) =>
      insideBox(p, win) &&
      (Math.abs(p[0] - win[0]) < EPS ||
        Math.abs(p[0] - win[2]) < EPS ||
        Math.abs(p[1] - win[1]) < EPS ||
        Math.abs(p[1] - win[3]) < EPS);
    if (!onEdge(s.slice(0, 2)) || !onEdge(s.slice(2))) issue('outline leaves aperture perimeter');
  }
  for (const y of [win[1], win[3]]) {
    const gaps = expected
      .map((v) => v.opening)
      .filter(([a]) => Math.abs(a[1] - y) < EPS)
      .sort((a, b) => a[0][0] - b[0][0]);
    let x = win[0];
    for (const [a, b] of gaps) {
      if (a[0] > x + EPS && !segmentCoveredByLinework([x, y, a[0], y], outline)) issue('outline has an undeclared gap');
      x = b[0];
    }
    if (x < win[2] - EPS && !segmentCoveredByLinework([x, y, win[2], y], outline))
      issue('outline has an undeclared gap');
  }
  for (const x of [win[0], win[2]])
    if (!segmentCoveredByLinework([x, win[1], x, win[3]], outline)) issue('outline side has an undeclared gap');
  return [...new Set(issues)];
}

export async function connectionKernel() {
  return loadKernel("export {nestConnections,selectedOutline} from './src/figures/kit/dive-connections';");
}
export function connectionCase(k, salt, n) {
  const parent = k.makeDivePlan('city', n, salt, 'modern'),
    child = k.makeDivePlan('city', n + 1, salt, 'modern');
  return { parent, child, connection: k.nestConnections(parent, child), outline: k.selectedOutline(parent) };
}

export async function runConnectionCheck(count = 256) {
  if (!Number.isInteger(count) || count < 1) throw new Error('connection seed count must be positive');
  const k = await connectionKernel();
  let routes = 0,
    segments = 0;
  const failures = [];
  for (let seed = 0; seed < count; seed++) {
    const salt = Math.imul(seed + 1, 2654435761) >>> 0;
    for (const n of [3, 4, 9, 10]) {
      const c = connectionCase(k, salt, n);
      const issues = inspectConnection(c.parent, c.child, c.connection, c.outline);
      if (issues.length) failures.push({ salt, n, issues });
      routes += c.connection?.routes.length ?? 0;
      segments += c.connection?.linework.segs.flat().length ?? 0;
    }
  }
  if (failures.length) {
    console.error(JSON.stringify(failures.slice(0, 8), null, 2));
    throw new Error(`${failures.length} nesting connections failed`);
  }
  console.log(
    `connections: ${count * 4} production parent/child pairs · ${routes} approaches · ${segments} curb segments checked`,
  );
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await runConnectionCheck(Number(process.argv.find((a) => a.startsWith('--seeds='))?.slice(8) ?? 256));
