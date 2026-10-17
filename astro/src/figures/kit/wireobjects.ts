import { box, circle, extrude, globe, path, place, type Seg } from './shapes';
import type { Vec3 } from './camera';
import { rocket, satellite, turbine, type Wire } from './machines';
/** Everyday objects as wire segments (the machines among them are in `kit/machines.ts`): a car, a planet, a house, a rocket, a turbine, a
 *  satellite, each with the one part that moves (a wheel, a moon, a blade, a flame) kept apart
 *  so a figure can draw it in the signal. FRAME says how big each is and where its ground is. */

export const KINDS = ['car', 'planet', 'house', 'rocket', 'turbine', 'satellite'] as const;
export type Kind = (typeof KINDS)[number];

/** What an object's shape depends on: its kind and two proportions (read per kind). */
export interface WireSpec {
  kind: Kind;
  a: number;
  b: number;
}

const TAU = Math.PI * 2;

/** Per kind: scale to fit the frame, the lift that centres it, and the height of its ground
 *  ring (null for things that float). Tall objects shrink so nothing leaves the frame. */
export const FRAME: Record<Kind, readonly [number, number, number | null]> = {
  car: [1.05, -0.45, -0.04],
  planet: [0.78, 0, null],
  house: [0.95, -0.1, -0.5],
  rocket: [0.58, 0.05, null],
  turbine: [0.52, -0.27, -0.95],
  satellite: [0.92, -0.2, null],
};

/** The object at time t: its body, and the one part that carries the signal. */
export function build(p: WireSpec, t: number): Wire {
  switch (p.kind) {
    case 'car': {
      const L = 0.85 + p.a * 0.25;
      const body = extrude(
        [
          [-L, 0.15],
          [L, 0.15],
          [L, 0.45],
          [L * 0.6, 0.5],
          [L * 0.32, 0.82],
          [-L * 0.4, 0.82],
          [-L * 0.68, 0.5],
          [-L, 0.45],
        ],
        -0.42,
        0.42,
      );
      const wheel = (x: number, z: number): Seg[] => {
        const c: Vec3 = [x, 0.15, z];
        const spin = -t * 4;
        return [
          ...circle(c, 0.19, 'z', 16),
          ...[0, 1, 2].map((k): Seg => {
            const a = spin + (k * TAU) / 3;
            return [c, [x + Math.cos(a) * 0.19, 0.15 + Math.sin(a) * 0.19, z]];
          }),
        ];
      };
      return {
        body: [...body, ...wheel(-L * 0.6, 0.44), ...wheel(L * 0.6, -0.44), ...wheel(-L * 0.6, -0.44)],
        hot: wheel(L * 0.6, 0.44),
      };
    }
    case 'planet': {
      const r = 0.62;
      const ring = place([...circle([0, 0, 0], 0.9, 'y', 48), ...circle([0, 0, 0], 1.08, 'y', 48)], {
        roll: 0.25 + p.a * 0.35,
      });
      const m = t * 0.6;
      const moon = place(globe([Math.cos(m) * 1.35, 0, Math.sin(m) * 1.35], 0.1, 3, 4), { roll: 0.25 + p.a * 0.35 });
      return { body: [...globe([0, 0, 0], r, 7, 12), ...ring], hot: moon };
    }
    case 'house': {
      const H = 0.55 + Math.round(p.b * 2) * 0.32;
      const walls = box(-0.7, -0.5, -0.5, 0.7, H - 0.5, 0.5);
      const top = H - 0.5;
      const roof = [
        ...path([
          [-0.78, top, -0.56],
          [0, top + 0.45, -0.56],
          [0.78, top, -0.56],
        ]),
        ...path([
          [-0.78, top, 0.56],
          [0, top + 0.45, 0.56],
          [0.78, top, 0.56],
        ]),
        ...path([
          [0, top + 0.45, -0.56],
          [0, top + 0.45, 0.56],
        ]),
      ];
      const win = (x: number, y: number): Seg[] => [
        ...path(
          [
            [x - 0.1, y - 0.1, 0.5],
            [x + 0.1, y - 0.1, 0.5],
            [x + 0.1, y + 0.1, 0.5],
            [x - 0.1, y + 0.1, 0.5],
          ],
          true,
        ),
        ...path([
          [x, y - 0.1, 0.5],
          [x, y + 0.1, 0.5],
        ]),
      ];
      const door = path([
        [-0.12, -0.5, 0.5],
        [-0.12, -0.12, 0.5],
        [0.12, -0.12, 0.5],
        [0.12, -0.5, 0.5],
      ]);
      const windows = [win(-0.42, -0.2), win(0.42, -0.2), ...(H > 0.9 ? [win(-0.42, 0.2), win(0.42, 0.2)] : [])];
      const lit = windows.splice(Math.floor(t / 2.5) % windows.length, 1)[0] ?? [];
      return {
        body: [...walls, ...roof, ...door, ...box(0.32, top + 0.1, -0.2, 0.46, top + 0.42, -0.06), ...windows.flat()],
        hot: lit,
      };
    }
    case 'rocket':
      return rocket(p.a, t);
    case 'turbine':
      return turbine(p.a, p.b, t);
    case 'satellite':
      return satellite(p.a, t);
  }
}
