/** Isolated visual harness: render the actual room kernel, then an unlit entity-ID mask. */
import {
  WebGLRenderer,
  Scene,
  Color,
  OrthographicCamera,
  PerspectiveCamera,
  Mesh,
  Line,
  MeshBasicMaterial,
  NoToneMapping,
} from 'three';
import { arrange } from '../../src/figures/kit/tabletop';
import { mulberry32 } from '../../src/figures/kit/rng';
import { buildRoom, updateRoom, applyRoomView } from '../../src/figures/kit/roomrender';
import { roomLighting } from '../../src/figures/kit/roomlight';
import { roomView } from '../../src/figures/kit/roomview';
import { flatRoom } from '../../src/figures/kit/roomflat';
import { flatRoomSurfaces } from '../../src/figures/kit/roomflatorder';
import { sceneModels } from '../../src/figures/kit/roomscene';
import { hexOf } from '../../src/figures/kit/ink';
let renderer,
  scene,
  state,
  p,
  currentSeed,
  currentFallback,
  cleanups = [];
const canvas = document.querySelector('canvas');
canvas.width = 640;
canvas.height = 356;
const overviewCamera = new OrthographicCamera(),
  eyeCamera = new PerspectiveCamera(),
  pointer = { active: false, x: 0, y: 0 };
function role(s) {
  if (s.kind === 'table') return 'table';
  if (s.kind !== 'room') return 'props';
  if (s.label === 'Floor') return 'floor';
  if (s.support) return 'textiles';
  if (!s.interactive && ['back', 'left', 'right', 'ceiling'].includes(s.side)) return 'wall';
  return 'furniture';
}
function release() {
  if (scene)
    scene.traverse((o) => {
      o.shadow?.dispose();
      o.geometry?.dispose();
      for (const m of Array.isArray(o.material) ? o.material : o.material ? [o.material] : []) m.dispose();
    });
  cleanups.forEach((fn) => fn());
  cleanups = [];
}
export function renderCase(seed, appearance = 'monochrome', fallback = false, view = 'isometric', angle = 135) {
  if (currentFallback !== undefined && currentFallback !== fallback)
    throw Error('Use a fresh browser context for the other renderer');
  currentFallback = fallback;
  if (seed !== currentSeed) {
    release();
    currentSeed = seed;
    p = arrange(mulberry32((seed ^ 0x9e3779b9) >>> 0));
    if (!fallback) {
      renderer ??= new WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
      renderer.setSize(640, 356, false);
      scene = new Scene();
      scene.background = new Color(hexOf('ground'));
      const room = buildRoom(p);
      state = room.state;
      state.lighting = roomLighting(scene, renderer, p, (fn) => cleanups.push(fn));
      state.key = state.lighting.key;
      scene.add(room.group);
      scene.updateMatrixWorld(true);
    }
  }
  const controls = { view, angle, zoom: 1, appearance },
    camera = view === 'eye' ? eyeCamera : overviewCamera,
    v = roomView(p, 640, 356, controls),
    models = sceneModels(p);
  if (models.length > 250) throw Error('Entity mask ID budget exceeded');
  let png, mask;
  if (fallback) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = hexOf('ground');
    ctx.fillRect(0, 0, 640, 356);
    flatRoom(p, ctx, 640, 356, pointer, controls);
    png = canvas.toDataURL();
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 640, 356);
    for (const { surface, index, points } of flatRoomSurfaces(p, models, v)) {
      if (!surface.face) continue;
      ctx.beginPath();
      points.forEach((q, i) => (i ? ctx.lineTo(...q) : ctx.moveTo(...q)));
      ctx.closePath();
      ctx.fillStyle = `rgb(0,${index + 1},0)`;
      ctx.fill();
    }
    mask = canvas.toDataURL();
  } else {
    applyRoomView(camera, v, 640, 356);
    updateRoom(p, state, v, camera, pointer, 640, 356);
    renderer.render(scene, camera);
    png = canvas.toDataURL();
    const saved = [],
      hidden = [],
      fog = scene.fog,
      background = scene.background,
      mapping = renderer.toneMapping;
    state.entities.forEach((entity, i) =>
      entity.group.traverse((o) => {
        if (o instanceof Mesh) {
          const original = o.material;
          const m = new MeshBasicMaterial({
            color: (i + 1) << 8,
            side: original.side,
            fog: false,
            toneMapped: false,
            polygonOffset: original.polygonOffset,
            polygonOffsetUnits: original.polygonOffsetUnits,
          });
          saved.push([o, original, m]);
          o.material = m;
        }
        if (o instanceof Line && o.visible) {
          hidden.push(o);
          o.visible = false;
        }
      }),
    );
    scene.traverse((o) => {
      if (o.isSprite && o.visible) {
        hidden.push(o);
        o.visible = false;
      }
    });
    scene.fog = null;
    scene.background = new Color(0);
    renderer.toneMapping = NoToneMapping;
    renderer.shadowMap.enabled = false;
    renderer.render(scene, camera);
    mask = canvas.toDataURL();
    for (const [o, original, m] of saved) {
      o.material = original;
      m.dispose();
    }
    hidden.forEach((o) => (o.visible = true));
    scene.fog = fog;
    scene.background = background;
    renderer.toneMapping = mapping;
    renderer.shadowMap.enabled = true;
  }
  return {
    png,
    mask,
    theme: p.theme.id,
    seed,
    appearance,
    renderer: fallback ? 'fallback' : 'webgl',
    entities: models.map((s, i) => ({ id: i + 1, label: s.label, role: role(s) })),
  };
}
