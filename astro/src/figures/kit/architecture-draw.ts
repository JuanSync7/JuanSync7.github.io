import { furnish } from './furniture';
import { furnishMeetingWing } from './architecture-programme';
import { inset, type Box, type Sketch } from './sketch';
import type { ArchitecturePlan, PlanDoor, PlanRoom } from './architecture-plan';

const horizontal = (
  S: Sketch,
  x0: number,
  x1: number,
  y: number,
  gaps: readonly [number, number][],
  tone: 0 | 1 = 1,
): void => {
  let x = x0;
  for (const [a, b] of gaps) {
    if (a > x) S.seg(x, y, a, y, tone);
    x = Math.max(x, b);
  }
  if (x < x1) S.seg(x, y, x1, y, tone);
};

/** Opening, leaf and sweep all share one hinge; no wall runs across the opening. */
export function drawPlanDoor(S: Sketch, d: PlanDoor): void {
  const [x, y] = d.hinge;
  const leaf = d.width / d.leaves;
  S.seg(x, y, x, y + d.inward * leaf, 1);
  S.arc(x, y, leaf, d.inward < 0 ? -Math.PI / 2 : 0, d.inward < 0 ? 0 : Math.PI / 2, 2, 10);
  if (d.leaves === 2) {
    S.seg(x + d.width, y, x + d.width, y + d.inward * leaf, 1);
    S.arc(x + d.width, y, leaf, d.inward < 0 ? Math.PI : Math.PI / 2, d.inward < 0 ? Math.PI * 1.5 : Math.PI, 2, 10);
  }
}

function serviceCore(S: Sketch, room: PlanRoom, metre: number): void {
  for (const core of room.coreFixtures) {
    const [x0, y0, x1, y1] = core.bounds;
    if (core.kind === 'lift') {
      const [a, b] = core.opening;
      const front = a[1];
      const back = core.inward < 0 ? y0 : y1;
      S.seg(x0, front, x0, back, 1);
      S.seg(x1, front, x1, back, 1);
      S.seg(x0, back, x1, back, 1);
      horizontal(S, x0, x1, front, [[a[0], b[0]]]);
      const carFront = front + core.inward * 0.2 * metre;
      const carBack = back - core.inward * 0.2 * metre;
      S.seg(core.car[0], carFront, core.car[0], carBack, 2);
      S.seg(core.car[2], carFront, core.car[2], carBack, 2);
      S.seg(core.car[0], carBack, core.car[2], carBack, 2);
      horizontal(S, core.car[0], core.car[2], carFront, [[a[0], b[0]]]);
      for (const x of [a[0], b[0]]) S.seg(x, front, x, carFront, 1);
      continue;
    }
    S.rect(core.bounds, 1);
    const far = core.farY - core.inward * core.landingDepth;
    for (const x of [x0 + core.flightWidth, x1 - core.flightWidth]) S.seg(x, core.nearY, x, far, 1);
    for (let step = 1; step <= core.treadsPerFlight; step++) {
      const y = core.nearY + core.inward * step * core.treadPitch;
      S.seg(x0, y, x0 + core.flightWidth, y, 2);
      S.seg(x1 - core.flightWidth, y, x1, y, 2);
    }
    S.poly(core.walk, 2);
    const end = core.walk[core.walk.length - 1];
    if (end)
      S.poly(
        [
          [end[0] - 0.15 * metre, end[1] + core.inward * 0.25 * metre],
          end,
          [end[0] + 0.15 * metre, end[1] + core.inward * 0.25 * metre],
        ],
        2,
      );
  }
}

export function drawArchitecturePlan(S: Sketch, model: ArchitecturePlan): void {
  const [x0, y0, x1, y1] = model.shell;
  const innerY = model.shell[3] - model.shellWall;
  const detailScale = model.unitsPerMeter / 0.095;
  const entry = Math.abs(model.entrances[0]?.[0][1] ?? 0);
  for (const band of [-1, 1] as const) {
    const rooms = model.rooms.filter((r) => r.door.inward === band);
    const gaps = rooms.map((r) => r.window);
    for (const y of [band < 0 ? y0 : y1, band * innerY]) horizontal(S, x0, x1, y, gaps, 0);
    for (const room of rooms) {
      const [a, b] = room.window;
      const y = band * (innerY + model.shellWall / 2);
      for (const yy of [y - 0.004 * detailScale, y + 0.004 * detailScale]) S.seg(a, yy, b, yy, 2);
      for (const x of [a, b]) S.seg(x, band * innerY, x, band < 0 ? y0 : y1, 1);
      const panes = Math.max(1, Math.round((b - a) / (1.5 * model.unitsPerMeter)));
      for (let p = 1; p < panes; p++) {
        const x = a + ((b - a) * p) / panes;
        S.seg(x, band * innerY, x, band < 0 ? y0 : y1, 2);
      }
      const dy = room.door.hinge[1];
      const [da, db] = room.door.opening;
      for (const y of [dy, dy + band * model.wall]) {
        horizontal(S, room.bounds[0], room.bounds[2], y, [[da[0], db[0]]]);
      }
      for (const x of [da[0], db[0]]) S.seg(x, dy, x, dy + band * model.wall, 1);
      drawPlanDoor(S, room.door);
      const rx = room.bounds[0];
      if (rx > model.corridor[0] + 1e-5) {
        for (const x of [rx - model.wall / 2, rx + model.wall / 2]) S.seg(x, room.bounds[1], x, room.bounds[3], 1);
      }
      if (room.selected && model.scale === 'building') continue;
      if (room.use === 'stair' || room.use === 'lift') serviceCore(S, room, model.unitsPerMeter);
      else {
        const r = inset(room.bounds, 0.025 * detailScale);
        const d = room.door;
        const approach: Box = [
          d.hinge[0] - 0.015 * detailScale,
          Math.min(d.hinge[1], d.hinge[1] + band * 0.3 * detailScale),
          d.hinge[0] + d.width + 0.02 * detailScale,
          Math.max(d.hinge[1], d.hinge[1] + band * 0.3 * detailScale),
        ];
        const L =
          model.scale === 'building' && room.use === 'meeting'
            ? furnishMeetingWing(S, room, model)
            : furnish(S, r, room.use, model.unitsPerMeter, [d.clearance, approach], model.scale === 'building');
        room.furniture = L.solids;
        room.decorations = L.placed.filter((b) => !L.solids.includes(b));
      }
    }
  }
  // The two corridor ends are real entrances through both faces of the exterior wall.
  for (const x of [x0, x0 + model.shellWall, x1 - model.shellWall, x1]) {
    S.seg(x, y0, x, -entry, 0);
    S.seg(x, entry, x, y1, 0);
  }
  for (const x of [x0, x1]) {
    const s = x < 0 ? 1 : -1;
    for (const y of [-entry, entry]) S.seg(x, y, x + s * model.shellWall, y, 1);
    const leaf = (entry * 2) / model.entranceLeaves;
    S.seg(x, -entry, x + s * leaf, -entry, 1);
    S.arc(x, -entry, leaf, s > 0 ? 0 : Math.PI / 2, s > 0 ? Math.PI / 2 : Math.PI, 2, 8);
    if (model.entranceLeaves === 2) {
      S.seg(x, entry, x + s * leaf, entry, 1);
      S.arc(x, entry, leaf, s > 0 ? -Math.PI / 2 : Math.PI, s > 0 ? 0 : Math.PI * 1.5, 2, 8);
    }
  }
}
