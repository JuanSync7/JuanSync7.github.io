import { InstancedMesh, Mesh, MeshBasicMaterial, type Object3D } from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { hexOf } from './ink';

/** A heavy figure draws itself in, the way a pen plotter would, when the reader reaches it: the
 *  appearance is part of its look instead of a pop or a blank frame, and the work of building it
 *  happens before the pen moves. Times in seconds (WEB-PERF-6 in the experience vault):
 *  - a hero, the one large figure at the top of a page: 1.0 s, Material's longest step;
 *  - a card, one of a set of small figures: 0.6 s, each card `stagger` after the one before it.
 *  Both ease out, so the pen starts fast and settles. Under 0.4 s reads as a flicker, much over a
 *  second makes the reader wait. Every draw-in ends inside the figure loop's REST_T (1.2 s), so a
 *  still (reduced motion, the audit) is always the whole picture. */
export const DRAW_IN = { hero: 1.0, card: 0.6, stagger: 0.08 } as const;

/** How much is drawn at time `t` (0 to 1), for a draw-in of `dur` seconds that starts at `delay`. */
export function drawnAt(t: number, dur: number, delay = 0): number {
  const x = Math.min(1, Math.max(0, (t - delay) / dur));
  return 1 - (1 - x) ** 3;
}

const asNumber = (v: string | number): number => (typeof v === 'number' ? v : Number.parseInt(v.replace('#', ''), 16));

/** Shows the first `u` (0 to 1) of every line under `root`, in the order the drawing was made (part
 *  by part), and its signal-coloured plates only once it is whole. Groups in `skip` are left to the
 *  figure (a plot that traces itself, say). */
export function drawIn(root: Object3D, u: number, skip: readonly (Object3D | undefined)[] = []): void {
  const signal = asNumber(hexOf('signal'));
  const visit = (o: Object3D): void => {
    if (skip.includes(o)) return;
    if (o instanceof LineSegments2) {
      const n = o.geometry.getAttribute('instanceStart')?.count ?? 0;
      o.geometry.instanceCount = u >= 1 ? n : Math.round(u * n);
    } else if (o instanceof Mesh && !(o instanceof InstancedMesh)) {
      const m = o.material;
      if (m instanceof MeshBasicMaterial && m.color.getHex() === signal) o.visible = u >= 1;
    }
    o.children.forEach(visit);
  };
  visit(root);
}
