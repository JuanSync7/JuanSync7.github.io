import { defineTemplate } from '../defineTemplate';
import { camera, project, type Camera } from '../kit/camera';
import { poly } from '../kit/draw';
import { ink, mix } from '../kit/ink';
import { follow } from '../kit/motion';
import { between, pick } from '../kit/rng';
import { FORMS, layout, type Form, type Tower } from '../kit/plans';

/** Cities as formations of flat-shaded towers, each laid out by a different rule: a street
 *  grid, a ring round a plaza, two banks of a river, terraces up a hill, a spiral, a strip
 *  along a coast. One window is lit. The camera drifts round it; the pointer turns it. */

interface P {
  form: Form;
  density: number;
  pitch: number;
  yaw0: number;
}

interface S {
  towers: Tower[];
  yaw: number;
  lit: number;
}

const LIGHT = [0.5, 0.7, 0.45] as const;

function face(ctx: CanvasRenderingContext2D, cam: Camera, pts: [number, number, number][], shade: number): void {
  poly(
    ctx,
    pts.map((p) => project(cam, p[0], p[1], p[2])),
  );
  ctx.fillStyle = mix('ground', 'line4', shade);
  ctx.fill();
  ctx.strokeStyle = ink.line(0.04 + shade * 0.08);
  ctx.stroke();
}

export default defineTemplate<P, S>({
  id: 'city-form',
  title: 'City form',
  idea: 'A night city laid out by one rule (a grid, a ring, a river, a hill, a spiral, a coast), its towers flat-shaded, one window lit, the camera drifting round it.',
  style: 'lowpoly',
  motion: 'ambient',
  answers: true,
  aspect: 2,
  grammar: (rng) => ({
    form: pick(rng, FORMS),
    density: rng(),
    pitch: between(rng, 0.38, 0.75),
    yaw0: between(rng, 0, Math.PI * 2),
  }),
  name: (p) => `${p.form} city`,
  alt: (p) =>
    `A low-poly city of flat-shaded grey towers arranged as a ${p.form}, seen from above at an angle, with one teal window.`,
  setup: ({ rng, params }) => {
    const towers = layout(params, rng);
    const lit = towers.reduce((best, tw, i) => (tw.h > (towers[best]?.h ?? 0) ? i : best), 0);
    return { towers, yaw: params.yaw0, lit };
  },
  draw: ({ ctx, w, h, t, dt, pointer, hover, still, params, state }) => {
    const target = params.yaw0 + t * 0.08 + (pointer.active ? (pointer.x - 0.5) * 2 * hover : 0);
    state.yaw = still ? target : follow(state.yaw, target, dt, 3);
    const cam = camera({
      cx: w / 2,
      cy: h * 0.58,
      scale: Math.min(w * 0.3, h * 0.64),
      yaw: state.yaw,
      pitch: params.pitch,
      dist: 4.5,
    });
    const cy = Math.cos(state.yaw);
    const sy = Math.sin(state.yaw);
    const order = state.towers
      .map((tw, i) => ({ tw, i }))
      .sort((a, b) => a.tw.x * sy + a.tw.z * cy - (b.tw.x * sy + b.tw.z * cy));
    const nx = cy * LIGHT[0] - sy * LIGHT[2];
    for (const { tw, i } of order) {
      const x0 = tw.x - tw.w;
      const x1 = tw.x + tw.w;
      const z0 = tw.z - tw.d;
      const z1 = tw.z + tw.d;
      const sides: [[number, number, number][], number][] = [
        [
          [
            [x1, 0, z0],
            [x1, tw.h, z0],
            [x1, tw.h, z1],
            [x1, 0, z1],
          ],
          0.16 + 0.34 * Math.abs(nx),
        ],
        [
          [
            [x0, 0, z0],
            [x0, tw.h, z0],
            [x0, tw.h, z1],
            [x0, 0, z1],
          ],
          0.16 + 0.34 * Math.abs(nx),
        ],
        [
          [
            [x0, 0, z1],
            [x1, 0, z1],
            [x1, tw.h, z1],
            [x0, tw.h, z1],
          ],
          0.1 + 0.2 * (1 - Math.abs(nx)),
        ],
        [
          [
            [x0, 0, z0],
            [x1, 0, z0],
            [x1, tw.h, z0],
            [x0, tw.h, z0],
          ],
          0.1 + 0.2 * (1 - Math.abs(nx)),
        ],
      ];
      // Only the two sides that face the camera are drawn; the far two are hidden anyway.
      const facing = sides.filter(([pts]) => {
        const c = pts[0] ?? [0, 0, 0];
        const o = pts[2] ?? [0, 0, 0];
        const mx = (c[0] + o[0]) / 2 - tw.x;
        const mz = (c[2] + o[2]) / 2 - tw.z;
        return mx * sy + mz * cy > 0;
      });
      for (const [pts, shade] of facing) face(ctx, cam, pts, shade);
      face(
        ctx,
        cam,
        [
          [x0, tw.h, z0],
          [x1, tw.h, z0],
          [x1, tw.h, z1],
          [x0, tw.h, z1],
        ],
        0.7,
      );
      if (i === state.lit) {
        const y = tw.h * 0.7;
        const f = facing[0]?.[0];
        if (f) {
          const lerp = (
            a: [number, number, number],
            b: [number, number, number],
            k: number,
          ): [number, number, number] => [a[0] + (b[0] - a[0]) * k, y, a[2] + (b[2] - a[2]) * k];
          const a = f[0] as [number, number, number];
          const b = f[3] as [number, number, number];
          const p0 = lerp(a, b, 0.3);
          const p1 = lerp(a, b, 0.7);
          poly(ctx, [
            project(cam, p0[0], y, p0[2]),
            project(cam, p1[0], y, p1[2]),
            project(cam, p1[0], y + 0.04, p1[2]),
            project(cam, p0[0], y + 0.04, p0[2]),
          ]);
          ctx.fillStyle = ink.signal(0.95);
          ctx.fill();
        }
      }
    }
    return pointer.active ? `${params.form} · orbit` : 'rest';
  },
});
