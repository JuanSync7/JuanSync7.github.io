import {
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  Group,
  OrthographicCamera,
  PMREMGenerator,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { hexOf } from './ink';
import { mustHold } from './legocheck';
import { CATALOGUE } from './legocatalogue';
import { partKey, type Piece } from './legoset';
import { smoothModel, wireModel } from './legoplan';
import { legoModel } from './legoscene';
import { LEGO_MODELS } from './legomodels';
import { build } from './legoswap';
import { drawingSheet, partsListSheet } from './drawing/sheet';
import { bomSheet } from './legobom';
import { sketchModel, type SketchPart } from './legosketch';
import { itemsOf, LEGO_SKETCHES, partsOf, type Sketch } from './legosketches';

/** The review bench for LEGO models, used by `npm run lego:sheet` (never by a page): the
 *  wireframe plan in four views, then the smooth isometric model and the LEGO each turned
 *  through 360 degrees, and the catalogue of pieces. Every stage is read before the next. */

export type Mode =
  | 'wire'
  | 'solid'
  | 'lego'
  | 'catalogue'
  | 'sketch'
  | 'sketch3d'
  | 'compare'
  | 'drawing'
  | 'parts'
  | 'bom';
interface View {
  label: string;
  az: number;
  el: number;
}

const PLAN: View[] = [
  { label: 'top', az: 0, el: 89.9 },
  { label: 'side', az: 90, el: 0 },
  { label: 'front', az: 0, el: 0 },
  { label: 'iso', az: 45, el: 30 },
];
const ORBIT: View[] = [
  ...Array.from({ length: 12 }, (_, k): View => ({ label: `${k * 30}°`, az: k * 30, el: 26 })),
  { label: 'top', az: 30, el: 80 },
  { label: 'low', az: 30, el: 4 },
  { label: 'under', az: 210, el: -35 },
];

/** A sketch's own parts with its context, and for a general arrangement every item's parts. */
const everyPart = (s: Sketch): SketchPart[] => [...s.parts, ...itemsOf(s).flatMap((i) => i.parts)];

/** Every catalogue shape, as the catalogue sheet shows them, each named by its part key. */
const SAMPLES: Piece[] = CATALOGUE.map((p) => ({ ...p, tone: p.kind === 'wheel' ? 'line2' : 'inkSoft' }));

/** A camera looking at `box` from azimuth `az` (0 = from the nose, -x) and elevation `el`. */
function aim(box: Box3, v: View, aspect: number): OrthographicCamera {
  const c = box.getCenter(new Vector3());
  const a = (v.az * Math.PI) / 180;
  const e = (v.el * Math.PI) / 180;
  const dir = new Vector3(-Math.cos(a) * Math.cos(e), Math.sin(e), -Math.sin(a) * Math.cos(e));
  const cam = new OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
  cam.position.copy(c).addScaledVector(dir, 120);
  if (v.el > 89) cam.up.set(1, 0, 0);
  cam.lookAt(c);
  cam.updateMatrixWorld();
  let w = 0;
  let h = 0;
  for (let k = 0; k < 8; k++) {
    const p = new Vector3(k & 1 ? box.max.x : box.min.x, k & 2 ? box.max.y : box.min.y, k & 4 ? box.max.z : box.min.z);
    p.applyMatrix4(cam.matrixWorldInverse);
    w = Math.max(w, Math.abs(p.x - 0));
    h = Math.max(h, Math.abs(p.y - 0));
  }
  const half = Math.max(w, h * aspect) * 1.08;
  cam.left = -half;
  cam.right = half;
  cam.top = half / aspect;
  cam.bottom = -half / aspect;
  cam.updateProjectionMatrix();
  return cam;
}

/** Renders one model's stage as a sheet of captioned tiles; returns a PNG data URL. */
export function sheet(id: string, mode: Mode, tile = 360, only = ''): string {
  // A sketch's drawing is a whole A3 sheet, `tile` pixels wide when that is given.
  if (mode === 'drawing') return drawingSheet(id, tile < 1200 ? 2400 : tile);
  if (mode === 'parts') return partsListSheet(id, tile < 1200 ? 2400 : tile);
  if (mode === 'bom') return bomSheet(id, 2400, Number(only) || 1);
  const sketch = LEGO_SKETCHES[id];
  const shapes = LEGO_MODELS[sketch?.model ?? id];
  if (!shapes) throw new Error(`lego: no model ${id}`);
  const disposers: (() => void)[] = [];
  const own = (d: () => void): void => void disposers.push(d);
  const pieces: Piece[] = build(shapes);
  mustHold(pieces, id);
  let models: Group[];
  // A sketch frames its own parts.
  let frame: Group | null = null;
  // In the line modes the sketch is drawn per view (below), with that view's silhouettes.
  const lined = sketch && (mode === 'sketch' || mode === 'compare') ? sketch : null;
  if (sketch && (mode === 'sketch' || mode === 'sketch3d' || mode === 'compare')) {
    // In `compare` the sketch is drawn in the signal colour over the plan's wireframe.
    frame = sketchModel(partsOf(sketch), true, own);
    const m = new Group();
    if (mode === 'sketch3d') m.add(sketchModel(everyPart(sketch), false, own));
    if (mode === 'compare') m.add(wireModel(shapes, 'inkSoft', own));
    models = [m];
  } else if (sketch && (mode === 'solid' || mode === 'lego')) {
    // The plan or the LEGO, framed on the part the sketch draws (not its context).
    frame = sketchModel(partsOf(sketch), true, own);
    models = [mode === 'solid' ? smoothModel(shapes, own) : legoModel(pieces, own, true).group];
  } else if (mode === 'catalogue') {
    models = SAMPLES.map((p) => legoModel([p], own, true).group);
  } else {
    const m = mode === 'wire' ? wireModel(shapes, 'ink2', own) : mode === 'solid' ? smoothModel(shapes, own) : legoModel(pieces, own, true).group; // prettier-ignore
    models = [m];
  }
  const all = mode === 'wire' || mode === 'sketch' || mode === 'compare' ? PLAN : mode === 'catalogue' ? SAMPLES.map((p): View => ({ label: partKey(p), az: 35, el: 30 })) : ORBIT; // prettier-ignore
  const views = only ? all.filter((v) => only.split(',').includes(v.label.replace('°', ''))) : all;
  const cols = Math.min(views.length, mode === 'wire' || mode === 'sketch' || mode === 'compare' ? 2 : 5);
  const rows = Math.ceil(views.length / cols);
  const aspect = 4 / 3;
  const th = Math.round(tile / aspect);
  const r = new WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  r.setSize(tile, th);
  const scene = new Scene();
  scene.background = new Color(hexOf('ground'));
  const pm = new PMREMGenerator(r);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new AmbientLight(new Color(hexOf('inkStrong')), 0.6));
  const sun = new DirectionalLight(new Color(hexOf('inkStrong')), 1.6);
  sun.position.set(-20, 40, -30);
  scene.add(sun);
  const out = document.createElement('canvas');
  out.width = tile * cols;
  out.height = (th + 22) * rows;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('lego: no 2d context');
  ctx.fillStyle = hexOf('ground');
  ctx.fillRect(0, 0, out.width, out.height);
  views.forEach((v, k) => {
    const g = models[mode === 'catalogue' ? SAMPLES.findIndex((p) => partKey(p) === v.label) : 0] ?? new Group();
    scene.add(g);
    const box = new Box3().setFromObject(frame ?? g);
    if (box.isEmpty()) box.set(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
    const cam = aim(box, v, aspect);
    const ref = lined ? sketchModel(everyPart(lined), true, own, mode === 'compare' ? 'signal' : undefined, cam.getWorldDirection(new Vector3())) : null; // prettier-ignore
    if (ref) g.add(ref);
    r.render(scene, cam);
    if (ref) g.remove(ref);
    const x = (k % cols) * tile;
    const y = Math.floor(k / cols) * (th + 22);
    ctx.drawImage(r.domElement, x, y);
    ctx.fillStyle = hexOf('inkSoft');
    ctx.font = '13px monospace';
    ctx.fillText(`${id} · ${mode} · ${v.label}`, x + 8, y + th + 15);
    scene.remove(g);
  });
  const url = out.toDataURL('image/png');
  disposers.forEach((d) => d());
  pm.dispose();
  r.dispose();
  return url;
}
