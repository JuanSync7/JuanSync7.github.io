#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  generateRoomCase,
  inspectArchitecture,
  inspectTerminalRoom,
  inspectUrbanBlock,
  roomKernel,
} from './room-check.mjs';
import { inspectLinework } from './geometry.mjs';

const k = await roomKernel();
const baseline = () => generateRoomCase(k, 42, 'floor');
const check = (c) => [...inspectArchitecture(c.raw, c.model, c.win), ...inspectTerminalRoom(c)];
const fixture = (name, corrupt, expected) => {
  const c = baseline();
  assert.equal(check(c).length, 0, 'valid model/linework must pass');
  corrupt(c);
  assert(
    check(c).some((s) => s.includes(expected)),
    `${name}: corruption was not detected`,
  );
};
fixture(
  'wall drawn across valid door',
  (c) => {
    const d = c.model.rooms[0].door;
    c.raw.segs[1].push([...d.opening[0], ...d.opening[1]]);
  },
  'doorway sealed',
);
fixture(
  'interior face seals opening',
  (c) => {
    const d = c.model.rooms[0].door;
    c.raw.segs[1].push([
      d.hinge[0],
      d.hinge[1] + d.inward * c.model.wall,
      d.hinge[0] + d.width,
      d.hinge[1] + d.inward * c.model.wall,
    ]);
  },
  'doorway sealed',
);
fixture(
  'furniture blocks swing',
  (c) => {
    c.model.rooms[0].furniture.push([...c.model.rooms[0].door.clearance]);
  },
  'obstructed door',
);
fixture(
  'room floats away from hall',
  (c) => {
    c.model.rooms[0].door.opening[0][1] += 0.04;
  },
  'does not connect',
);
fixture(
  'portal shears room',
  (c) => {
    c.win[0] += 0.05;
  },
  'selected room',
);
fixture(
  'closed external shell',
  (c) => {
    const [a, b] = c.model.entrances[0];
    c.raw.segs[0].push([...a, ...b]);
  },
  'entrance sealed',
);
fixture(
  'no stairs',
  (c) => {
    c.model.rooms.forEach((r) => {
      if (r.use === 'stair') r.use = 'store';
    });
  },
  'no stair core',
);
fixture(
  'no kitchen',
  (c) => {
    c.model.rooms.forEach((r) => {
      if (r.use === 'kitchen') r.use = 'store';
    });
  },
  'no kitchen',
);
fixture(
  'programme without furnishings',
  (c) => {
    const room = c.model.rooms.find((r) => !r.selected && !['stair', 'lift'].includes(r.use));
    assert(room);
    room.furniture = [];
  },
  'empty programme',
);
fixture(
  'selected terminal room left empty',
  (c) => {
    const room = c.model.rooms.find((r) => r.selected);
    assert(room);
    room.furniture = [];
  },
  'empty programme',
);
fixture(
  'furniture scale drifts across portal',
  (c) => {
    c.model.unitsPerMeter *= 2;
  },
  'physical scale mismatch',
);
fixture(
  'partition scale drifts across portal',
  (c) => {
    c.model.wall *= 4;
  },
  'wall scale mismatch',
);
fixture(
  'oversized single leaf',
  (c) => {
    c.model.rooms[0].door.width *= 3;
  },
  'leaf scale mismatch',
);
fixture(
  'bay-scaled stair pitch',
  (c) => {
    const stair = c.model.rooms.flatMap((r) => r.coreFixtures).find((f) => f.kind === 'stair');
    assert(stair);
    stair.treadPitch *= 4;
  },
  'stair prototype',
);
fixture(
  'undrawn stair treads',
  (c) => {
    const stair = c.model.rooms.flatMap((r) => r.coreFixtures).find((f) => f.kind === 'stair');
    assert(stair);
    c.raw.segs[2] = c.raw.segs[2].filter(
      (s) =>
        !(
          Math.abs(s[1] - s[3]) < 1e-10 &&
          s[0] >= stair.bounds[0] - 1e-10 &&
          s[2] <= stair.bounds[2] + 1e-10 &&
          Math.min(s[1], s[3]) >= stair.bounds[1] - 1e-10 &&
          Math.max(s[1], s[3]) <= stair.bounds[3] + 1e-10
        ),
    );
  },
  'stair tread not drawn',
);
fixture(
  'empty core programme',
  (c) => {
    const stair = c.model.rooms.find((r) => r.use === 'stair');
    assert(stair);
    stair.coreFixtures = [];
  },
  'missing core fixture',
);
fixture(
  'exterior upper jamb omitted',
  (c) => {
    const [a, b] = c.model.entrances[0];
    c.raw.segs[1] = c.raw.segs[1].filter(
      (s) =>
        !(
          Math.abs(s[0] - a[0]) < 1e-10 &&
          Math.abs(s[2] - a[0] - c.model.shellWall) < 1e-10 &&
          Math.abs(s[1] - b[1]) < 1e-10 &&
          Math.abs(s[3] - b[1]) < 1e-10
        ),
    );
  },
  'missing exterior jamb',
);
fixture(
  'terminal detail discarded',
  (c) => {
    c.finished.detail = undefined;
  },
  'no drawn detail',
);
fixture(
  'terminal detail escapes room',
  (c) => {
    c.finished.detail.segs[1].push([c.win[0] - 0.1, c.win[1], c.win[2], c.win[3]]);
  },
  'outside bounds',
);
fixture(
  'workplace domestic bath',
  (c) => {
    c.model.programme = 'workplace';
    c.model.rooms[0].use = 'bath';
  },
  'domestic bath',
);
fixture(
  'no geometry evidence',
  (c) => {
    c.model.rooms = [];
  },
  'no room evidence',
);
const block = generateRoomCase(k, 42, 'block');
assert.equal(inspectUrbanBlock(block.raw, block.model, block.win).length, 0);
block.raw.segs[0].push([block.model.kerb[0], -0.05, block.model.kerb[0], 0.05]);
assert(inspectUrbanBlock(block.raw, block.model, block.win).some((s) => s.includes('lane sealed')));
const clipped = baseline();
clipped.finished.segs[1].push([clipped.win[0], clipped.win[1], clipped.win[2], clipped.win[3]]);
assert(inspectLinework(clipped.finished, k.BOUND, clipped.win).some((s) => s.includes('aperture')));
const building = generateRoomCase(k, 42, 'building');
const floor = baseline();
assert(
  Math.abs(building.model.unitsPerMeter * k.R - floor.model.unitsPerMeter) < 1e-10,
  'physical furniture must retain its scale through the wing portal',
);
assert(
  Math.abs(building.model.wall * k.R - floor.model.wall) < 1e-10,
  'partitions must retain their physical thickness',
);
assert(
  Math.abs(building.model.shellWall * k.R - floor.model.shellWall) < 1e-10,
  'facades must retain their physical thickness',
);
const doubleDoor = building.model.rooms[0].door;
assert.equal(doubleDoor.leaves, 2, 'building wing must have two properly sized leaves');
building.raw.segs[1] = building.raw.segs[1].filter(
  (s) =>
    !(
      Math.abs(s[0] - doubleDoor.opening[1][0]) < 1e-10 &&
      Math.abs(s[2] - doubleDoor.opening[1][0]) < 1e-10 &&
      Math.abs(s[1] - doubleDoor.hinge[1]) < 1e-10 &&
      Math.abs(s[3] - doubleDoor.hinge[1] - (doubleDoor.inward * doubleDoor.width) / 2) < 1e-10
    ),
);
assert(
  inspectArchitecture(building.raw, building.model, building.win).some((s) => s.includes('missing second leaf')),
  'a missing double-door leaf must fail',
);
const measuredDesk = (overview) => {
  const S = new k.Sketch(k.mulberry32(1), [0, 0]);
  k.PIECES.desk(new k.Piece(S, 0, 0, 0, building.model.unitsPerMeter, overview));
  return { bounds: k.bounds(S), segments: S.segs.flat().length };
};
const fullDesk = measuredDesk(false),
  smallDesk = measuredDesk(true);
assert.deepEqual(fullDesk.bounds, smallDesk.bounds, 'overview detail must retain workstation footprint');
assert(smallDesk.segments < fullDesk.segments, 'overview must remove invisible circle vertices');
const upperTail = generateRoomCase(k, 2858099656, 'building');
assert(upperTail.finished.segs.flat().length <= 12000, 'recorded upper-tail seed must remain within drawing budget');
console.log(
  'rooms selftest: 24 broken circulation/programme/linework fixtures rejected; physical furniture/wall/door/core scales preserved',
);
