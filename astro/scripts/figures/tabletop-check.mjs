/** Verify actual geometry, rather than trusting the placement radii or seed thumbnails. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { Box3, PerspectiveCamera, Vector3 } from 'three';
import { semanticCheck } from './tabletop-semantics.mjs';

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
let objects = 0;
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
        "export { default, arrange, object } from './src/figures/templates/pixel-still'; export { webglAvailable } from './src/figures/defineThree'; export {THEMES,GAP,tabletop} from './src/figures/kit/tabletop'; export {PROP_KINDS} from './src/figures/kit/tableprops';",
      resolveDir: process.cwd(),
      loader: 'ts',
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: out,
  });
  const {
    default: template,
    arrange,
    object,
    webglAvailable,
    THEMES,
    GAP,
    tabletop,
    PROP_KINDS,
  } = await import(pathToFileURL(out));
  const originalDocument = globalThis.document;
  let released = 0;
  try {
    globalThis.document = {
      createElement: () => ({
        getContext: () => ({
          getExtension: () => ({ loseContext: () => released++ }),
        }),
      }),
    };
    for (let i = 0; i < 18; i++) assert(webglAvailable());
    assert.equal(released, 18, 'Every capability probe must release its WebGL context');
    globalThis.document = { createElement: () => ({ getContext: () => null }) };
    assert.equal(webglAvailable(), false);
  } finally {
    globalThis.document = originalDocument;
  }
  const cases = [
    ...sample.map((seed) => ({ seed, theme: undefined })),
    ...THEMES.flatMap((theme) => Array.from({ length: 40 }, (_, seed) => ({ seed, theme: theme.id }))),
  ];
  for (const theme of THEMES) for (const value of [0, 0.5, 0.999999]) semanticCheck(arrange(() => value, theme.id));
  const orientations = new Map(THEMES.map((t) => [t.id, new Set()]));
  const themeCounts = new Map();
  for (const { seed, theme } of cases) {
    const p = arrange(rng(seed ^ 0x9e3779b9), theme);
    themeCounts.set(p.theme.id, (themeCounts.get(p.theme.id) ?? 0) + 1);
    semanticCheck(p);
    orientations.get(p.theme.id).add(p.mirror);
    assert.deepEqual(p, arrange(rng(seed ^ 0x9e3779b9), theme), `non-deterministic seed ${seed}`);
    assert(p.items.length >= 4 && p.items.length <= 14, `bad count, seed ${seed}`);
    assert.equal(template.instance(seed).kind, 'three');
    assert.equal(template.instance(seed).id, `pixel-still~${seed}`);
    layouts.add(JSON.stringify(p.items.map(({ kind, x, z }) => [kind, x, z])));
    const cam = new PerspectiveCamera(30, 2, 0.1, 60);
    cam.position.set(
      Math.sin(p.yaw) * Math.cos(p.pitch) * p.dist,
      Math.sin(p.pitch) * p.dist,
      Math.cos(p.yaw) * Math.cos(p.pitch) * p.dist,
    );
    cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld();
    const projected = [];
    for (const x of [-p.theme.w / 2, p.theme.w / 2])
      for (const y of [tabletop(p).bounds.lo[1], 0])
        for (const z of [-p.theme.d / 2, p.theme.d / 2]) {
          const v = new Vector3(x, y, z).project(cam);
          assert(Math.abs(v.x) < 1 && Math.abs(v.y) < 1, `cropped table ${seed}/${p.theme.id}`);
        }
    for (const [i, it] of p.items.entries()) {
      kinds.add(it.kind);
      objects++;
      const g = object(it);
      g.updateMatrixWorld(true);
      const bounds = new Box3().setFromObject(g, true);
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
        assert(
          rect[2] < other[0] || other[2] < rect[0] || rect[3] < other[1] || other[3] < rect[1],
          `screen overlap ${seed}`,
        );
      projected.push(rect);
      g.traverse((o) => {
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
  for (const [theme, values] of orientations)
    assert.equal(values.size, 2, `${theme} never varies its layout orientation`);
  assert(layouts.size > 1300);
  console.log(
    `Tabletop passed: ${cases.length} themed layouts, ${objects} objects, ${kinds.size} prop kinds across all 9 themes; deterministic, on-table, no physical or projected overlaps.`,
  );
} finally {
  rmSync(dir, { recursive: true, force: true });
}
