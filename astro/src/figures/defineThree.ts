import {
  Color,
  Line,
  Light,
  Mesh,
  OrthographicCamera,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  type Material,
  type Object3D,
} from 'three';
import { defineCanvasFigure } from './define';
import { mulberry32, type Rng } from './kit/rng';
import type { CanvasFrame, Figure, FigureInstance, FigureMeta, FrameInput } from './types';

/** three.js figures. The scene is built once; `update` moves it each frame. Every three
 *  figure brings a 2D fallback that reads as the same picture, drawn when WebGL is missing. */

export interface ThreeEnv {
  scene: Scene;
  camera: PerspectiveCamera;
  rng: Rng;
  renderer: WebGLRenderer;
}

export interface ThreeFrame<S> extends FrameInput {
  scene: Scene;
  camera: PerspectiveCamera;
  selectCamera(projection: 'perspective' | 'orthographic'): PerspectiveCamera | OrthographicCamera;
  state: S;
  w: number;
  h: number;
}

export interface ThreeFigureSpec<S> extends Omit<FigureMeta, 'style'> {
  build(env: ThreeEnv): S;
  update(frame: ThreeFrame<S>): string | void;
  fallback(frame: CanvasFrame<null>): string | void;
}

export function webglAvailable(): boolean {
  try {
    const probe = document.createElement('canvas');
    const context = probe.getContext('webgl2') ?? probe.getContext('webgl');
    // A seed gallery mounts several renderers: probes must not consume their context slots.
    context?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(context);
  } catch {
    return false;
  }
}

function disposeTree(root: Object3D): void {
  root.traverse((o) => {
    // Lines hold GPU buffers too: edge outlines are LineSegments, which extend Line.
    if (
      o instanceof Light &&
      'shadow' in o &&
      o.shadow &&
      typeof o.shadow === 'object' &&
      'dispose' in o.shadow &&
      typeof o.shadow.dispose === 'function'
    )
      o.shadow.dispose();
    if (o instanceof Mesh || o instanceof Line) {
      o.geometry.dispose();
      const mats: Material[] = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => m.dispose());
    }
  });
}

export function defineThreeFigure<S>(spec: ThreeFigureSpec<S>): Figure {
  const { build, update, fallback, ...rest } = spec;
  const meta: FigureMeta = { ...rest, style: 'three' };
  const flat = defineCanvasFigure<null>({ ...meta, setup: () => null, draw: fallback });
  return {
    ...meta,
    kind: 'three',
    mount(canvas: HTMLCanvasElement): FigureInstance {
      // Say which renderer ran, so the audit can tell a WebGL capture from the fallback.
      if (!webglAvailable()) {
        canvas.dataset.renderer = '2d-fallback';
        return flat.mount(canvas);
      }
      canvas.dataset.renderer = 'webgl';
      const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setClearColor(new Color(0x000000), 0);
      const scene = new Scene();
      const camera = new PerspectiveCamera(30, 1, 0.1, 60);
      const parallel = new OrthographicCamera(-1, 1, 1, -1, 0.1, 120);
      let active: PerspectiveCamera | OrthographicCamera = camera;
      const state = build({ scene, camera, renderer, rng: mulberry32(spec.seed) });
      let w = 1;
      let h = 1;
      return {
        resize(nw: number, nh: number, dpr: number): void {
          w = Math.max(1, nw);
          h = Math.max(1, nh);
          renderer.setPixelRatio(dpr);
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        },
        frame(input: FrameInput): string | void {
          const selectCamera = (projection: 'perspective' | 'orthographic'): PerspectiveCamera | OrthographicCamera => {
            active = projection === 'orthographic' ? parallel : camera;
            return active;
          };
          const read = update({ ...input, scene, camera, selectCamera, state, w, h });
          if (!input.unseen) renderer.render(scene, active);
          return read;
        },
        dispose(): void {
          disposeTree(scene);
          renderer.dispose();
          renderer.forceContextLoss();
        },
      };
    },
  };
}
