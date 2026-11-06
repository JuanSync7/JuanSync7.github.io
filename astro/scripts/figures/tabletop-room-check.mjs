import assert from 'node:assert/strict';
import { OrthographicCamera, PerspectiveCamera, Vector3 } from 'three';

export const checkedRooms = new Set();
export function checkRoom(p, { roomPlan, roomModels, roomView, roomProject, roomVisible, roomControls, tabletop }) {
  const plan = roomPlan(p), parts = roomModels(p), table = tabletop(p).bounds;
  assert.equal(plan.back, table.lo[2], 'Table must meet the middle wall');
  assert.equal(plan.floor, table.lo[1], 'Furniture must stand on the floor');
  assert.equal(parts.filter((s) => !s.interactive && !s.cutaway && s.side !== 'floor').length, 3);
  const floor = parts.find((s) => s.side === 'floor');
  assert(Math.abs(floor.model.bounds.hi[1] - plan.floor) < 1e-9);
  for (const part of parts.filter((s) => s.interactive)) for (const it of p.items) {
    const a = part.model.bounds, b = it.bounds;
    assert(a.hi[0] <= b.lo[0] || a.lo[0] >= b.hi[0] || a.hi[1] <= b.lo[1] || a.lo[1] >= b.hi[1] || a.hi[2] <= b.lo[2] || a.lo[2] >= b.hi[2], `Room fixture intersects ${p.theme.id}/${it.kind}`);
  }
  const key = `${p.theme.id}:${p.roomVariant}`;
  if (checkedRooms.has(key)) return;
  checkedRooms.add(key);
  assert.equal(roomControls({ angle: 999 }).angle, 90);
  assert.equal(roomControls({ angle: -999 }).angle, -90);
  assert.equal(roomControls({ angle: NaN }).angle, 0);
  for (const view of ['eye', 'isometric']) for (const angle of [-90, -60, -30, 0, 30, 45, 60, 90]) for (const aspect of [1, 1.8, 2.4]) {
    const v = roomView(p, 640, 640 / aspect, { angle, view });
    const cam = view === 'eye' ? new PerspectiveCamera(30, aspect, 0.1, 120) : new OrthographicCamera(-v.height * aspect / 2, v.height * aspect / 2, v.height / 2, -v.height / 2, 0.1, 120);
    cam.position.set(...v.position); cam.lookAt(...v.target); cam.updateMatrixWorld();
    const yaw = Math.atan2(v.position[0] - v.target[0], v.position[2] - v.target[2]);
    assert(Math.abs(yaw - angle * Math.PI / 180) < 1e-9, `Incomplete camera sweep ${key}`);
    if (view === 'eye') assert(Math.abs(v.position[1] - p.eye) < 1e-9, 'Eye height changes during orbit');
    if (view === 'isometric') assert.equal(v.projection.dist, Infinity, 'Overview must use parallel projection');
    if (angle === 0) assert(roomVisible(p, 'left', v) && roomVisible(p, 'right', v));
    if (angle === 90) assert(!roomVisible(p, 'right', v) && roomVisible(p, 'left', v));
    if (angle === -90) assert(!roomVisible(p, 'left', v) && roomVisible(p, 'right', v));
    for (const x of [plan.bounds.lo[0], plan.bounds.hi[0]]) for (const y of [plan.bounds.lo[1], plan.bounds.hi[1]]) for (const z of [plan.bounds.lo[2], plan.bounds.hi[2]]) {
      const native = new Vector3(x, y, z).project(cam), projected = roomProject(v, [x, y, z]);
      assert(Math.abs(native.x) < 0.999 && Math.abs(native.y) < 0.999, `Cropped room ${key}/${angle}/${view}/${aspect}`);
      assert(Math.abs(native.x - (projected[0] / 640 * 2 - 1)) < 1e-7);
      assert(Math.abs(native.y - (1 - projected[1] / (640 / aspect) * 2)) < 1e-7);
    }
  }
}
