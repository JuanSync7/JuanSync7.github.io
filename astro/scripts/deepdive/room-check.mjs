#!/usr/bin/env node
/** Inspect circulation and emitted wall strokes, not merely a generator's labels. */
import { pathToFileURL } from 'node:url';
import { loadKernel } from './load.mjs';
import { inspectCoreRoom } from './room-cores.mjs';
import {
  boxOverlapInterior,
  EPS,
  insideBox,
  inspectLinework,
  pointOnSegment,
  samePoint,
  segmentHitsBoxInterior,
  validBox,
} from './geometry.mjs';

const aperture = (S) => [S.w[0] - 0.5, S.w[1] - 0.25, S.w[0] + 0.5, S.w[1] + 0.25];
const boxWithin = (a, b) => insideBox(a.slice(0, 2), b) && insideBox(a.slice(2), b);
const onWall = (point, raw) =>
  raw.segs
    .slice(0, 2)
    .flat()
    .some((s) => pointOnSegment(point, s));
const sameBox = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < EPS);

export function inspectArchitecture(raw, model, win) {
  const issues = [];
  const issue = (text) => issues.push(text);
  if (model?.kind !== 'architecture' || !Array.isArray(model.rooms) || model.rooms.length === 0)
    return ['architecture: no room evidence'];
  if (!validBox(model.shell) || !validBox(model.corridor) || !boxWithin(model.corridor, model.shell))
    issue('corridor outside shell');
  const chosen = model.rooms.filter((r) => r.selected);
  if (chosen.length !== 1 || !sameBox(chosen[0].bounds, win)) issue('selected room must equal aperture');
  const expectedUnits = model.scale === 'building' ? 0.095 / 4 : 0.095;
  if (!Number.isFinite(model.unitsPerMeter) || Math.abs(model.unitsPerMeter - expectedUnits) > EPS)
    issue('architecture physical scale mismatch');
  const detailScale = model.unitsPerMeter / 0.095;
  if (Math.abs(model.wall - 0.018 * detailScale) > EPS || Math.abs(model.shellWall - 0.025 * detailScale) > EPS)
    issue('architecture wall scale mismatch');
  for (const [index, room] of model.rooms.entries()) {
    const at = `room ${room.id}`;
    if (!validBox(room.bounds) || !boxWithin(room.bounds, model.shell)) issue(`${at}: invalid room boundary`);
    if (boxOverlapInterior(room.bounds, model.corridor)) issue(`${at}: occupies corridor`);
    for (const other of model.rooms.slice(index + 1))
      if (boxOverlapInterior(room.bounds, other.bounds)) issue(`${at}: overlaps ${other.id}`);
    const d = room.door;
    if (!d || !d.opening || d.width <= 0 || !validBox(d.clearance)) {
      issue(`${at}: no viable doorway`);
      continue;
    }
    const [a, b] = d.opening;
    if (![1, 2].includes(d.leaves) || Math.abs(d.width / d.leaves / model.unitsPerMeter - 0.1 / 0.095) > EPS)
      issue(`${at}: physical leaf scale mismatch`);
    if (!samePoint(d.hinge, a) || Math.abs(b[0] - a[0] - d.width) > EPS || Math.abs(a[1] - b[1]) > EPS)
      issue(`${at}: opening and hinge disagree`);
    const edge = d.inward < 0 ? room.bounds[3] : room.bounds[1];
    const hallEdge = d.inward < 0 ? model.corridor[1] : model.corridor[3];
    if (
      Math.abs(a[1] - edge) > EPS ||
      Math.abs(a[1] - hallEdge) > EPS ||
      a[0] <= room.bounds[0] ||
      b[0] >= room.bounds[2]
    )
      issue(`${at}: doorway does not connect to corridor`);
    // Probe three points through both faces: an arc drawn over an unbroken wall fails.
    for (const y of [a[1], a[1] + d.inward * model.wall]) {
      for (const u of [0.25, 0.5, 0.75])
        if (onWall([a[0] + d.width * u, y], raw)) issue(`${at}: doorway sealed by wall`);
    }
    for (const x of [a[0], b[0]]) {
      const jamb = [x, a[1] + d.inward * model.wall * 0.5];
      if (!onWall(jamb, raw)) issue(`${at}: missing jamb`);
    }
    if (!onWall([a[0], a[1] + ((d.inward * d.width) / d.leaves) * 0.75], raw)) issue(`${at}: missing open leaf`);
    if (d.leaves === 2 && !onWall([b[0], b[1] + ((d.inward * d.width) / 2) * 0.75], raw))
      issue(`${at}: missing second leaf`);
    const approach = [
      d.hinge[0] - 0.015 * detailScale,
      Math.min(d.hinge[1], d.hinge[1] + d.inward * 0.3 * detailScale),
      d.hinge[0] + d.width + 0.02 * detailScale,
      Math.max(d.hinge[1], d.hinge[1] + d.inward * 0.3 * detailScale),
    ];
    if (
      (!room.selected || model.scale === 'floor') &&
      room.use !== 'stair' &&
      room.use !== 'lift' &&
      room.furniture.length === 0
    )
      issue(`${at}: empty programme`);
    for (const [i, furniture] of room.furniture.entries()) {
      const finiteExtent =
        furniture.length === 4 &&
        furniture.every(Number.isFinite) &&
        furniture[0] <= furniture[2] &&
        furniture[1] <= furniture[3];
      if (!finiteExtent || !boxWithin(furniture, room.bounds)) issue(`${at}: furniture outside walls`);
      if (boxOverlapInterior(furniture, d.clearance) || boxOverlapInterior(furniture, approach))
        issue(`${at}: obstructed door/approach`);
      for (const other of room.furniture.slice(i + 1))
        if (boxOverlapInterior(furniture, other)) issue(`${at}: overlapping furnishings`);
    }
    for (const decoration of room.decorations ?? []) {
      if (!validBox(decoration) || !boxWithin(decoration, room.bounds)) issue(`${at}: decoration outside walls`);
      if (boxOverlapInterior(decoration, d.clearance) || boxOverlapInterior(decoration, approach))
        issue(`${at}: decoration obstructs doorway`);
    }
  }
  for (const room of model.rooms) issues.push(...inspectCoreRoom(raw, model, room));
  if (!model.rooms.some((r) => r.use === 'stair')) issue('no stair core');
  if (!model.rooms.some((r) => r.use === 'bath' || r.use === 'wc')) issue('no wet core');
  if (!model.rooms.some((r) => r.use === 'kitchen')) issue('no kitchen/break room');
  if (model.programme === 'home') {
    for (const use of ['living', 'bedroom', 'bath'])
      if (!model.rooms.some((r) => r.use === use)) issue(`home missing ${use}`);
  } else if (model.rooms.some((r) => r.use === 'bath')) issue('workplace contains domestic bath');
  if (model.scale === 'building' && !model.rooms.some((r) => r.use === 'lift')) issue('no lift core');
  if (!model.entrances?.length) issue('no exterior entrance');
  for (const [a, b] of model.entrances ?? []) {
    const center = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const innerX = a[0] < 0 ? a[0] + model.shellWall : a[0] - model.shellWall;
    if (Math.abs((b[1] - a[1]) / model.entranceLeaves / model.unitsPerMeter - 0.9) > EPS)
      issue('exterior leaf physical scale mismatch');
    if (onWall(center, raw) || onWall([innerX, center[1]], raw)) issue('exterior entrance sealed');
    if (!insideBox([innerX, center[1]], model.corridor)) issue('entrance misses corridor');
    for (const y of [a[1], b[1]]) if (!onWall([(a[0] + innerX) / 2, y], raw)) issue('missing exterior jamb');
  }
  return issues;
}

