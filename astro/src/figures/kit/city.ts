import type { Vec3 } from './camera';
import type { Rng } from './rng';

/** Cities as parts, for figures that draw districts: what stands where, and the traces
 *  (streets, buses, power straps) painted on the ground under it. Units are world units on a
 *  board centred on the origin, ground at y = 0. A part is drawn by kind (`kit/outlines.ts`)
 *  over the solid its kind stands on (`bodyOf`). `Plot` builds a district a part at a time;
 *  the districts themselves live in `kit/hub.ts`, `kit/islands.ts` and the builders they
 *  call (`kit/civic.ts`, `kit/industry.ts`). */

export const PART_KINDS = [
  ...['cell', 'macro', 'rack', 'wall', 'block', 'shed', 'belt', 'house'],
  ...['tank', 'tower', 'stack', 'silo', 'hex', 'tri', 'heap', 'dome', 'cooler', 'hall', 'rock'],
  ...['apartment', 'tree', 'pine', 'park', 'lake', 'headframe', 'pylon', 'gantry', 'solar', 'turbine'],
  ...['drill', 'excavator', 'kiln', 'column', 'flare', 'hopper', 'crane', 'battery', 'fuelcell', 'transformer'],
  ...['rods', 'warehouse', 'factory', 'mesa', 'birch', 'bush', 'cypress', 'oak'],
  ...['datahall', 'louvred', 'reactor', 'pll', 'crystal'],
  ...['storey', 'portico', 'clocktower', 'bench', 'lamp', 'person', 'flowers', 'fountain'],
  ...['damwall', 'reservoir', 'powerhouse', 'generator', 'runner'],
] as const;
export type PartKind = (typeof PART_KINDS)[number];

export interface Part {
  kind: PartKind;
  x: number;
  z: number;
  /** Footprint (a diameter for round kinds) and height. */
  w: number;
  d: number;
  h: number;
  /** Height the part stands at (a rooftop unit, a raised tank); 0 on the ground. */
  y?: number;
  /** Turn about the vertical, in radians, round the part's centre. */
  rot?: number;
}

export type Trace = [number, number, number, number];
export interface District {
  parts: Part[];
  /** Ground lines as flat segments: x0, z0, x1, z1. */
  traces: Trace[];
  /** Pipelines, power lines and conveyors in teal, each a polyline that flow pulses along. */
  pipes?: Vec3[][];
  /** Closed loops vehicles drive round, at road height. */
  roads?: Vec3[][];
  /** Assembly lines: where the work enters and where it leaves (into a building). */
  lines?: [Vec3, Vec3][];
  /** Where people stand at work (along an assembly line, at a station). */
  workers?: Vec3[];
  /** A runway's two ends, where planes take off and land. */
  runway?: [Vec3, Vec3];
  /** Parked planes: where each stands and which way its nose points (radians, 0 along +x). */
  apron?: [Vec3, number][];
  /** Where goods leave this level for the one above (a gathering point): the via up starts
   *  here. */
  ports?: Vec3[];
  /** The part a drawing marks as the district's landmark, when it is not simply the tallest. */
  landmark?: Part;
}

/** The overcity's street grid: walkers keep to these lines. */
export const STREETS = { x: [-0.95, -0.32, 0.32, 0.95], z: [-0.5, 0, 0.5] } as const;

/** The solid each kind stands on, or none (wireframe only). */
export type Body = 'box' | 'round' | 'hex' | 'tri' | 'cone' | 'dome' | 'cooler' | 'hall' | 'rock' | null;
const BODY: Partial<Record<PartKind, Body>> = {
  ...Object.fromEntries(
    [
      'cell',
      'macro',
      'rack',
      'wall',
      'block',
      'shed',
      'belt',
      'house',
      'battery',
      'fuelcell',
      'transformer',
      'warehouse',
      'factory',
      'datahall',
      'louvred',
      'storey',
      'clocktower',
    ].map((k) => [k, 'box']),
  ),
  ...Object.fromEntries(['tank', 'tower', 'stack', 'silo', 'column', 'pll'].map((k) => [k, 'round'])),
  hex: 'hex',
  mesa: 'hex',
  tri: 'tri',
  heap: 'cone',
  dome: 'dome',
  cooler: 'cooler',
  hall: 'hall',
  rock: 'rock',
};
export const bodyOf = (k: PartKind): Body => BODY[k] ?? null;
export const isBox = (k: PartKind): boolean => bodyOf(k) === 'box';
export const isRound = (k: PartKind): boolean => bodyOf(k) === 'round';

