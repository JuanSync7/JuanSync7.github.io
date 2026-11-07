/** Verify actual geometry, rather than trusting the placement radii or seed thumbnails. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { Box3, PerspectiveCamera, Vector3 } from 'three';
import { semanticCheck } from './tabletop-semantics.mjs';
import { checkRoom, checkedRooms } from './tabletop-room-check.mjs';

const dir = mkdtempSync(join(tmpdir(), 'tabletop-check-'));
function rng(seed) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const sample = [
  0,
  1,
  7,
  42,
  317,
  2026,
  999_999_999,
  ...Array.from({ length: 1024 }, (_, i) => Math.floor((i * 999_999_999) / 1024)),
];
const kinds = new Set();
const layouts = new Set();
let objects = 0,
  occlusions = 0;
try {
  const canvasRuntime = await build({
    entryPoints: ['src/figures/defineTemplate.ts'],
    bundle: true,
    platform: 'browser',
    write: false,
    metafile: true,
  });
  assert(
    !Object.keys(canvasRuntime.metafile.inputs).some((path) => path.includes('node_modules/three/')),
    'Canvas templates should not load Three.js',
  );
  const out = join(dir, 'scene.mjs');
  await build({
    stdin: {
      contents:
        "export { default, arrange, object } from './src/figures/templates/pixel-still'; export { webglAvailable } from './src/figures/defineThree'; export {THEMES,GAP,tabletop,tableView,TABLE_ASPECT} from './src/figures/kit/tabletop'; export {PROP_KINDS} from './src/figures/kit/tableprops'; export {TableDraft,finish} from './src/figures/kit/tableparts'; export {roomPlan} from './src/figures/kit/roomplan'; export {ROOM_METRICS} from './src/figures/kit/roommetrics'; export {roomModels} from './src/figures/kit/tableroom'; export {roomView,roomProject,roomVisible,roomControls} from './src/figures/kit/roomview';",
      resolveDir: process.cwd(),
      loader: 'ts',
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: out,
  });
  const sceneModule = await import(pathToFileURL(out));
  const {
    default: template,
    arrange,
    object,
    webglAvailable,
    THEMES,
    GAP,
    tabletop,
    tableView,
    TABLE_ASPECT,
    PROP_KINDS,
  } = sceneModule;
  for (const primitive of ['box', 'extrude-reversed', 'lathe', 'lathe-reversed', 'roundRod', 'rod']) {
    const draft = new sceneModule.TableDraft();
    if (primitive === 'box') draft.box(0, 0, 0, 2, 2, 2, 0.1);
    else if (primitive === 'extrude-reversed')
      draft.extrude(
        [
          [-1, -1],
          [-1, 1],
          [1, 1],
          [1, -1],
        ],
        0,
        2,
      );
    else if (primitive === 'roundRod') draft.roundRod([0, 0, 0], [0, 2, 0], 1, 16);
    else if (primitive === 'rod') draft.rod([0, 0, 0], [0, 2, 0], 2);
    else {
      const profile = [
        [0, 0],
        [1, 0],
        [1, 2],
        [0, 2],
      ];
      draft.lathe(primitive === 'lathe-reversed' ? profile.reverse() : profile, 0, 0, 16);
    }
    for (const face of sceneModule.finish(draft).surfaces.filter((s) => s.face)) {
      const points = face.points.map((q) => new Vector3(...q));
      const a = points[0],
        b = points[1],
        c = points[2];
      const normal = new Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a));
      if (normal.lengthSq() < 1e-10) continue;
      const center = points
        .reduce((v, p) => v.add(p), new Vector3())
        .divideScalar(points.length)
        .sub(new Vector3(0, 1, 0));
      assert(normal.dot(center) > 0, `Inward ${primitive} shadow normal`);
    }
  }
  const originalDocument = globalThis.document;
  let released = 0,
    probes = 0;
  try {
    globalThis.document = {
      createElement: () => {
        probes++;
        return { getContext: () => ({ getExtension: () => ({ loseContext: () => released++ }) }) };
      },
    };
    for (let i = 0; i < 18; i++) assert(webglAvailable());
    assert.equal(probes, 1, 'Gallery mounts must reuse the cached capability result');
    assert.equal(released, probes, 'Every created capability probe must release its WebGL context');
    let unsupportedProbes = 0;
    globalThis.document = {
      createElement: () => {
        unsupportedProbes++;
        return { getContext: () => null };
      },
    };
    const unsupported = await import(pathToFileURL(out).href + '?unsupported');
    for (let i = 0; i < 18; i++) assert.equal(unsupported.webglAvailable(), false);
    assert.equal(unsupportedProbes, 1, 'Unavailable capability results must also be cached');
  } finally {
    globalThis.document = originalDocument;
  }
  const cases = [
    ...sample.map((seed) => ({ seed, theme: undefined })),
    ...THEMES.flatMap((theme) => Array.from({ length: 40 }, (_, seed) => ({ seed, theme: theme.id }))),
  ];
  for (const theme of THEMES)
    for (const value of [0, 0.5, 0.999999])
      semanticCheck(
        arrange(() => value, theme.id),
        sceneModule.ROOM_METRICS[theme.id],
      );
  const orientations = new Map(THEMES.map((t) => [t.id, new Set()]));
  const themeCounts = new Map();
  const fixtures = new Map();
  for (const { seed, theme } of cases) {
    const p = arrange(rng(seed ^ 0x9e3779b9), theme);
    themeCounts.set(p.theme.id, (themeCounts.get(p.theme.id) ?? 0) + 1);
    semanticCheck(p, sceneModule.ROOM_METRICS[p.theme.id]);
    checkRoom(p, sceneModule);
    orientations.get(p.theme.id).add(p.mirror);
    assert.deepEqual(p, arrange(rng(seed ^ 0x9e3779b9), theme), `non-deterministic seed ${seed}`);
    assert(p.items.length >= p.theme.minItems && p.items.length <= p.theme.targetItems, `bad count, seed ${seed}`);
    assert.equal(template.instance(seed).kind, 'three');
    assert.equal(template.instance(seed).id, `pixel-still~${seed}`);
    layouts.add(JSON.stringify(p.items.map(({ kind, x, z }) => [kind, x, z])));
    const cam = new PerspectiveCamera(30, TABLE_ASPECT, 0.1, 60);
    const view = tableView(p);
    assert(view.pitch > 0 && view.pitch < 0.2, `overhead view ${seed}`);
    assert(p.eye > 1.8 && p.eye < 2.6, `not at eye height ${seed}`);
    for (const aspect of [1, 2.4]) {
      const resized = tableView(p, aspect, 1);
      assert(Math.abs(Math.sin(resized.pitch) * resized.dist - p.eye) < 1e-9, `eye rises on resize ${seed}`);
    }
    cam.position.set(
      Math.sin(p.yaw) * Math.cos(view.pitch) * p.dist,
      Math.sin(view.pitch) * p.dist,
      Math.cos(p.yaw) * Math.cos(view.pitch) * p.dist,
    );
    cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld();
    const furnitureModel = tabletop(p);
    const workingFace = furnitureModel.surfaces
      .filter((s) => s.face && s.points.every((q) => Math.abs(q[1]) < 1e-9))
      .sort((a, b) => b.points.length - a.points.length)[0];
    assert(workingFace, 'Missing working surface');
    const [ta, tb, tc] = workingFace.points.map((q) => new Vector3(...q));
    assert(
      new Vector3().crossVectors(tb.clone().sub(ta), tc.clone().sub(ta)).y > 0,
      'Table working surface has an inward normal',
    );
    if (!fixtures.has(p.theme.id))
      fixtures.set(
        p.theme.id,
        furnitureModel.surfaces
          .filter((s) => s.face && s.points.some((q) => q[1] > 0.025))
          .map((s) => ({
            lo: [0, 1, 2].map((axis) => Math.min(...s.points.map((q) => q[axis]))),
            hi: [0, 1, 2].map((axis) => Math.max(...s.points.map((q) => q[axis]))),
          })),
      );
    const projected = [];
    for (const x of [furnitureModel.bounds.lo[0], furnitureModel.bounds.hi[0]])
      for (const y of [furnitureModel.bounds.lo[1], furnitureModel.bounds.hi[1]])
        for (const z of [furnitureModel.bounds.lo[2], furnitureModel.bounds.hi[2]]) {
          const v = new Vector3(x, y, z).project(cam);
          assert(Math.abs(v.x) < 1 && Math.abs(v.y) < 1, `cropped table ${seed}/${p.theme.id}`);
        }
    for (const [i, it] of p.items.entries()) {
      kinds.add(it.kind);
      objects++;
      const g = object(it);
      g.updateMatrixWorld(true);
      const bounds = new Box3().setFromObject(g, true);
      for (const fitting of fixtures.get(p.theme.id))
        assert(
          bounds.max.x <= fitting.lo[0] ||
            bounds.min.x >= fitting.hi[0] ||
            bounds.max.y <= fitting.lo[1] ||
            bounds.min.y >= fitting.hi[1] ||
            bounds.max.z <= fitting.lo[2] ||
            bounds.min.z >= fitting.hi[2],
          `table fitting intersects ${seed}/${p.theme.id}/${it.kind}`,
        );
      assert(
        bounds.min.x > -p.theme.w / 2 &&
          bounds.max.x < p.theme.w / 2 &&
          bounds.min.z > -p.theme.d / 2 &&
          bounds.max.z < p.theme.d / 2,
        `off table ${seed}/${it.kind}`,
      );
      assert(
        bounds.min.y >= -0.00001 && bounds.max.y <= it.bounds.hi[1] + 0.00001,
        `height envelope ${seed}/${it.kind}`,
      );
      const corners = [];
      for (const x of [bounds.min.x, bounds.max.x])
        for (const y of [bounds.min.y, bounds.max.y])
          for (const z of [bounds.min.z, bounds.max.z]) corners.push(new Vector3(x, y, z).project(cam));
      if (p.theme.surface === 'oval')
        for (const x of [bounds.min.x, bounds.max.x])
          for (const z of [bounds.min.z, bounds.max.z])
            assert(
              (x / (p.theme.w / 2 - 0.08)) ** 2 + (z / (p.theme.d / 2 - 0.08)) ** 2 < 0.98,
              `off oval surface ${seed}`,
            );
      const rect = [
        Math.min(...corners.map((q) => q.x)),
        Math.min(...corners.map((q) => q.y)),
        Math.max(...corners.map((q) => q.x)),
        Math.max(...corners.map((q) => q.y)),
      ];
      assert(
        rect.every((n) => Math.abs(n) < 1),
        `cropped seed ${seed}`,
      );
      for (const other of projected)
        if (!(rect[2] < other[0] || other[2] < rect[0] || rect[3] < other[1] || other[3] < rect[1])) occlusions++;
      projected.push(rect);
      g.traverse((o) => {
        if (o.isMesh) {
          assert(o.material.isMeshStandardMaterial, `unlit wireframe prop ${it.kind}`);
          assert(o.geometry.getAttribute('normal'), `missing lighting normals ${it.kind}`);
        }
        if (o.geometry) {
          const pos = o.geometry.getAttribute('position');
          for (let k = 0; k < pos.count; k++) {
            const v = new Vector3().fromBufferAttribute(pos, k).applyMatrix4(o.matrixWorld);
            assert(
              v.x >= it.bounds.lo[0] - 0.00001 &&
                v.x <= it.bounds.hi[0] + 0.00001 &&
                v.z >= it.bounds.lo[2] - 0.00001 &&
                v.z <= it.bounds.hi[2] + 0.00001,
              `undersized footprint ${seed}/${it.kind}`,
            );
          }
          o.geometry.dispose();
        }
        for (const m of Array.isArray(o.material) ? o.material : o.material ? [o.material] : []) m.dispose();
      });
      for (const other of p.items.slice(0, i))
        assert(
          it.bounds.hi[0] + GAP < other.bounds.lo[0] ||
            other.bounds.hi[0] + GAP < it.bounds.lo[0] ||
            it.bounds.hi[2] + GAP < other.bounds.lo[2] ||
            other.bounds.hi[2] + GAP < it.bounds.lo[2],
          `physical overlap ${seed}`,
        );
    }
  }
  assert.equal(kinds.size, PROP_KINDS.length);
  assert.equal(themeCounts.size, 9);
  assert.equal(checkedRooms.size, 27, 'All seeded room construction variants must be covered');
  const furniture = new Set(THEMES.map((t) => JSON.stringify(tabletop(arrange(rng(42), t.id)).surfaces)));
  assert.equal(furniture.size, 9, 'Each theme needs its own table geometry');
  for (const t of THEMES) {
    const finishes = new Set(tabletop(arrange(rng(42), t.id)).surfaces.map((s) => s.finish));
    assert(finishes.size >= 4 && !finishes.has(undefined), `${t.id} lacks distinct construction finishes`);
  }
  for (const [theme, values] of orientations)
    assert.equal(values.size, 2, `${theme} never varies its layout orientation`);
  assert(layouts.size > 1300);
  assert(occlusions > 1000, 'Eye-level density should allow natural visual occlusion');
  console.log(
    `Tabletop passed: ${cases.length} layouts, ${objects} objects, ${kinds.size} props, ${checkedRooms.size} seeded rooms; deterministic, themed room anchors, no physical overlaps, with the tabletop framed across the 0–180° entrance arc and equal-axis isometric projection.`,
  );
} finally {
  rmSync(dir, { recursive: true, force: true });
}
