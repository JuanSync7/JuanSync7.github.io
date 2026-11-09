import assert from 'node:assert/strict';
import { OrthographicCamera, PerspectiveCamera, Vector3 } from 'three';

export const checkedRooms = new Set();
export function checkRoom(p, { roomPlan, roomModels, roomView, roomProject, roomVisible, roomControls, tabletop }) {
  const plan = roomPlan(p),
    parts = roomModels(p),
    table = tabletop(p).bounds;
  assert(
    Math.abs(table.lo[2] - plan.back - (p.theme.id === 'dining' ? 2.8 : 0)) < 1e-9,
    'Themed table anchor: dining seats on both sides; task surfaces meet the back wall',
  );
  assert.equal(plan.floor, table.lo[1], 'Furniture must stand on the floor');
  assert.equal(
    parts.filter((s) => !s.interactive && !s.cutaway && ['back', 'left', 'right'].includes(s.side)).length,
    3,
  );
  const floor = parts.find((s) => s.side === 'floor');
  assert(Math.abs(floor.model.bounds.hi[1] - plan.floor) < 1e-9);
  for (const part of parts.filter((s) => s.interactive))
    for (const it of p.items) {
      const a = part.model.bounds,
        b = it.bounds;
      assert(
        a.hi[0] <= b.lo[0] ||
          a.lo[0] >= b.hi[0] ||
          a.hi[1] <= b.lo[1] ||
          a.lo[1] >= b.hi[1] ||
          a.hi[2] <= b.lo[2] ||
          a.lo[2] >= b.hi[2],
        `Room fixture intersects ${p.theme.id}/${it.kind}`,
      );
    }
  const fittings = parts.filter((s) => s.interactive);
  const entry = parts.find((part) => part.entrance);
  assert(entry, 'Room needs an entry door');
  const doorSpan = entry.model.bounds.hi[2] - entry.model.bounds.lo[2];
  const disjoint = (a, b) => [0, 1, 2].some((k) => a.hi[k] <= b.lo[k] + 1e-8 || a.lo[k] >= b.hi[k] - 1e-8);
  const textiles = fittings.filter((part) => part.support);
  for (const [i, part] of textiles.entries())
    for (const other of textiles.slice(i + 1))
      assert(
        disjoint(part.model.bounds, other.model.bounds),
        `Overlapping textiles: ${p.theme.id}/${part.label}/${other.label}`,
      );
  for (const [i, part] of fittings.entries()) {
    const b = part.model.bounds;
    assert(
      b.lo[0] >= (part.side === 'left' ? plan.bounds.lo[0] : -plan.half) - 1e-8 &&
        b.hi[0] <= (part.side === 'right' ? plan.bounds.hi[0] : plan.half) + 1e-8 &&
        b.lo[2] >= (part.side === 'back' ? plan.bounds.lo[2] : plan.back) - 1e-8 &&
        b.hi[2] <= plan.front + 1e-8,
      `Fitting outside room: ${p.theme.id}/${part.label} ${JSON.stringify(b)} plan:${JSON.stringify(plan.bounds)}`,
    );
    assert(b.lo[1] >= plan.floor - 1e-8 && b.hi[1] <= plan.top + 1e-8, `Fitting outside room height: ${part.label}`);
    if (part.support) continue;
    assert(disjoint(b, table), `Fitting intersects the table: ${p.theme.id}/${part.label}`);
    if (part.mount === 'floor') {
      const aisle = {
        lo: [-plan.half * 0.35, plan.floor, plan.front - 1],
        hi: [plan.half * 0.35, plan.top, plan.front],
      };
      const doorway = {
        lo: [entry.side === 'left' ? -plan.half : plan.half - doorSpan, plan.floor, entry.model.bounds.lo[2] - 0.1],
        hi: [entry.side === 'left' ? -plan.half + doorSpan : plan.half, plan.top, entry.model.bounds.hi[2] + 0.1],
      };
      assert(disjoint(b, aisle), `Blocked entrance aisle: ${part.label}`);
      assert(disjoint(b, doorway), `Blocked door approach: ${part.label}`);
    }
    for (const other of fittings.slice(i + 1)) {
      if (other.support) continue;
      assert(disjoint(b, other.model.bounds), `Room fittings intersect: ${p.theme.id}/${part.label}/${other.label}`);
    }
  }
  const key = `${p.theme.id}:${p.roomVariant}:${p.layoutVariant}:${p.furnitureVariant}`;
  if (checkedRooms.has(key)) return;
  checkedRooms.add(key);
  const diagonal = roomView(p, 640, 640 / 1.8, { view: 'isometric', angle: 135 });
  assert(!roomVisible(p, 'right', diagonal), 'The isometric near wall must reveal the interior');
  assert(roomVisible(p, 'right', diagonal, 'floor'), 'Cutting away a wall must preserve its visible floor furniture');
  assert.equal(roomControls({ angle: 999 }).angle, 180);
  assert.equal(roomControls({ angle: -999 }).angle, 0);
  assert.equal(roomControls({ angle: NaN }).angle, 135);
  for (const view of ['eye', 'isometric'])
    for (const angle of [0, 30, 60, 90, 120, 135, 150, 180])
      for (const aspect of [1, 1.8, 2.4]) {
        const v = roomView(p, 640, 640 / aspect, { angle, view });
        const cam =
          view === 'eye'
            ? new PerspectiveCamera(v.fov, aspect, 0.1, 120)
            : new OrthographicCamera(
                (-v.height * aspect) / 2 + v.offset[0],
                (v.height * aspect) / 2 + v.offset[0],
                v.height / 2 + v.offset[1],
                -v.height / 2 + v.offset[1],
                0.1,
                120,
              );
        cam.position.set(...v.position);
        cam.lookAt(...v.target);
        cam.updateMatrixWorld();
        const yaw = Math.atan2(v.position[0] - v.target[0], v.position[2] - v.target[2]);
        assert(yaw >= -Math.PI / 2 && yaw <= Math.PI / 2);
        assert(v.position[2] >= plan.front - 1e-9, 'Camera crossed the room entrance');
        for (const zoom of [0.8, 1.6]) {
          const q = roomView(p, 640, 640 / aspect, { angle, view, zoom });
          assert.deepEqual(q.position, v.position, 'Zoom must preserve the entrance path');
        }
        if (angle === 0 || angle === 180) {
          assert(Math.abs(v.position[0] - (angle === 0 ? -plan.half : plan.half)) < 1e-9);
          assert(Math.abs(v.position[2] - plan.front) < 1e-9, 'Orbit end must meet the side-wall start');
        }
        if (view === 'eye')
          assert(
            v.position[1] - plan.floor >= 3.5 && v.position[1] - plan.floor <= 3.95,
            'Human eye height must be measured from the room floor',
          );
        if (view === 'isometric') {
          assert.equal(v.projection.dist, Infinity, 'Overview must use parallel projection');
          assert(Math.abs(yaw - ((angle - 90) * Math.PI) / 180) < 1e-9);
          if (angle === 135) {
            const origin = new Vector3(0, 0, 0).project(cam);
            const lengths = [
              [1, 0, 0],
              [0, 1, 0],
              [0, 0, 1],
            ].map((q) => {
              const v = new Vector3(...q).project(cam);
              return Math.hypot((v.x - origin.x) * aspect, v.y - origin.y);
            });
            assert(Math.max(...lengths) - Math.min(...lengths) < 1e-7, 'Isometric axes must have equal screen scale');
          }
        }
        if (angle === 90) assert(roomVisible(p, 'left', v) && roomVisible(p, 'right', v));
        if (angle === 90 && view === 'isometric')
          for (const part of fittings.filter((s) => s.mount === 'floor')) {
            const b = part.model.bounds;
            for (const x of [b.lo[0], b.hi[0]])
              for (const y of [b.lo[1], b.hi[1]])
                for (const z of [b.lo[2], b.hi[2]]) {
                  const q = new Vector3(x, y, z).project(cam);
                  assert(
                    Math.abs(q.x) < 1.01 && Math.abs(q.y) < 1.01,
                    `Cropped standing furniture: ${key}/${part.label}/${view}/${aspect}`,
                  );
                }
          }
        if (angle === 180) assert(!roomVisible(p, 'right', v) && roomVisible(p, 'left', v));
        if (angle === 0) assert(!roomVisible(p, 'left', v) && roomVisible(p, 'right', v));
        // Full-envelope framing belongs to the overview; eye level retains its lens.
        if (view === 'isometric')
          for (const b of [table, ...p.items.map((it) => it.bounds)])
            for (const x of [b.lo[0], b.hi[0]])
              for (const y of [b.lo[1], b.hi[1]])
                for (const z of [b.lo[2], b.hi[2]]) {
                  const q = new Vector3(x, y, z).project(cam);
                  assert(Math.abs(q.x) < 0.999 && Math.abs(q.y) < 0.999, `Cropped tabletop ${key}/${angle}/${view}`);
                }
        for (const x of [plan.bounds.lo[0], plan.bounds.hi[0]])
          for (const y of [plan.bounds.lo[1], plan.bounds.hi[1]])
            for (const z of [plan.bounds.lo[2], plan.bounds.hi[2]]) {
              const native = new Vector3(x, y, z).project(cam),
                projected = roomProject(v, [x, y, z]);
              if (view === 'isometric')
                assert(
                  native.z > -1 && native.z < 1 && Math.abs(native.x) < 0.999 && Math.abs(native.y) < 0.999,
                  `Cropped room ${key}/${angle}/${view}/${aspect}`,
                );
              const relative = new Vector3(x, y, z).applyMatrix4(cam.matrixWorldInverse);
              if (view === 'eye' && relative.z > -0.15) continue;
              assert(Math.abs(native.x - ((projected[0] / 640) * 2 - 1)) < 1e-7);
              assert(Math.abs(native.y - (1 - (projected[1] / (640 / aspect)) * 2)) < 1e-7);
            }
      }
}
