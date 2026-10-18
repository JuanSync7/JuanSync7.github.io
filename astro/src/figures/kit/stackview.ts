import type { PerspectiveCamera } from 'three';
import { Vector3 } from 'three';
import { box } from './draw';
import { isometric } from './camera';
import { ink, mix } from './ink';

/** Camera work for an archipelago of stacks (System stack): where the camera sits for a
 *  target and distance (lower and closer in, circling slowly when near), which stack the
 *  pointer is over, and the flat drawing used when WebGL is not there. */

export interface Spot {
  x: number;
  z: number;
  base: number;
}

const v3 = new Vector3();

/** Put the camera `dist` from (x, y, z) at heading `yaw`: high over the whole archipelago,
 *  low and close over one stack, so its levels read side on. */
export function aim(cam: PerspectiveCamera, x: number, y: number, z: number, dist: number, yaw: number): void {
  const el = 0.32 + 0.3 * Math.min(1, Math.max(0, (dist - 3) / 11));
  cam.position.set(x + Math.sin(yaw) * dist, y + dist * el, z + Math.cos(yaw) * dist);
  cam.lookAt(x, y - 0.06, z);
}

/** The heading at time t: a slow sway over the overview, and a slow orbit round a stack the
 *  camera has flown in to (`near`, 0 far to 1 close). */
export function heading(t: number, near: number): number {
  return 0.7 + Math.sin(t * 0.12) * 0.25 + near * t * 0.07;
}

/** The stack nearest the pointer as the overview camera sees it, if any is close. */
export function pickAt(over: PerspectiveCamera, spots: readonly Spot[], px: number, py: number): number {
  let [best, pick] = [0.55, -1];
  spots.forEach((c, i) => {
    v3.set(c.x, c.base, c.z).project(over);
    const d = Math.hypot(v3.x - (px * 2 - 1), v3.y - (1 - py * 2));
    if (d < best) [best, pick] = [d, i];
  });
  return pick;
}

/** Every stack as flat isometric plates, the one under the pointer lit; `levels` gives a
 *  stack's plate sizes bottom up and `gap` the spacing. */
export function flatStacks(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  spots: readonly Spot[],
  levels: (i: number) => [number, number][],
  gap: (i: number) => number,
  pick: number,
): void {
  const cam = isometric(w / 2, h * 0.5, Math.min(w, h) * 0.075);
  spots.forEach((c, i) => {
    const dims = levels(i);
    dims.forEach(([pw, pd], k) => {
      const y = c.base + (k - (dims.length - 1) / 2) * gap(i);
      const lit = i === pick;
      box(ctx, cam, c.x - pw / 2, c.z - pd / 2, c.x + pw / 2, c.z + pd / 2, y, y + 0.03, {
        top: lit ? mix('panelSignal', 'signalLine', 0.5) : mix('panel', 'panel2', 0.8),
        left: mix('ground', 'panel', 0.9),
        right: mix('ground', 'panel', 0.5),
        edge: lit ? ink.signal(0.95) : ink.line(0.5),
        crease: lit ? ink.signal(0.35) : ink.line(0.14),
      });
    });
  });
}
