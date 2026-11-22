import { Color, OrthographicCamera, Scene, Vector2, Vector3, WebGLRenderer } from 'three';
import { cableIssues } from './drawing/cable';
import type { Drawing } from './drawing/monodraw';
import { softwareGL } from './gpu';
import { monodraw } from './drawing/monodraw';
import { Sketch } from './drawing/monoline';

/** Small hidden-line scenes (R-FIG-28) for figures that appear several times on one page, such as
 *  the home page's six experience cards. A page may hold one WebGL scene; six cards each with
 *  their own context would hold six more. So every small scene here is drawn by one shared,
 *  hidden renderer with the drawing kernel's pen (`monodraw`), and the picture is copied onto the
 *  figure's own 2D canvas. Scenes are built once per page and kept: each card shows its own. */

/** A 2:1 isometric: from the front right, 30° above the floor (as the lab room). */
export const DIR = new Vector3(
  Math.SQRT1_2 * Math.cos(Math.PI / 6),
  Math.sin(Math.PI / 6),
  Math.SQRT1_2 * Math.cos(Math.PI / 6),
);

/** One small scene: what it builds and how it moves at time `t` (seconds). */
export interface Small {
  build(k: Sketch): void;
  move(d: Drawing, t: number): void;
  /** The box the camera frames: [x0, y0, z0, x1, y1, z1]. */
  frame: readonly [number, number, number, number, number, number];
}

interface Built {
  scene: Scene;
  draw: Drawing;
  corners: Vector3[];
}

let gl: WebGLRenderer | null | undefined;
/** WebGL without a GPU: each picture costs about 100 ms, so it is redrawn a few times a second. */
let slow = false;
const cam = new OrthographicCamera(-1, 1, 1, -1, 0.1, 80);
const built = new Map<Small, Built>();
const corner = new Vector3();

function renderer(): WebGLRenderer | null {
  if (gl !== undefined) return gl;
  try {
    const canvas = document.createElement('canvas');
    slow = softwareGL();
    gl = new WebGLRenderer({ canvas, antialias: !slow, alpha: true, preserveDrawingBuffer: true });
    gl.setClearColor(new Color(0x000000), 0);
    gl.setPixelRatio(1);
  } catch {
    gl = null;
  }
  return gl;
}

function build(s: Small): Built {
  const hit = built.get(s);
  if (hit) return hit;
  const k = new Sketch();
  s.build(k);
  const clashes = k.clashes();
  if (clashes.length) throw new Error(`hidden-line scene: parts stand inside each other: ${clashes.join(', ')}`);
  const loose = cableIssues(k);
  if (loose.length) throw new Error(`hidden-line scene: cables break the cabling rule: ${loose.join('; ')}`);
  const scene = new Scene();
  // Kept for the page's life: the scenes are small and each is shown on every visit.
  const draw = monodraw(k, DIR.clone().negate(), () => undefined);
  scene.add(draw.root);
  const [x0, y0, z0, x1, y1, z1] = s.frame;
  const corners: Vector3[] = [];
  for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) corners.push(new Vector3(x, y, z));
  const out = { scene, draw, corners };
  built.set(s, out);
  return out;
}

function aim(b: Built, s: Small, w: number, h: number): void {
  const [x0, y0, z0, x1, y1, z1] = s.frame;
  const target = new Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  cam.position.copy(target).addScaledVector(DIR, 30);
  cam.lookAt(target);
  cam.updateMatrixWorld();
  let [l, r, d, u] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const p of b.corners) {
    corner.copy(p).applyMatrix4(cam.matrixWorldInverse);
    [l, r, d, u] = [Math.min(l, corner.x), Math.max(r, corner.x), Math.min(d, corner.y), Math.max(u, corner.y)];
  }
  const [cx, cy] = [(l + r) / 2, (d + u) / 2];
  const half = Math.max((r - l) / 2, ((u - d) / 2) * (w / h)) * 1.02;
  Object.assign(cam, { left: cx - half, right: cx + half, top: cy + (half * h) / w, bottom: cy - (half * h) / w });
  cam.near = 1;
  cam.far = 60;
  cam.updateProjectionMatrix();
}

/** A figure's copy of its scene: redrawn only when the frame changes, pasted every frame. */
export interface Paper {
  key: string;
  copy: HTMLCanvasElement | null;
}
export const paper = (): Paper => ({ key: '', copy: null });

/** Draws scene `s` at time `t` into `ctx` (w × h CSS pixels, its transform already scaled by the
 *  pixel ratio). Returns false when there is no WebGL, so the figure draws its fallback. */
export function paintSmall(
  ctx: CanvasRenderingContext2D,
  p: Paper,
  s: Small,
  w: number,
  h: number,
  t: number,
): boolean {
  const r = renderer();
  // Say which renderer ran, as a three.js figure does, so the audit can tell a scene from its fallback.
  ctx.canvas.dataset.renderer = r ? 'webgl' : '2d-fallback';
  if (!r) return false;
  const dpr = ctx.canvas.width / w;
  const [W, H] = [Math.round(w * dpr), Math.round(h * dpr)];
  // 24 frames a second reads as smooth at this size; without a GPU, 4.
  const key = `${W}x${H}:${Math.floor(t * (slow ? 4 : 24))}`;
  if (key !== p.key || !p.copy) {
    p.key = key;
    const b = build(s);
    s.move(b.draw, t);
    const size = r.getSize(new Vector2());
    if (size.x !== W || size.y !== H) r.setSize(W, H, false);
    aim(b, s, w, h);
    b.draw.fit(w, h, dpr);
    r.render(b.scene, cam);
    p.copy ??= document.createElement('canvas');
    if (p.copy.width !== W || p.copy.height !== H) [p.copy.width, p.copy.height] = [W, H];
    const c = p.copy.getContext('2d');
    c?.clearRect(0, 0, W, H);
    c?.drawImage(r.domElement, 0, 0);
  }
  ctx.drawImage(p.copy, 0, 0, W, H, 0, 0, w, h);
  return true;
}
