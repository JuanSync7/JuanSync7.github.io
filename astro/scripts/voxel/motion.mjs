import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const directory = mkdtempSync(join(tmpdir(), 'voxel-motion-'));
process.on('exit', () => rmSync(directory, { recursive: true, force: true }));
const modulePath = join(directory, 'render.mjs');
const bundle = await build({ stdin: { contents: "export * from './src/figures/kit/voxel-world/render'; export { Scene, PerspectiveCamera, Matrix4, InstancedMesh, Mesh, Line } from 'three';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', write: false });
writeFileSync(modulePath, bundle.outputFiles[0].text);
const { Scene, PerspectiveCamera, Matrix4, InstancedMesh, Mesh, Line, buildWorldView, updateWorldView } = await import(pathToFileURL(modulePath));
for (const biome of ['woodland', 'mushroom', 'snow', 'volcanic', 'oasis', 'village']) {
  const spec = { biome, radius: 19, stretch: 0.94, turn: 0, density: 0.6, anchor: 0 };
  const scene = new Scene(), camera = new PerspectiveCamera();
  const state = buildWorldView({ scene, camera, rng: () => 0.5 }, spec, 42);
  const land = state.root.children.find(c => c instanceof InstancedMesh);
  const originalLand = land.instanceMatrix.array.slice();
  const sample = state.waterCells.findIndex(c => c.liquid.level === 0 && c.liquid.kind === 'water' && !c.edge);
  const matrix = new Matrix4();
  function frame(t) {
    updateWorldView({ state, camera, scene, w: 900, h: 562, t, dt: 1/60, hover: 0, pointer: { x: 0.5, y: 0.5, active: false }, pulses: [], still: true });
    state.water.getMatrixAt(sample, matrix);
    assert([...state.water.instanceMatrix.array].every(Number.isFinite), `${biome}: invalid water matrix`);
    state.boats.forEach((boat, i) => {
      assert(Math.abs(boat.position.y - state.world.boats[i].y) <= 0.151, `${biome}: boat exceeds swell envelope`);
      assert(Math.abs(boat.rotation.z) <= 0.0181 && Math.abs(boat.rotation.x) <= 0.0121, `${biome}: unsafe boat roll`);
    });
    assert.deepEqual(land.instanceMatrix.array, originalLand, `${biome}: moving solid terrain`);
    return { water: [...matrix.elements], boats: state.boats.map(b => [b.position.y, b.rotation.x, b.rotation.z]) };
  }
  const rest = frame(1.2), later = frame(3.4);
  assert.notDeepEqual(rest.water, later.water, `${biome}: frozen wave animation`);
  assert.notDeepEqual(rest.boats, later.boats, `${biome}: frozen boats`);
  assert.deepEqual(frame(1.2), rest, `${biome}: time-based animation must repeat exactly`);
  scene.traverse(o => {
    if(o instanceof Mesh || o instanceof Line) { o.geometry.dispose(); for(const material of Array.isArray(o.material) ? o.material : [o.material]) material.dispose(); }
  });
}
console.log('Passed: six biomes, animated water and boats, bounded bob and roll, static terrain, deterministic time sampling.');
