/** Judge emitted light state and seeded output independently of scene construction. */
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Scene, Texture, AdditiveBlending, SRGBColorSpace } from 'three';
const scratch = mkdtempSync(join(tmpdir(), 'room-lighting-'));
const report = {
  schema: 'room-lighting-check/1',
  passed: false,
  rooms: 0,
  palettes: 0,
  negativeFixtures: [],
  examples: [],
};
mkdirSync('figures-out', { recursive: true });
const save = () => writeFileSync('figures-out/room-lighting-report.json', JSON.stringify(report, null, 2) + '\n');
save();
function lightBudget(state) {
  const lights = [];
  state.scene.traverse((o) => {
    if (o.isLight) lights.push(o);
  });
  assert.equal(lights.filter((o) => o.castShadow).length, 1, 'One shadow source budget');
  assert(state.key.intensity > 2 * (state.sky.intensity + state.bounce.intensity), 'Fill overwhelms key');
  assert(state.scene.fog.density >= 0 && state.scene.fog.density <= 0.014, 'Fog obscures the room');
  assert(state.glow.sprites.length <= 6, 'Emitter glow budget');
  for (const { sprite, source } of state.glow.sprites) {
    assert(sprite.position.equals(source.light.position), 'Detached emitter glow');
    assert(sprite.material.depthTest && !sprite.material.depthWrite, 'Glow paints through walls');
    assert.equal(sprite.material.blending, AdditiveBlending);
    assert.equal(sprite.material.map.colorSpace, SRGBColorSpace);
    assert(sprite.material.opacity <= 0.3, 'Glow washes out detail');
  }
}
try {
  const file = join(scratch, 'scene.mjs');
  await build({
    stdin: {
      contents:
        "export {arrange,THEMES,tabletop} from './src/figures/kit/tabletop';export {mulberry32} from './src/figures/kit/rng';export {roomStyle} from './src/figures/kit/roompalettes';export {roomModels} from './src/figures/kit/tableroom';export {roomPlan} from './src/figures/kit/roomplan';export {roomPaint} from './src/figures/kit/roompaint';export {roomLightPlan} from './src/figures/kit/roomlightplan';export {roomLighting,setRoomLighting} from './src/figures/kit/roomlight';export {roomFaceLight} from './src/figures/kit/roomshade';export {roomTones} from './src/styles/tokens/palette';",
      resolveDir: process.cwd(),
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    packages: 'external',
    outfile: file,
    plugins: [
      {
        name: 'project-three',
        setup(b) {
          b.onResolve({ filter: /^three($|\/)/ }, ({ path }) => ({
            path: pathToFileURL(resolve('node_modules', path === 'three' ? 'three/build/three.module.js' : path)).href,
            external: true,
          }));
        },
      },
    ],
  });
  const api = await import(pathToFileURL(file));
  const {
    arrange,
    THEMES,
    mulberry32,
    roomStyle,
    roomModels,
    roomPlan,
    roomPaint,
    roomLightPlan,
    roomLighting,
    setRoomLighting,
    roomFaceLight,
    tabletop,
    roomTones,
  } = api;
  const fields = ['paletteVariant', 'layoutVariant', 'furnitureVariant', 'lightVariant'];
  for (const theme of THEMES) {
    const p = arrange(mulberry32(42), theme.id),
      palettes = new Set(),
      tables = new Set();
    assert.deepEqual(p, arrange(mulberry32(42), theme.id), 'Seed replay drift');
    for (let v = 0; v < 4; v++) {
      const style = roomStyle(theme.id, v);
      palettes.add(JSON.stringify(style));
      for (const role of ['wall', 'wood', 'top', 'floor', 'accent', 'textile', 'metal'])
        assert(Object.hasOwn(roomTones, style[role]));
      assert.equal(roomPaint('table', theme.id, 'top', 1, 0, v).tone, style.top, 'Table ignores seed palette');
      assert.equal(roomPaint('room', theme.id, 'wall', 1, 0, v).tone, style.wall, 'Walls ignore seed palette');
      assert.strictEqual(
        roomModels({ ...p, paletteVariant: v }),
        roomModels(p),
        'Paint must not contaminate geometry cache',
      );
      report.palettes++;
    }
    assert.equal(palettes.size, 4, `${theme.id}: palettes collapsed`);
    for (let v = 0; v < 3; v++) tables.add(JSON.stringify(tabletop({ ...p, furnitureVariant: v }).surfaces));
    assert.equal(tables.size, 3, `${theme.id}: furniture design collapsed`);
    for (const roomVariant of [0, 1, 2])
      for (const layoutVariant of [0, 1, 2])
        for (const lightVariant of [0, 1, 2]) {
          const q = { ...p, roomVariant, layoutVariant, lightVariant },
            r = roomPlan(q),
            plan = roomLightPlan(q);
          assert.deepEqual(q.items, p.items, 'Room variations moved table inventory');
          assert.deepEqual(tabletop(q).bounds, tabletop(p).bounds, 'Table anchor moved');
          const other = { ...q, layoutVariant: layoutVariant === 1 ? 0 : 1 },
            flipped = roomLightPlan(other);
          assert(Math.abs(plan.key[0] + flipped.key[0]) < 1e-9, 'Window light does not mirror with room');
          assert(
            plan.key[1] < r.top || ['warm', 'day', 'night'].includes(roomStyle(theme.id).mood),
            'Ceiling blocks key',
          );
          const scene = new Scene(),
            cleanups = [],
            renderer = { shadowMap: {} },
            state = roomLighting(scene, renderer, q, (fn) => cleanups.push(fn));
          let reflections = 0;
          const texture = new Texture();
          state.environment = () => {
            reflections++;
            return texture;
          };
          setRoomLighting(state, 'monochrome');
          assert.equal(reflections, 0);
          lightBudget(state);
          assert.equal(scene.environment, null);
          assert.equal(scene.environmentIntensity, 0);
          setRoomLighting(state, 'colour');
          assert.equal(scene.environment, texture);
          lightBudget(state);
          setRoomLighting(state, 'monochrome');
          lightBudget(state);
          assert.equal(scene.environment, null);
          const map = state.glow.sprites[0]?.sprite.material.map;
          let disposed = 0;
          map?.addEventListener('dispose', () => disposed++);
          for (const fn of cleanups) fn();
          if (map) assert.equal(disposed, 1, 'Glow texture leaked');
          assert.equal(scene.children.filter((o) => o.isSprite).length, 0, 'Glow sprites leaked');
          texture.dispose();
          report.rooms++;
        }
    const points = [
      [0, 0, 0],
      [0, 0, 1],
      [1, 0, 1],
      [1, 0, 0],
    ];
    assert(
      Math.abs(roomFaceLight(p, points) - roomFaceLight(p, [...points].reverse())) > 0.15,
      'Opposing faces flatten to equal shade',
    );
    const values = fields.map(() => new Set());
    for (let seed = 0; seed < 80; seed++) {
      const q = arrange(mulberry32(seed), theme.id);
      fields.forEach((f, i) => values[i].add(q[f]));
    }
    values.forEach((v, i) => assert.equal(v.size, i === 0 ? 4 : 3, `${theme.id}/${fields[i]} seed diversity`));
  }
  const p = arrange(mulberry32(10), 'bar'),
    state = roomLighting(new Scene(), { shadowMap: {} }, p, () => {});
  state.environment = () => new Texture();
  setRoomLighting(state, 'monochrome');
  for (const [name, change, restore, message] of [
    ['flat ambient', () => (state.sky.intensity = 10), () => (state.sky.intensity = 0.5), /Fill overwhelms/],
    [
      'extra shadow caster',
      () => (state.accent.castShadow = true),
      () => (state.accent.castShadow = false),
      /One shadow/,
    ],
    ['dense fog', () => (state.scene.fog.density = 0.4), () => (state.scene.fog.density = 0), /Fog obscures/],
    [
      'glow through wall',
      () => (state.glow.sprites[0].sprite.material.depthTest = false),
      () => (state.glow.sprites[0].sprite.material.depthTest = true),
      /through walls/,
    ],
    [
      'detached glow',
      () => (state.glow.sprites[0].sprite.position.x += 1),
      () => state.glow.sprites[0].sprite.position.copy(state.glow.sprites[0].source.light.position),
      /Detached/,
    ],
  ]) {
    change();
    assert.throws(() => lightBudget(state), message);
    restore();
    report.negativeFixtures.push(name);
  }
  const found = new Set();
  for (let seed = 0; seed < 5000 && found.size < 36; seed++) {
    const p = arrange(mulberry32((seed ^ 0x9e3779b9) >>> 0)),
      key = `${p.theme.id}:${p.paletteVariant}`;
    if (!found.has(key)) {
      found.add(key);
      report.examples.push({ theme: p.theme.id, seed, ...Object.fromEntries(fields.map((f) => [f, p[f]])) });
    }
  }
  assert.equal(found.size, 36);
  report.passed = true;
  save();
  console.log(
    `Room lighting passed: ${report.rooms} emitted light states, ${report.palettes} coordinated palettes, three furniture designs per theme, seed replay and ${report.negativeFixtures.length} rejected failures.`,
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