export function inspectUrbanBlock(raw, model, win) {
  if (model?.kind !== 'urban-block' || !Array.isArray(model.lots) || model.lots.length === 0)
    return ['urban-block: no frontage evidence'];
  const issues = [];
  const chosen = model.lots.filter((l) => l.selected);
  if (chosen.length !== 1 || !sameBox(chosen[0].footprint, win)) issues.push('selected building must equal aperture');
  for (const [i, lot] of model.lots.entries()) {
    if (
      !validBox(lot.bounds) ||
      !validBox(lot.footprint) ||
      !boxWithin(lot.footprint, lot.bounds) ||
      !boxWithin(lot.bounds, model.kerb)
    )
      issues.push('building outside lot/kerb');
    for (const other of model.lots.slice(i + 1))
      if (boxOverlapInterior(lot.bounds, other.bounds)) issues.push('overlapping lots');
    const [front, sidewalk] = lot.path;
    const [rear, lane] = lot.rearAccess;
    const frontY = lot.frontage < 0 ? lot.footprint[1] : lot.footprint[3];
    const rearY = lot.frontage < 0 ? lot.footprint[3] : lot.footprint[1];
    if (Math.abs(front[1] - frontY) > EPS || Math.abs(rear[1] - rearY) > EPS) issues.push('path misses frontage');
    if (!insideBox(sidewalk, model.kerb) || insideBox(sidewalk, lot.bounds, true))
      issues.push('front path misses sidewalk');
    if (!insideBox(lane, model.courtyard)) issues.push('rear path misses lane');
    for (const path of [lot.path, lot.rearAccess]) {
      for (const other of model.lots)
        if (segmentHitsBoxInterior([...path[0], ...path[1]], other.footprint))
          issues.push('access path crosses building');
    }
  }
  // A connected lane in metadata is insufficient if its actual kerbs seal its exits.
  for (const x of [model.kerb[0], model.kerb[0] + 0.035, model.kerb[2] - 0.035, model.kerb[2]]) {
    if (onWall([x, 0], raw) || raw.segs[2].some((s) => pointOnSegment([x, 0], s)))
      issues.push('rear lane sealed by kerb');
  }
  return issues;
}

