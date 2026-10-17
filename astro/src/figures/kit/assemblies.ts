import type { Vec3 } from './camera';
import type { Rng } from './rng';
import { box, circle, cylinder, path, place, type Seg } from './shapes';

/** Machines as lists of wire parts, for exploded views. Each part is built in place, where
 *  it sits when the machine is assembled, along the y axis, and carries the direction it
 *  moves out along when the machine is taken apart. */

export interface Part {
  /** What the part is, for the read-out. */
  name: string;
  segs: Seg[];
  /** Unit direction the part leaves in. */
  dir: Vec3;
  /** How far it travels when fully exploded, in world units. */
  gap: number;
}

export type Assembly = (rng: Rng) => Part[];

const UP: Vec3 = [0, 1, 0];
const DOWN: Vec3 = [0, -1, 0];
const vary = (rng: Rng, x: number, by = 0.15): number => x * (1 + (rng() - 0.5) * 2 * by);

/** A launch vehicle, nose at +y: fairing, payload, two tanks with an interstage, an engine
 *  bell, and fins that leave sideways. */
export const rocket: Assembly = (rng) => {
  const r = vary(rng, 0.24);
  const n = 10 + Math.floor(rng() * 6);
  const tank = vary(rng, 0.55);
  const fins = 3 + Math.floor(rng() * 2);
  const parts: Part[] = [
    { name: 'nose cone', segs: cylinder([0, 0.75, 0], r, 0.35, n, 3, 0.005), dir: UP, gap: 0.75 },
    { name: 'payload', segs: [...box(-r * 0.55, 0.5, -r * 0.55, r * 0.55, 0.72, r * 0.55), ...circle([0, 0.61, 0], r * 0.3, 'y', 16)], dir: UP, gap: 0.5 },
    { name: 'upper tank', segs: cylinder([0, 0.5 - tank * 0.6, 0], r, tank * 0.6, n, 4), dir: UP, gap: 0.25 },
    { name: 'interstage', segs: cylinder([0, 0.5 - tank * 0.6 - 0.1, 0], r * 1.04, 0.1, n * 2, 2), dir: UP, gap: 0.05 },
    { name: 'lower tank', segs: cylinder([0, -0.95 + 0.12, 0], r, 0.5 - tank * 0.6 - 0.1 + 0.95 - 0.12, n, 5), dir: DOWN, gap: 0.2 },
    { name: 'engine', segs: [...cylinder([0, -1.1, 0], r * 0.9, 0.27, n, 3, r * 0.35), ...cylinder([0, -0.83, 0], r * 0.35, 0.1, 8, 2)], dir: DOWN, gap: 0.55 },
  ];
  for (let i = 0; i < fins; i++) {
    const a = (i / fins) * Math.PI * 2 + 0.3;
    const fin = path([[r, -0.82, 0], [r + vary(rng, 0.22), -1.05, 0], [r + 0.2, -0.95, 0], [r, -0.55, 0]], true);
    parts.push({ name: 'fin', segs: place(fin, { yaw: a }), dir: [Math.cos(a), -0.3, -Math.sin(a)], gap: 0.4 });
  }
  return parts;
};

/** A mechanical keyboard switch, keycap at +y: cap, stem, spring, upper and lower housing. */
export const keySwitch: Assembly = (rng) => {
  const w = vary(rng, 0.5, 0.1);
  const turns = 5 + Math.floor(rng() * 4);
  const spring: Vec3[] = [];
  for (let i = 0; i <= turns * 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    spring.push([Math.cos(a) * 0.09, -0.2 + (i / (turns * 16)) * 0.32, Math.sin(a) * 0.09]);
  }
  return [
    { name: 'keycap', segs: place(cylinder([0, 0.32, 0], w * 0.75, 0.2, 4, 3, w * 0.55), { yaw: Math.PI / 4 }), dir: UP, gap: 0.9 },
    { name: 'stem', segs: [...box(-0.11, 0.08, -0.03, 0.11, 0.3, 0.03), ...box(-0.03, 0.08, -0.11, 0.03, 0.3, 0.11)], dir: UP, gap: 0.6 },
    { name: 'spring', segs: path(spring), dir: UP, gap: 0.32 },
    { name: 'top housing', segs: [...box(-w / 2, 0, -w / 2, w / 2, 0.14, w / 2), ...box(-0.14, 0.14, -0.14, 0.14, 0.17, 0.14)], dir: UP, gap: 0.12 },
    { name: 'bottom housing', segs: [...box(-w / 2, -0.22, -w / 2, w / 2, 0, w / 2), ...cylinder([0, -0.32, 0], 0.05, 0.1, 8, 2)], dir: DOWN, gap: 0.15 },
    { name: 'pins', segs: [...cylinder([0.15, -0.36, 0.1], 0.015, 0.14, 4, 2), ...cylinder([-0.12, -0.36, 0.15], 0.015, 0.14, 4, 2)], dir: DOWN, gap: 0.35 },
  ];
};

