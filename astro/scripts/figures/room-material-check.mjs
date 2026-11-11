import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { MeshStandardMaterial, ShaderLib, ShaderChunk } from 'three';
const scratch = mkdtempSync(join(tmpdir(), 'room-materials-'));
try {
  const file = join(scratch, 'materials.mjs');
  await build({
    stdin: {
      contents:
        "export {roomTones,night} from './src/styles/tokens/palette'; export {roomPaint,MATERIAL_PATTERNS} from './src/figures/kit/roompaint'; export {ROOM_STYLES} from './src/figures/kit/roomstyles'; export {LIGHT_MOODS} from './src/figures/kit/roomlightmoods'; export {attachRoomMaterial,applyRoomMaterial} from './src/figures/kit/roommaterial'; export {roomTonalDepth} from './src/figures/kit/roomtonal'; export {roomPlan} from './src/figures/kit/roomplan'; export {roomShadows} from './src/figures/kit/roomshadows'; export {PROP_KINDS,prop} from './src/figures/kit/tableprops'; export {tableModel} from './src/figures/kit/tableframes'; export {THEMES,arrange} from './src/figures/kit/tabletop'; export {mulberry32} from './src/figures/kit/rng'; export {roomModels} from './src/figures/kit/tableroom'; export {roomControls} from './src/figures/kit/roomview';",
      resolveDir: process.cwd(),
      loader: 'ts',
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    packages: 'external',
    plugins: [
      {
        name: 'project-three',
        setup(b) {
          b.onResolve({ filter: /^three$/ }, () => ({
            path: pathToFileURL(resolve('node_modules/three/build/three.module.js')).href,
            external: true,
          }));
        },
      },
    ],
    outfile: file,
  });
  // Resolve Three.js through the project without writing generated code into the source tree.
  const result = await import(pathToFileURL(file));
  const {
    roomTones,
    roomPaint,
    MATERIAL_PATTERNS,
    ROOM_STYLES,
    LIGHT_MOODS,
    PROP_KINDS,
    prop,
    THEMES,
    tableModel,
    arrange,
    mulberry32,
    roomModels,
  } = result;
  const css = readFileSync('src/styles/tokens/colors.css', 'utf8'),
    ledger = readFileSync('src/pages/design-system.astro', 'utf8');
  for (const [key, value] of Object.entries(roomTones)) {
    assert(css.includes(`--nt-room-${key}: ${value};`), `Token mirror drift: ${key}`);
    assert(ledger.includes(`--nt-room-${key}`), `Missing token ledger: ${key}`);
  }
  let recipes = 0;
  const before = ShaderChunk.shadowmap_pars_fragment;
  for (const theme of THEMES) {
    assert(ROOM_STYLES[theme.id]);
    assert(LIGHT_MOODS[ROOM_STYLES[theme.id].mood]);
    const p = arrange(mulberry32(7), theme.id);
    const models = [
      ...PROP_KINDS.map((kind) => ({ kind, model: prop(kind) })),
      { kind: 'table', model: tableModel(theme) },
      ...roomModels(p).map((s) => ({ kind: 'room', model: s.model })),
    ];
    for (const { kind, model } of models)
      for (const surface of model.surfaces.filter((s) => s.face)) {
        const paint = roomPaint(kind, theme.id, surface.finish, surface.solid, 7);
        assert(Object.hasOwn(roomTones, paint.tone));
        assert(MATERIAL_PATTERNS.includes(paint.pattern));
        assert(paint.roughness >= 0.08 && paint.roughness <= 1);
        assert(paint.metalness >= 0 && paint.metalness <= 1);
        assert(paint.strength > 0 && paint.strength <= 1);
        if (paint.emission) assert(Object.hasOwn(roomTones, paint.emission));
        recipes++;
      }
    const paint = roomPaint('table', theme.id, 'top', 1),
      mat = new MeshStandardMaterial({ color: 0x555555 });
    const original = mat.color.clone();
    result.attachRoomMaterial(mat, paint, 7, theme.id);
    result.roomTonalDepth(mat, tableModel(theme).bounds, result.roomPlan(p));
    result.roomShadows(mat);
    const colour = result.applyRoomMaterial(mat, true).clone();
    assert(!colour.equals(original));
    assert(
      result.applyRoomMaterial(mat, false).equals(original),
      'Monochrome switch did not restore the original albedo',
    );
    const shader = {
      vertexShader: ShaderLib.standard.vertexShader,
      fragmentShader: ShaderLib.standard.fragmentShader,
      uniforms: {},
    };
    mat.onBeforeCompile(shader, {});
    assert(
      shader.fragmentShader.includes('roomSoftShadow') && shader.fragmentShader.includes('roomSurface'),
      'Material detail replaced the shadow shader',
    );
    assert(
      shader.fragmentShader.includes('roomContact') && shader.fragmentShader.includes('roomRamp'),
      'Missing tonal depth',
    );
    assert.equal(shader.uniforms.uRoomDepth.value, 1, 'Monochrome tonal depth did not restore');
    result.applyRoomMaterial(mat, true);
    assert.equal(shader.uniforms.uRoomDepth.value, 0.45, 'Colour should use restrained tonal gain');
    result.applyRoomMaterial(mat, false);
    assert.equal(shader.uniforms.uRoomDepth.value, 1, 'Monochrome tonal depth did not restore');
    assert(mat.customProgramCacheKey().includes('room-tonal-depth-v1'), 'Missing shader variant cache key');
    assert(shader.vertexShader.includes('modelMatrix*vec4(transformed'), 'Texture space must stay fixed to the room');
    mat.dispose();
  }
  assert.equal(ShaderChunk.shadowmap_pars_fragment, before, 'Room shading modified global Three.js chunks');
  assert.equal(result.roomControls({ appearance: 'colour' }).appearance, 'colour');
  assert.equal(result.roomControls({ appearance: 'invalid' }).appearance, 'monochrome');
  console.log(
    `Room materials passed: ${recipes} face recipes, ${Object.keys(roomTones).length} mirrored tokens, nine themed lighting profiles, mode restoration and isolated shader composition.`,
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