/** A terminal room reveals its actual contents rather than an unrelated map. */
export function inspectTerminalRoom({ finished, model, win }) {
  if (model?.kind !== 'architecture' || model.scale !== 'floor') return [];
  const detail = finished.detail;
  if (!detail || detail.segs.flat().length === 0) return ['terminal room has no drawn detail'];
  const issues = inspectLinework(detail, win).map((s) => `terminal room: ${s}`);
  const selected = model.rooms.find((r) => r.selected);
  for (const furniture of selected?.furniture ?? []) {
    if (!detail.segs.flat().some((s) => insideBox(s.slice(0, 2), furniture) && insideBox(s.slice(2), furniture)))
      issues.push('terminal room furniture has no emitted strokes');
  }
  return issues;
}

export async function roomKernel() {
  return loadKernel(
    "export {block,building,floor} from './src/figures/kit/rooms'; export {Piece} from './src/figures/kit/piece'; export {PIECES} from './src/figures/kit/furniture'; export {bounds} from './src/figures/kit/layout';",
  );
}

export function generateRoomCase(k, seed, kind) {
  const S = k.makeDiveSketch('city', { block: 3, building: 4, floor: 5 }[kind], seed, 'modern');
  return { raw: S, model: S.model, finished: k.finish(S), win: aperture(S) };
}

export async function runRoomCheck(count = 96) {
  if (!Number.isInteger(count) || count < 1) throw new Error('room seed count must be a positive integer');
  const k = await roomKernel();
  let rooms = 0,
    lots = 0,
    segments = 0;
  const fail = [];
  for (let seed = 1; seed <= count; seed++) {
    for (const kind of ['block', 'building', 'floor']) {
      const c = generateRoomCase(k, seed, kind);
      const domain =
        kind === 'block' ? inspectUrbanBlock(c.raw, c.model, c.win) : inspectArchitecture(c.raw, c.model, c.win);
      const issues = [...domain, ...inspectLinework(c.finished, k.BOUND, c.win), ...inspectTerminalRoom(c)];
      if (issues.length) fail.push({ seed, kind, issues });
      rooms += c.model.rooms?.length ?? 0;
      lots += c.model.lots?.length ?? 0;
      segments += c.finished.segs.flat().length;
    }
  }
  if (fail.length) {
    console.error(JSON.stringify(fail.slice(0, 8), null, 2));
    throw new Error(`room check: ${fail.length} failing cases`);
  }
  console.log(
    `rooms: ${count * 3} layouts · ${rooms} corridor-served rooms · ${lots} frontage lots · ${segments} emitted segments checked`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const count = Number(process.argv.find((a) => a.startsWith('--seeds='))?.slice(8) ?? 96);
  await runRoomCheck(count);
}
