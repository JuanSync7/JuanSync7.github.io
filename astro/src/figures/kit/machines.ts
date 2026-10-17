import type { Vec3 } from './camera';
import { box, circle, cylinder, path, place, type Seg } from './shapes';

/** The three machines among the wire objects (`kit/wireobjects.ts`): a rocket, a turbine and a
 *  satellite. Each returns its body and the one moving part (flame, blade, dish) kept apart. */

export interface Wire {
  body: Seg[];
  hot: Seg[];
}

const TAU = Math.PI * 2;

/** A rocket with 3–4 fins (by `a`) and a flickering flame. */
export function rocket(a: number, t: number): Wire {
  const fins = 3 + Math.round(a);
  const hull = cylinder([0, -0.55, 0], 0.22, 1.05, 10, 4);
  const nose = Array.from({ length: 10 }, (_, i): Seg => {
    const r = (i / 10) * TAU;
    return [
      [Math.cos(r) * 0.22, 0.5, Math.sin(r) * 0.22],
      [0, 0.95, 0],
    ];
  });
  const finSegs = Array.from({ length: fins }, (_, k) => {
    const r = (k / fins) * TAU;
    const o = (d: number, y: number): Vec3 => [Math.cos(r) * d, y, Math.sin(r) * d];
    return path([o(0.22, -0.2), o(0.48, -0.62), o(0.22, -0.55)]);
  }).flat();
  const flame = Array.from({ length: 7 }, (_, i): Seg => {
    const r = (i / 7) * TAU;
    const len = 0.25 + 0.2 * Math.abs(Math.sin(t * 9 + i * 1.7));
    return [
      [Math.cos(r) * 0.12, -0.58, Math.sin(r) * 0.12],
      [Math.cos(r) * 0.04, -0.58 - len, Math.sin(r) * 0.04],
    ];
  });
  return { body: [...hull, ...nose, ...finSegs], hot: flame };
}

/** A wind turbine with 3–4 blades (by `a`) turning at a speed set by `b`; one blade is hot. */
export function turbine(a: number, b: number, t: number): Wire {
  const blades = 3 + Math.round(a);
  const hub: Vec3 = [0, 0.62, 0.12];
  const spin = t * (1.2 + b);
  const blade = (k: number): Seg[] => {
    const r = spin + (k * TAU) / blades;
    const q = (d: number, w: number): Vec3 => [
      hub[0] + Math.cos(r) * d - Math.sin(r) * w,
      hub[1] + Math.sin(r) * d + Math.cos(r) * w,
      hub[2],
    ];
    return path([q(0.05, 0), q(0.3, 0.06), q(0.85, 0.01), q(0.85, -0.01), q(0.3, -0.03)], true);
  };
  const body = [
    ...cylinder([0, -0.95, 0], 0.07, 1.55, 8, 3, 0.035),
    ...box(-0.08, 0.56, -0.22, 0.08, 0.68, 0.1),
    ...circle(hub, 0.05, 'z', 10),
  ];
  return { body: [...body, ...Array.from({ length: blades - 1 }, (_, k) => blade(k + 1)).flat()], hot: blade(0) };
}

/** A satellite with solar wings of a span set by `a`, and a dish that sweeps slowly. */
export function satellite(a: number, t: number): Wire {
  const span = 0.9 + a * 0.4;
  const panel = (s: number): Seg[] => {
    const x0 = s * 0.3;
    const x1 = s * span;
    const lines = path(
      [
        [x0, -0.18, 0],
        [x1, -0.18, 0],
        [x1, 0.18, 0],
        [x0, 0.18, 0],
      ],
      true,
    );
    for (let i = 1; i < 4; i++)
      lines.push([
        [x0 + ((x1 - x0) * i) / 4, -0.18, 0],
        [x0 + ((x1 - x0) * i) / 4, 0.18, 0],
      ]);
    lines.push([
      [s * 0.22, 0, 0],
      [x0, 0, 0],
    ]);
    return lines;
  };
  const dish: Seg[] = [
    ...circle([0, 0.55, 0], 0.26, 'y', 16),
    ...Array.from(
      { length: 8 },
      (_, i): Seg => [
        [Math.cos((i / 8) * TAU) * 0.26, 0.55, Math.sin((i / 8) * TAU) * 0.26],
        [0, 0.32, 0],
      ],
    ),
    [
      [0, 0.32, 0],
      [0, 0.75, 0],
    ],
  ];
  return {
    body: [...box(-0.22, -0.3, -0.22, 0.22, 0.3, 0.22), ...panel(1), ...panel(-1)],
    hot: place(dish, { yaw: Math.sin(t * 0.7) * 0.6 }),
  };
}
