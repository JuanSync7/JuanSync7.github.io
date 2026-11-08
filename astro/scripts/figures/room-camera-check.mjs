/** Independent eye-camera and ceiling acceptance, including rejected output mutations. */
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PerspectiveCamera, Scene, Vector3 } from 'three';
const limits = JSON.parse(readFileSync('scripts/figures/room-camera-limits.json', 'utf8'));
const scratch = mkdtempSync(join(tmpdir(), 'room-camera-'));
const report = {
  schema: 'room-camera-check/1',
  passed: false,
  rooms: 0,
  poses: 0,
  negativeFixtures: 0,
  baselineRejected: 0,
};
mkdirSync('figures-out', { recursive: true });
const near = (a, b, message) => assert(Math.abs(a - b) < 1e-8, `${message}: ${a} / ${b}`);
function checkLens(views) {
  for (const v of views) {
    near(v.fov, views[0].fov, 'Orbit must retain its lens');
    near(v.position[1], v.target[1], 'Eye sightline must be level');
    assert(v.fov >= limits.eyeFovMin && v.fov <= limits.eyeFovMax, 'Eye lens must retain a natural perspective');
  }
}
function roofFace(part, plan) {
  assert(part && part.side === 'ceiling', 'Room needs a real ceiling');
  const underside = part.model.surfaces.find((s) => {
    if (!s.face || !s.points.every((p) => Math.abs(p[1] - plan.top) < 1e-8)) return false;
    const area = s.points.reduce((sum, p, i, points) => {
      const q = points[(i + 1) % points.length];
      return sum + p[0] * q[2] - q[0] * p[2];
    }, 0);
    return area > 0;
  });
  assert(underside, 'Ceiling needs an inward-facing underside at the wall tops');
  for (const axis of [0, 2]) {
    const values = underside.points.map((p) => p[axis]);
    assert(Math.min(...values) <= (axis === 0 ? -plan.half : plan.back), 'Ceiling must close the room envelope');
    assert(Math.max(...values) >= (axis === 0 ? plan.half : plan.front), 'Ceiling must close the room envelope');
  }
}
function checkGrout(floor, r) {
  const faces = floor.model.surfaces.filter((s) => s.face && s.finish === 'recess');
  let area = 0;
  for (const face of faces) {
    assert(
      face.points.every((p) => Math.abs(p[1] - (r.floor - 0.07)) < 1e-8),
      'Grout needs one upward level',
    );
    for (const axis of [0, 2]) {
      const values = face.points.map((p) => p[axis]);
      assert(
        Math.max(...values) - Math.min(...values) <= 1.5 + 1e-8,
        'Grout must be tessellated for endpoint clipping',
      );
    }
    const a = face.points.reduce((sum, p, i, points) => {
      const q = points[(i + 1) % points.length];
      return sum + p[0] * q[2] - q[0] * p[2];
    }, 0);
    assert(a < 0, 'Grout must face into the room');
    area -= a / 2;
  }
  near(area, r.half * 2 * (r.front - r.back), 'Grout must cover the continuous floor');
}
writeFileSync('figures-out/room-camera-report.json', JSON.stringify(report, null, 2) + '\n');
try {
  const file = join(scratch, 'scene.mjs');
  await build({
    stdin: {
      contents:
        "export {arrange,THEMES,tabletop} from './src/figures/kit/tabletop';export {roomPlan} from './src/figures/kit/roomplan';export {roomModels} from './src/figures/kit/tableroom';export {roomView,roomVisible,roomProject} from './src/figures/kit/roomview';export {sceneModels} from './src/figures/kit/roomscene';export {flatRoomSurfaces} from './src/figures/kit/roomflatorder';export {roomLighting} from './src/figures/kit/roomlight';",
      resolveDir: process.cwd(),
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: file,
  });
  const {
    arrange,
    THEMES,
    tabletop,
    roomPlan,
    roomModels,
    roomView,
    roomVisible,
    roomProject,
    sceneModels,
    flatRoomSurfaces,
    roomLighting,
  } = await import(pathToFileURL(file));
  for (const theme of THEMES) {
    const roofs = new Set();
    for (const roomVariant of [0, 1, 2]) {
      const p = { ...arrange(() => 0.5, theme.id), roomVariant },
        r = roomPlan(p),
        parts = roomModels(p),
        roof = parts.find((s) => s.side === 'ceiling');
      roofFace(roof, r);
      checkGrout(
        parts.find((s) => s.side === 'floor'),
        r,
      );
      roofs.add(JSON.stringify(roof.model.surfaces));
      assert(
        roof.model.surfaces.some((s) => s.points.some((q) => q[1] < r.top - 0.01)),
        'Theme ceiling needs physical interior details',
      );
      const bounds = roof.model.bounds;
      for (const axis of [0, 1, 2])
        assert(
          bounds.lo[axis] >= r.bounds.lo[axis] - 1e-8 && bounds.hi[axis] <= r.bounds.hi[axis] + 1e-8,
          'Roof must stay within the room bounds',
        );
      assert(
        bounds.lo[1] >= r.top - 0.17 && bounds.hi[1] <= r.bounds.hi[1] + 1e-8,
        'Roof must remain in its architectural envelope',
      );
      for (const aspect of [1, 1.8, 2.4])
        for (const zoom of [0.8, 1, 1.6]) {
          const views = Array.from({ length: 37 }, (_, i) =>
            roomView(p, 960, 960 / aspect, { angle: i * 5, view: 'eye', zoom }),
          );
          checkLens(views);
          for (const [i, v] of views.entries()) {
            const mirror = views[36 - i];
            near(v.position[0], -mirror.position[0], 'Entrance path must mirror');
            near(v.position[2], mirror.position[2], 'Entrance path must mirror');
            near(v.position[1], p.eye, 'Human eye height must remain fixed');
            const a = roomProject(v, [1, r.floor + 1, r.back + 1]),
              b = roomProject(mirror, [-1, r.floor + 1, r.back + 1]);
            near(a[0] + b[0], 960, 'Mirrored eye projections must agree');
            near(a[1], b[1], 'Mirrored eye projections must agree');
            assert(roomVisible(p, 'ceiling', v), 'Eye view must retain its ceiling');
            // The primary activity stays in the unzoomed frame. Peripheral furniture
            // may crop naturally, without changing the lens to rescue its bounds.
            if (zoom === 1) {
              const t = tabletop(p).bounds,
                center = [0, (t.lo[1] + t.hi[1]) / 2, (t.lo[2] + t.hi[2]) / 2];
              const cam = new PerspectiveCamera(v.fov, aspect, 0.15, 120);
              cam.position.set(...v.position);
              cam.lookAt(...v.target);
              cam.updateMatrixWorld();
              const q = new Vector3(...center).project(cam);
              assert(
                Math.abs(q.x) < 0.9 && Math.abs(q.y) < 0.9 && Math.abs(q.z) < 1,
                'Primary activity must remain in view',
              );
            }
            report.poses++;
          }
        }
      if (['lab', 'kitchen', 'bar'].includes(theme.id)) {
        const lighting = roomLighting(new Scene(), { shadowMap: {} }, p, () => {});
        assert(
          lighting.key.position.y < r.top && lighting.key.position.y > r.floor,
          'Ceiling/pendant shadow key must be inside the closed room',
        );
        const source = lighting.key.position;
        assert(
          parts.some((part) =>
            part.model.surfaces.some((s) => {
              if (s.finish !== 'light' || !s.face) return false;
              const lo = [0, 1, 2].map((axis) => Math.min(...s.points.map((p) => p[axis]))),
                hi = [0, 1, 2].map((axis) => Math.max(...s.points.map((p) => p[axis])));
              return (
                source.x >= lo[0] &&
                source.x <= hi[0] &&
                source.z >= lo[2] &&
                source.z <= hi[2] &&
                lo[1] > source.y &&
                lo[1] - source.y < 0.1
              );
            }),
          ),
          'Ceiling/pendant shadow key must sit just below an actual luminous fixture',
        );
      }
      const models = sceneModels(p),
        roofIndex = models.findIndex((s) => s.side === 'ceiling');
      for (const angle of [0, 90, 180]) {
        const eye = roomView(p, 960, 540, { view: 'eye', angle }),
          iso = roomView(p, 960, 540, { view: 'isometric', angle });
        assert(!roomVisible(p, 'ceiling', iso), 'Overview must cut away roof');
        assert(
          flatRoomSurfaces(p, models, eye).some((s) => s.index === roofIndex),
          'Fallback must draw the real ceiling',
        );
        assert(
          !flatRoomSurfaces(p, models, iso).some((s) => s.index === roofIndex),
          'Fallback overview must cut away roof',
        );
      }
      report.rooms++;
    }
    assert.equal(roofs.size, 3, 'Seed variants must change the ceiling construction');
  }
  const p = arrange(() => 0.5, 'study'),
    views = [0, 90, 180].map((angle) => roomView(p, 960, 540, { view: 'eye', angle }));
  for (const change of [
    (v) => {
      v[0].fov = 138;
    },
    (v) => {
      v[0].target[1] -= 0.1;
    },
    (v) => {
      v[0].fov = 100;
      v[1].fov = 100;
      v[2].fov = 100;
    },
  ]) {
    const broken = structuredClone(views);
    change(broken);
    assert.throws(() => checkLens(broken));
    report.negativeFixtures++;
  }
  const r = roomPlan(p),
    roof = roomModels(p).find((s) => s.side === 'ceiling');
  assert.throws(() => roofFace(undefined, r));
  report.negativeFixtures++;
  const lifted = structuredClone(roof);
  for (const s of lifted.model.surfaces) for (const q of s.points) q[1] += 0.05;
  assert.throws(() => roofFace(lifted, r));
  report.negativeFixtures++;
  const collapsed = structuredClone(roomModels(p).find((s) => s.side === 'floor'));
  const face = collapsed.model.surfaces.find((s) => s.face && s.finish === 'recess');
  face.points = [
    [-r.half, r.floor - 0.07, r.front],
    [r.half, r.floor - 0.07, r.front],
    [r.half, r.floor - 0.07, r.back],
    [-r.half, r.floor - 0.07, r.back],
  ];
  assert.throws(() => checkGrout(collapsed, r), /tessellated/);
  report.negativeFixtures++;
  const baseline = JSON.parse(readFileSync('scripts/figures/room-camera-before.json', 'utf8'));
  for (const row of baseline.rooms) {
    assert.throws(() => checkLens(row.angles), `Old camera must remain rejected: ${row.theme}`);
    report.baselineRejected++;
  }
  report.passed = true;
  writeFileSync('figures-out/room-camera-report.json', JSON.stringify(report, null, 2) + '\n');
  console.log(
    `Room camera/ceiling passed: ${report.rooms} theme variants, ${report.poses} eye poses, ${report.negativeFixtures} rejected defects.`,
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
