import { OrthographicCamera, Vector3, type Group, type InstancedMesh } from 'three';
import { defineThreeFigure } from './defineThree';
import { camera } from './kit/camera';
import { clear } from './kit/draw';
import { solid, type Box } from './kit/hairline';
import { COLONIES, grow, logged, plate, RUN } from './kit/labculture';
import { labRoom } from './kit/labroom';
import { ROOM } from './kit/labshell';
import { monodraw, reveal, type Drawing } from './kit/monodraw';
import { Sketch } from './kit/monoline';

/** The lab, as a monoline isometric drawing: a room cut open at the corner, with a bench of
 *  glassware and instruments on the back wall, a glass-door fridge, a sink and drying rack on the
 *  left wall, a mouse enclosure on a trolley, and the periodic table, a painting and an exhaust
 *  fan on the walls. Every line is one pixel; solids hide what stands behind them and glass does
 *  not. The one thing in the signal is the experiment: a culture in the open dish, growing colony
 *  by colony from a seed while the monitor logs its curve, then cleared and seeded again. */

/** The figure's seed (below): run n grows the plate seeded SEED + n. */
const SEED = 2611;
/** Seconds into a run that the page opens on: a grown plate and its finished curve, which clear a
 *  moment later for the next seed. */
const OPEN = 9.6;
// A 2:1 isometric: from the front right, 30° above the floor.
const DIR = new Vector3(
  Math.SQRT1_2 * Math.cos(Math.PI / 6),
  Math.sin(Math.PI / 6),
  Math.SQRT1_2 * Math.cos(Math.PI / 6),
);
const LOOK = DIR.clone().negate();

interface State {
  draw: Drawing;
  rotor: Group | undefined;
  flame: Group | undefined;
  plot: Group | undefined;
  spots: InstancedMesh;
  run: number;
  plate: ReturnType<typeof plate>;
  corners: Vector3[];
  fit: string;
  frame: number;
  dpr: () => number;
}

const corner = new Vector3();