/** A camera lens, front at +y: hood, front element, focus ring, aperture, barrel, mount. */
export const lens: Assembly = (rng) => {
  const r = vary(rng, 0.32);
  const blades = 6 + Math.floor(rng() * 4);
  const iris: Vec3[] = [];
  for (let i = 0; i <= blades; i++) iris.push([Math.cos((i / blades) * Math.PI * 2) * r * 0.45, 0.05, Math.sin((i / blades) * Math.PI * 2) * r * 0.45]);
  const spokes: Seg[] = iris.slice(0, blades).map((q): Seg => [q, [q[0] * 1.9, 0.05, q[2] * 1.9]]);
  return [
    { name: 'hood', segs: cylinder([0, 0.6, 0], r * 1.05, 0.32, 20, 3, r * 1.35), dir: UP, gap: 0.8 },
    { name: 'front element', segs: [...circle([0, 0.55, 0], r * 0.9, 'y', 32), ...circle([0, 0.58, 0], r * 0.6, 'y', 28), ...circle([0, 0.6, 0], r * 0.25, 'y', 20)], dir: UP, gap: 0.55 },
    { name: 'focus ring', segs: cylinder([0, 0.2, 0], r * 1.08, 0.3, 36, 2), dir: UP, gap: 0.3 },
    { name: 'aperture', segs: [...path(iris), ...spokes, ...circle([0, 0.05, 0], r * 0.9, 'y', 32)], dir: UP, gap: 0.08 },
    { name: 'barrel', segs: cylinder([0, -0.45, 0], r, 0.6, 16, 4, r * 0.9), dir: DOWN, gap: 0.2 },
    { name: 'mount', segs: [...cylinder([0, -0.6, 0], r * 0.85, 0.15, 24, 2), ...[0, 1, 2].flatMap((k) => circle([0, -0.6, 0], r * 1.0, 'y', 6, (k * Math.PI * 2) / 3, (k * Math.PI * 2) / 3 + 0.6))], dir: DOWN, gap: 0.5 },
  ];
};

/** A flip-chip package on its board, lid at +y: lid, thermal paste, die, substrate, solder
 *  balls, board. */
export const chip: Assembly = (rng) => {
  const s = vary(rng, 0.55, 0.1);
  const d = s * vary(rng, 0.45, 0.2);
  const balls: Seg[] = [];
  const k = 4 + Math.floor(rng() * 3);
  for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) balls.push(...circle([-s * 0.8 + (i / (k - 1)) * s * 1.6, -0.12, -s * 0.8 + (j / (k - 1)) * s * 1.6], 0.03, 'y', 8));
  return [
    { name: 'lid', segs: [...box(-s * 0.9, 0.12, -s * 0.9, s * 0.9, 0.18, s * 0.9), ...box(-s * 0.8, 0.05, -s * 0.8, s * 0.8, 0.12, s * 0.8)], dir: UP, gap: 0.85 },
    { name: 'thermal paste', segs: box(-d, 0.04, -d, d, 0.05, d), dir: UP, gap: 0.55 },
    { name: 'die', segs: [...box(-d, 0, -d, d, 0.04, d), ...[-1, 0, 1].flatMap((g): Seg[] => [[[-d * 0.8, 0.04, (g * d) / 2], [d * 0.8, 0.04, (g * d) / 2]]])], dir: UP, gap: 0.3 },
    { name: 'substrate', segs: box(-s, -0.1, -s, s, 0, s), dir: UP, gap: 0.08 },
    { name: 'solder balls', segs: balls, dir: DOWN, gap: 0.12 },
    { name: 'board', segs: [...box(-s * 1.5, -0.22, -s * 1.3, s * 1.5, -0.15, s * 1.3)], dir: DOWN, gap: 0.35 },
  ];
};

export const ASSEMBLIES = { rocket, keySwitch, lens, chip } as const;
export type AssemblyKind = keyof typeof ASSEMBLIES;
