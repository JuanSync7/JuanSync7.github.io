/** Verify actual geometry, rather than trusting the placement radii or seed thumbnails. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { Box3, PerspectiveCamera, Vector3 } from 'three';

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
    entryPoints: ['src/figures/templates/pixel-still.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: out,
  });
  const { default: template, arrange, object } = await import(pathToFileURL(out));
  for (const seed of sample) {
    const p = arrange(rng(seed ^ 0x9e3779b9));
    assert.deepEqual(p, arrange(rng(seed ^ 0x9e3779b9)), `non-deterministic seed ${seed}`);
    assert(p.items.length >= 3 && p.items.length <= 7, `bad count, seed ${seed}`);
    assert.equal(template.instance(seed).kind, 'three');
    assert.equal(template.instance(seed).id, `pixel-still~${seed}`);
    layouts.add(JSON.stringify(p.items.map(({ kind, x, z }) => [kind, x, z])));
    const cam = new PerspectiveCamera(30, 2, 0.1, 60);
    cam.position.set(
      Math.sin(p.yaw) * Math.cos(p.pitch) * 11.2,
      Math.sin(p.pitch) * 11.2,
      Math.cos(p.yaw) * Math.cos(p.pitch) * 11.2,
    );
    cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld();
    const projected = [];
    for (const [i, it] of p.items.entries()) {
      kinds.add(it.kind);
      objects++;
      const g = object(it);
      g.updateMatrixWorld(true);
      const bounds = new Box3().setFromObject(g, true);
      assert(
        bounds.min.x > -2.9 && bounds.max.x < 2.9 && bounds.min.z > -1.6 && bounds.max.z < 1.6,
        `off table ${seed}/${it.kind}`,
      );
      assert(bounds.min.y >= -0.00001 && bounds.max.y <= it.height + 0.00001, `height envelope ${seed}/${it.kind}`);
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
            assert(Math.hypot(v.x - it.x, v.z - it.z) <= it.r + 0.00001, `undersized footprint ${seed}/${it.kind}`);
          }
          o.geometry.dispose();
        }
        for (const m of Array.isArray(o.material) ? o.material : o.material ? [o.material] : []) m.dispose();
      });
      for (const other of p.items.slice(0, i))
        assert(
          Math.hypot(it.x - other.x, it.z - other.z) >= it.r + other.r + 0.14 - 0.00001,
          `physical overlap ${seed}`,
        );
    }
  }
  assert.equal(kinds.size, 9);
  assert.equal(layouts.size, new Set(sample).size);
  console.log(
    `Tabletop passed: ${sample.length} seeds, ${objects} objects, all 9 kinds; deterministic, on-table, no physical or projected overlaps.`,
  );
} finally {
  rmSync(dir, { recursive: true, force: true });
}