export default defineThreeFigure<State>({
  id: 'lab-room',
  title: 'The lab',
  alt: 'An isometric line drawing of a laboratory cut open at the corner. Along the back wall a bench holds a computer, an open notebook and pen, a microscope, a round flask on a stand over a Bunsen burner, test tubes in a rack, a carousel of pipettes, petri dishes, a conical flask, a beaker, a caliper and a balance; above it are a shelf of bottles, a painting, the periodic table, a clock and an exhaust fan. A glass-door fridge of bottles stands in the corner; on the left wall are a sink with a tap, an eyewash and soap, a rack of drying glassware, a glove dispenser and a lab coat on its hook. A trolley carries an empty mouse enclosure with a running wheel; a chair stands at the bench and a stool by the sink. In one open dish, colonies grow while the monitor plots their curve.',
  idea: 'A lab where an experiment runs from a seed: colonies come up one by one in the open dish while the monitor logs the growth curve, then the plate is cleared and the next seed grows a different one.',
  motion: 'ambient',
  answers: false,
  group: 'hero',
  seed: 2611,
  aspect: 4 / 3,
  build: ({ scene, renderer, onDispose }) => {
    const k = new Sketch();
    labRoom(k);
    const clashes = k.clashes();
    if (clashes.length) throw new Error(`lab-room: parts stand inside each other: ${clashes.join(', ')}`);
    const draw = monodraw(k, LOOK, onDispose);
    scene.add(draw.root);
    const { w, d, h, t } = ROOM;
    const corners: Vector3[] = [];
    for (const x of [-t, w]) for (const y of [-t, h]) for (const z of [-t, d]) corners.push(new Vector3(x, y, z));
    return {
      draw,
      rotor: draw.moving.get('rotor'),
      flame: draw.moving.get('flame'),
      plot: draw.moving.get('plot'),
      spots: draw.spots(COLONIES),
      run: -1,
      plate: [],
      corners,
      fit: '',
      frame: -1,
      dpr: () => renderer.getPixelRatio(),
    };
  },
  update: (f) => {
    const cam = f.selectCamera('orthographic');
    if (!(cam instanceof OrthographicCamera)) return;
    const s = f.state;
    const size = `${f.w}x${f.h}x${s.dpr()}`;
    if (size !== s.fit) {
      s.fit = size;
      const target = new Vector3(ROOM.w / 2, ROOM.h / 2, ROOM.d / 2);
      cam.position.copy(target).addScaledVector(DIR, 30);
      cam.lookAt(target);
      cam.near = 1;
      cam.far = 60;
      cam.updateMatrixWorld();
      let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
      for (const p of s.corners) {
        corner.copy(p).applyMatrix4(cam.matrixWorldInverse);
        [x0, x1, y0, y1] = [
          Math.min(x0, corner.x),
          Math.max(x1, corner.x),
          Math.min(y0, corner.y),
          Math.max(y1, corner.y),
        ];
      }
      const [cx, cy] = [(x0 + x1) / 2, (y0 + y1) / 2];
      const half = Math.max((x1 - x0) / 2, ((y1 - y0) / 2) * (f.w / f.h)) * 1.03;
      Object.assign(cam, {
        left: cx - half,
        right: cx + half,
        top: cy + (half * f.h) / f.w,
        bottom: cy - (half * f.h) / f.w,
      });
      cam.updateProjectionMatrix();
      s.draw.fit(f.w, f.h, s.dpr());
    }
    // The run: which seeded plate, and how far into it.
    const clock = f.t + OPEN;
    const run = Math.floor(clock / RUN);
    const u = clock - run * RUN;
    if (run !== s.run) {
      s.run = run;
      s.plate = plate(SEED, run);
    }
    const up = grow(s.spots, s.plate, u);
    if (s.plot) reveal(s.plot, logged(u));
    if (s.rotor) s.rotor.rotation.z = -f.t * 2.4;
    if (s.flame) {
      const flick = 1 + 0.1 * Math.sin(f.t * 13) + 0.05 * Math.sin(f.t * 31.7);
      s.flame.scale.set(1 - 0.04 * Math.sin(f.t * 17), flick, 1 - 0.04 * Math.sin(f.t * 17));
    }
    // A drawing this size is redrawn at 30 frames a second, which the eye reads as smooth.
    const frame = Math.floor(f.t * 30);
    f.renderWhen(f.still || frame !== s.frame);
    s.frame = frame;
    return up ? `${up} colonies` : 'plate cleared';
  },
  fallback: ({ ctx, w, h }) => {
    // Without WebGL: the room and its big pieces as hairline solids, back to front.
    clear(ctx, w, h);
    const scale = Math.min(w / 8.8, h / 6.9);
    const cam = camera({ cx: w * 0.37, cy: h * 0.38, scale, yaw: Math.PI / 4, pitch: 0.6155, dist: Infinity });
    const pen = { ctx, cam, t: 0 };
    const b = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): Box => ({
      x0,
      x1,
      y0,
      y1,
      z0,
      z1,
    });
    const { w: W, d: D, h: H, t: T } = ROOM;
    [b(-T, -T, -T, W, 0, D), b(-T, 0, -T, W, H, 0), b(-T, 0, 0, 0, H, D)].forEach((q) => solid(pen, q, 'mid'));
    const parts = [
      b(0.1, 0, 0.06, 0.8, 1.88, 0.78),
      b(0, 0, 1.05, 0.66, 0.92, 2.45),
      b(0.95, 0, 0, 5.25, 0.92, 0.76),
      b(1.0, 0.92, 0.1, 1.22, 1.36, 0.58),
      b(1.24, 1.06, 0.16, 1.98, 1.44, 0.19),
      b(5.45, 0, 0.08, 6.25, 0.79, 0.7),
      b(5.5, 0.79, 0.13, 6.2, 1.1, 0.64),
      b(2.78, 0.52, 1.1, 3.22, 0.63, 1.54),
    ];
    // Listed back to front: everything on the bench comes after it.
    parts.forEach((q) => solid(pen, q));
  },
});