/** A point in a part's own frame (x across its width, z across its depth, y up from its
 *  base) in the district's frame: turned by the part's rot, lifted by its y. */
export function place(p: Part, lx: number, ly: number, lz: number): Vec3 {
  const [c, s] = [Math.cos(p.rot ?? 0), Math.sin(p.rot ?? 0)];
  return [p.x + lx * c - lz * s, (p.y ?? 0) + ly, p.z + lx * s + lz * c];
}

/** A district under construction: parts, ground traces and teal pipes, with the seeded rng
 *  every builder draws from. */
export class Plot {
  parts: Part[] = [];
  traces: Trace[] = [];
  pipes: Vec3[][] = [];
  roads: Vec3[][] = [];
  lines: [Vec3, Vec3][] = [];
  workers: Vec3[] = [];
  runway?: [Vec3, Vec3];
  apron: [Vec3, number][] = [];
  ports: Vec3[] = [];
  landmark?: Part;
  constructor(readonly rng: Rng) {}
  /** A gathering point where goods leave for the level above. */
  port(x: number, z: number): void {
    this.ports.push([x, 0, z]);
  }
  /** A number between a and b. */
  r(a: number, b: number): number {
    return a + this.rng() * (b - a);
  }
  add(kind: PartKind, x: number, z: number, w: number, d: number, h: number, y = 0, rot = 0): Part {
    const p: Part = { kind, x, z, w, d, h, y, rot };
    this.parts.push(p);
    return p;
  }
  line(x0: number, z0: number, x1: number, z1: number): void {
    this.traces.push([x0, z0, x1, z1]);
  }
  ellipse(cx: number, cz: number, rx: number, rz: number, n = 20): void {
    for (let i = 0; i < n; i++) {
      const [a, b] = [(i / n) * Math.PI * 2, ((i + 1) / n) * Math.PI * 2];
      this.line(cx + Math.cos(a) * rx, cz + Math.sin(a) * rz, cx + Math.cos(b) * rx, cz + Math.sin(b) * rz);
    }
  }
  /** A road along pts (closed into a loop unless `open`), w wide: both edges, mitred at the
   *  corners, and a dashed centre line. A closed road also carries traffic. */
  road(pts: Vec3[], w: number, open = false): void {
    const n = pts.length;
    const at = (i: number): Vec3 => pts[open ? Math.max(0, Math.min(n - 1, i)) : ((i % n) + n) % n] ?? [0, 0, 0];
    const normal = (a: Vec3, b: Vec3): [number, number] => {
      const [dx, dz] = [b[0] - a[0], b[2] - a[2]];
      const l = Math.hypot(dx, dz) || 1;
      return [-dz / l, dx / l];
    };
    const edge = (side: number): [number, number][] =>
      pts.map((p, i) => {
        const [n1, n2] = [normal(at(i - 1), p), normal(p, at(i + 1))];
        const first = open && i === 0;
        const last = open && i === n - 1;
        const [mx, mz] = first ? n2 : last ? n1 : [n1[0] + n2[0], n1[1] + n2[1]];
        const ml = Math.hypot(mx, mz) || 1;
        const k = first || last ? 1 : 1 / Math.max(0.3, (mx / ml) * n1[0] + (mz / ml) * n1[1]);
        return [p[0] + (mx / ml) * k * side * (w / 2), p[2] + (mz / ml) * k * side * (w / 2)];
      });
    for (const side of [-1, 1]) {
      const e = edge(side);
      for (let i = 0; i < e.length - (open ? 1 : 0); i++) {
        const [a, b] = [e[i], e[(i + 1) % e.length]];
        if (a && b) this.line(a[0], a[1], b[0], b[1]);
      }
    }
    for (let i = 0; i < n - (open ? 1 : 0); i++) {
      const [a, b] = [at(i), at(i + 1)];
      const len = Math.hypot(b[0] - a[0], b[2] - a[2]);
      for (let u = 0.02; u + 0.025 < len; u += 0.06) {
        const [s0, s1] = [u / len, (u + 0.025) / len];
        this.line(
          a[0] + (b[0] - a[0]) * s0,
          a[2] + (b[2] - a[2]) * s0,
          a[0] + (b[0] - a[0]) * s1,
          a[2] + (b[2] - a[2]) * s1,
        );
      }
    }
    if (!open) this.roads.push(pts);
  }
  pipe(...pts: Vec3[]): void {
    this.pipes.push(pts);
  }
  /** A park of trees scattered over w × d: about 1.6 n of them, of six kinds, with bushes
   *  under them. */
  trees(x: number, z: number, w: number, d: number, n: number, lawn = true): void {
    if (lawn) this.add('park', x, z, w, d, 0);
    const kinds = ['tree', 'pine', 'birch', 'cypress', 'oak', 'oak'] as const;
    for (let i = 0; i < Math.round(n * 1.6); i++) {
      const s = this.r(0.04, 0.09);
      const kind = kinds[Math.floor(this.rng() * kinds.length)] ?? 'tree';
      const tall =
        kind === 'cypress' || kind === 'birch' ? this.r(2.2, 3) : kind === 'oak' ? this.r(1.1, 1.5) : this.r(1.4, 2.4);
      this.add(kind, x + this.r(-0.45, 0.45) * w, z + this.r(-0.45, 0.45) * d, s, s, s * tall);
      if (this.rng() < 0.5)
        this.add('bush', x + this.r(-0.45, 0.45) * w, z + this.r(-0.45, 0.45) * d, s * 0.8, s * 0.7, s * 0.4);
    }
  }
  /** A ridge of mountains along x from x0 to x1 at z: big low-poly peaks with mesas and
   *  scree at their feet, and contour lines round the biggest. */
  mountains(x0: number, x1: number, z: number, depth: number): void {
    for (let x = x0; x < x1; x += this.r(0.12, 0.2)) {
      const s = this.r(0.14, 0.3);
      this.add(
        'rock',
        x,
        z + this.r(-0.3, 0.3) * depth,
        s * this.r(1.1, 1.6),
        s,
        s * this.r(0.9, 1.6),
        0,
        this.r(0, 3),
      );
      if (this.rng() < 0.4)
        this.add('mesa', x + this.r(-0.06, 0.06), z + depth * 0.5, s * 0.5, s * 0.4, s * this.r(0.5, 0.9));
    }
    const mx = (x0 + x1) / 2;
    for (const k of [1, 1.3, 1.6]) this.ellipse(mx, z, ((x1 - x0) / 2) * k * 0.7, depth * k * 0.6, 22);
    this.rocks(mx, z + depth, x1 - x0, depth * 0.6, 8);
  }
  /** A formation of n low-poly rocks over w × d, big ones in the middle. */
  rocks(x: number, z: number, w: number, d: number, n: number): void {
    for (let i = 0; i < n; i++) {
      const [u, v] = [this.r(-0.5, 0.5), this.r(-0.5, 0.5)];
      const s = this.r(0.04, 0.1) * (1.3 - Math.hypot(u, v));
      this.add('rock', x + u * w, z + v * d, s * this.r(1, 1.6), s, s * this.r(0.6, 1.2), 0, this.r(0, 3));
    }
  }
  done(): District {
    const { parts, traces, pipes, roads, lines, workers, runway, apron, ports, landmark } = this;
    const out: District = { parts, traces, pipes, roads, lines, workers, apron, ports };
    if (runway) out.runway = runway;
    if (landmark) out.landmark = landmark;
    return out;
  }
}
