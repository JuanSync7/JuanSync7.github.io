#!/usr/bin/env node
/** Large meeting wings need a physical programme and a continuous route to the door. */
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { loadKernel } from './load.mjs';
import { EPS, boxOverlapInterior, insideBox, segmentCoveredByLinework, validBox } from './geometry.mjs';

const boxWithin = (a, b) => insideBox(a.slice(0, 2), b) && insideBox(a.slice(2), b);
const sameBox = (a, b) => a.every((v, i) => Math.abs(v - b[i]) <= EPS);
const rectangle = ([a, b, c, d]) => [
  [a, b, c, b],
  [c, b, c, d],
  [c, d, a, d],
  [a, d, a, b],
];
export function inspectMeetingWing(programme, room, raw, layout) {
  const issues = [],
    m = programme.unitsPerMeter;
  if (!Number.isFinite(m) || m <= 0 || !validBox(programme.bounds) || !boxWithin(programme.bounds, room.bounds))
    return ['invalid meeting-wing bounds/physical scale'];
  const [entry, cross] = programme.aisles;
  if (
    !entry ||
    !cross ||
    !validBox(entry) ||
    !validBox(cross) ||
    !boxWithin(entry, programme.bounds) ||
    !boxWithin(cross, programme.bounds)
  )
    return ['missing meeting-wing circulation'];
  if (entry[2] - entry[0] < 1.5 * m - EPS || cross[3] - cross[1] < 1.5 * m - EPS)
    issues.push('meeting-wing aisle too narrow');
  if (!boxOverlapInterior(entry, cross)) issues.push('meeting-wing circulation disconnected');
  const arrival = [room.door.hinge[0] + room.door.width / 2, room.door.hinge[1] + room.door.inward * 0.5 * m];
  if (!insideBox(arrival, entry)) issues.push('meeting-wing entry route misses door');
  const area = ((programme.bounds[2] - programme.bounds[0]) * (programme.bounds[3] - programme.bounds[1])) / (m * m);
  if (programme.islands.length < Math.min(16, Math.max(1, Math.floor(area / 45))))
    issues.push('meeting wing has insufficient programme for its area');
  for (const [i, island] of programme.islands.entries()) {
    if (!validBox(island.bounds) || !boxWithin(island.bounds, programme.bounds))
      issues.push('meeting island outside room');
    if (
      island.seats !== 6 ||
      Math.abs((island.bounds[2] - island.bounds[0]) / m - 1.92) > EPS ||
      Math.abs((island.bounds[3] - island.bounds[1]) / m - 1.84) > EPS
    )
      issues.push('meeting table/chairs physical size drift');
    if (
      programme.aisles.some((a) => boxOverlapInterior(a, island.bounds)) ||
      boxOverlapInterior(room.door.clearance, island.bounds)
    )
      issues.push('meeting island blocks circulation');
    for (const other of programme.islands.slice(i + 1)) {
      if (boxOverlapInterior(island.bounds, other.bounds)) issues.push('overlapping meeting islands');
      const a = island.bounds,
        b = other.bounds;
      const xOverlap = Math.min(a[2], b[2]) - Math.max(a[0], b[0]) > EPS,
        yOverlap = Math.min(a[3], b[3]) - Math.max(a[1], b[1]) > EPS;
      const xGap = Math.max(b[0] - a[2], a[0] - b[2]),
        yGap = Math.max(b[1] - a[3], a[1] - b[3]);
      if ((xOverlap && yGap < 1.2 * m - EPS) || (yOverlap && xGap < 1.2 * m - EPS))
        issues.push('meeting-island passage too narrow');
    }
    if (raw && !rectangle(island.tabletop).every((s) => segmentCoveredByLinework(s, raw.segs.flat())))
      issues.push('meeting tabletop missing from emitted drawing');
    if (layout && !layout.solids.some((b) => sameBox(b, island.bounds)))
      issues.push('meeting island not committed at planned location');
  }
  if (
    !validBox(programme.screen) ||
    !boxWithin(programme.screen, programme.bounds) ||
    programme.aisles.some((a) => boxOverlapInterior(a, programme.screen))
  )
    issues.push('screen outside room or obstructs aisle');
  return [...new Set(issues)];
}
export async function programmeKernel() {
  return loadKernel(
    "export {makeArchitecturePlan} from './src/figures/kit/architecture-plan';export {planMeetingWing,furnishMeetingWing} from './src/figures/kit/architecture-programme';",
  );
}
export function generateProgrammeCase(k, seed) {
  const source = new k.Sketch(k.mulberry32(seed), [0, 0]);
  const model = k.makeArchitecturePlan(source, 'building'),
    room = model.rooms.find((r) => r.use === 'meeting' && !r.selected);
  if (!room) throw new Error(`No meeting-wing case for seed ${seed}`);
  const raw = new k.Sketch(k.mulberry32(seed), [0, 0]),
    programme = k.planMeetingWing(room, model),
    layout = k.furnishMeetingWing(raw, room, model);
  return { programme, layout, room, raw };
}
export async function runProgrammeCheck(count = 128) {
  if (!Number.isSafeInteger(count) || count < 1 || count > 10000) throw new Error('Programme count must be 1–10000');
  const k = await programmeKernel();
  let wings = 0,
    islands = 0,
    maxSegments = 0;
  const failures = [];
  for (let seed = 1; seed <= count; seed++) {
    const c = generateProgrammeCase(k, seed),
      issues = inspectMeetingWing(c.programme, c.room, c.raw, c.layout);
    if (issues.length) failures.push({ seed, issues });
    wings++;
    islands += c.programme.islands.length;
    maxSegments = Math.max(maxSegments, c.raw.segs.flat().length);
  }
  if (failures.length) {
    console.error(JSON.stringify(failures.slice(0, 6), null, 2));
    throw new Error('Meeting-wing programme failed');
  }
  let fixtures = 0;
  const fixture = (name, mutate, expected) => {
    const c = generateProgrammeCase(k, 42);
    mutate(c);
    assert(
      inspectMeetingWing(c.programme, c.room, c.raw, c.layout).some((s) => s.includes(expected)),
      `${name}: mutation not rejected`,
    );
    fixtures++;
  };
  fixture(
    'empty hall',
    (c) => {
      c.programme.islands = [];
    },
    'insufficient programme',
  );
  fixture(
    'table blocks cross aisle',
    (c) => {
      c.programme.islands[0].bounds = [...c.programme.aisles[1]];
    },
    'blocks circulation',
  );
  fixture(
    'table outside shell',
    (c) => {
      c.programme.islands[0].bounds[0] = -9;
    },
    'outside room',
  );
  fixture(
    'table overlaps neighbor',
    (c) => {
      c.programme.islands[1].bounds = [...c.programme.islands[0].bounds];
    },
    'overlapping meeting',
  );
  fixture(
    'oversized table',
    (c) => {
      c.programme.islands[0].bounds[2] += 0.1;
    },
    'physical size drift',
  );
  fixture(
    'narrow cross aisle',
    (c) => {
      c.programme.aisles[1][3] = c.programme.aisles[1][1] + 0.2 * c.programme.unitsPerMeter;
    },
    'aisle too narrow',
  );
  fixture(
    'entry lane detached from door',
    (c) => {
      c.programme.aisles[0][0] = c.programme.aisles[0][2] - 0.1 * c.programme.unitsPerMeter;
    },
    'entry route misses',
  );
  fixture(
    'uncommitted furniture',
    (c) => {
      c.layout.solids.length = 0;
    },
    'not committed',
  );
  fixture(
    'missing table drawing',
    (c) => {
      c.raw.segs = [[], [], []];
    },
    'tabletop missing',
  );
  fixture(
    'screen blocks aisle',
    (c) => {
      c.programme.screen = [...c.programme.aisles[1]];
    },
    'screen outside room or obstructs',
  );
  console.log(
    `meeting wings: ${wings} programmes · ${islands} six-seat islands · ${fixtures} adverse fixtures rejected · at most ${maxSegments} strokes per wing`,
  );
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({ options: { seeds: { type: 'string' } } });
  const value = values.seeds ?? '128';
  if (!/^\d+$/.test(value)) throw new Error('Programme seed count must be an unsigned integer');
  await runProgrammeCheck(Number(value));
}
