import { defineCanvasFigure } from './define';
import { camera, project, type Camera } from './kit/camera';
import { poly } from './kit/draw';
import { ink, mix } from './kit/ink';
import { follow } from './kit/motion';

/** A low-poly city at night, flat-shaded towers in a slow two-point drift. The windows are
 *  dark except one: the site being built, lit in the signal. The pointer turns the camera. */

interface Tower {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
}

interface State {
  towers: Tower[];
  yaw: number;
}

const LIGHT = [0.55, 0.65, 0.5] as const;

function face(ctx: CanvasRenderingContext2D, cam: Camera, pts: [number, number, number][], shade: number): void {
  poly(ctx, pts.map((p) => project(cam, p[0], p[1], p[2])));
  ctx.fillStyle = mix('ground', 'line4', shade);
  ctx.fill();
  ctx.strokeStyle = ink.line(0.05 + shade * 0.1);
  ctx.stroke();
}

export default defineCanvasFigure<State>({
  id: 'skyline',
  title: 'Skyline',
  alt: 'A low-poly city of flat-shaded grey towers seen at an angle against the dark, with a single lit window in teal.',
  idea: 'A night city in flat facets: towers of terminals and schematics, one window lit where the portfolio is being built, the camera drifting round it.',
  style: 'lowpoly',
  motion: 'ambient',
  answers: true,
  group: 'cover',
  seed: 415,
  aspect: 2,
  setup: ({ rng }) => {
    const towers: Tower[] = [];
    for (let i = -3; i <= 3; i++) {
      for (let j = -2; j <= 1; j++) {
        if (rng() < 0.3) continue;
        const centre = 1 - Math.hypot(i / 3.5, j / 2.5);
        towers.push({ x: i * 0.3 + (rng() - 0.5) * 0.08, z: j * 0.3 + (rng() - 0.5) * 0.08, w: 0.09 + rng() * 0.05, d: 0.09 + rng() * 0.05, h: 0.12 + Math.max(0, centre) * (0.35 + rng() * 0.5) });
      }
    }
    return { towers, yaw: 0.55 };
  },
  draw: ({ ctx, w, h, t, dt, pointer, still, state }) => {
    const target = pointer.active ? 0.2 + pointer.x * 0.9 : 0.55 + Math.sin(t * 0.12) * 0.18;
    state.yaw = still ? target : follow(state.yaw, target, dt, 2.5);
    const cam = camera({ cx: w / 2, cy: h * 0.66, scale: Math.min(w * 0.34, h * 0.68), yaw: state.yaw, pitch: 0.38, dist: 4.5 });
    const cy = Math.cos(cam.yaw);
    const sy = Math.sin(cam.yaw);
    const order = [...state.towers].sort((a, b) => a.x * sy + a.z * cy - (b.x * sy + b.z * cy));
    const lit = state.towers.reduce((best, tw) => (tw.h > best.h ? tw : best), state.towers[0] ?? { x: 0, z: 0, w: 0, d: 0, h: 0 });
    for (const tw of order) {
      const x0 = tw.x - tw.w;
      const x1 = tw.x + tw.w;
      const z0 = tw.z - tw.d;
      const z1 = tw.z + tw.d;
      const nx = cy * LIGHT[0] - sy * LIGHT[2];
      face(ctx, cam, [[x1, 0, z0], [x1, tw.h, z0], [x1, tw.h, z1], [x1, 0, z1]], 0.16 + 0.34 * Math.abs(nx));
      face(ctx, cam, [[x0, 0, z1], [x1, 0, z1], [x1, tw.h, z1], [x0, tw.h, z1]], 0.1 + 0.2 * (1 - Math.abs(nx)));
      face(ctx, cam, [[x0, tw.h, z0], [x1, tw.h, z0], [x1, tw.h, z1], [x0, tw.h, z1]], 0.72);
      if (tw === lit) {
        const yw = tw.h * 0.72;
        poly(ctx, [project(cam, x1, yw, tw.z - tw.d * 0.3), project(cam, x1, yw + 0.04, tw.z - tw.d * 0.3), project(cam, x1, yw + 0.04, tw.z + tw.d * 0.3), project(cam, x1, yw, tw.z + tw.d * 0.3)]);
        ctx.fillStyle = ink.signal(0.95);
        ctx.fill();
      }
    }
    return pointer.active ? 'orbit' : 'rest';
  },
});
