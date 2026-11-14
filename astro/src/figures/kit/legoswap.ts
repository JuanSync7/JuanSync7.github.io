import type { NightKey } from '../../styles/tokens/palette.ts';
import type { Kind, Piece } from './legoset.ts';

/** The swap: a model is designed as shapes (the isometric model, drawn with the angles LEGO
 *  pieces have), and each shape turns into the catalogue pieces that make that shape. A block
 *  becomes bricks and plates laid in a bond, a ramp a row of slopes, a wedge a wedge plate, a
 *  round a stack of round parts, a wheel a rim and tyre on its axle. Pure, like the catalogue. */

export type Dir = 'x+' | 'z+' | 'x-' | 'z-';
export const ROT: Record<Dir, Piece['rot']> = { 'x+': 0, 'z+': 1, 'x-': 2, 'z-': 3 };

interface At {
  x: number;
  y: number;
  z: number;
  tone: NightKey;
}
export type Shape =
  | (At & { kind: 'block'; w: number; d: number; h: number; top?: 'studs' | 'tiles' | 'grille'; root?: boolean; lay?: 'x' | 'z' }) // prettier-ignore
  | (At & { kind: 'ramp'; profile: keyof typeof PROFILE; wid: number; dir: Dir })
  | (At & { kind: 'wedge'; len: number; wid: number; dir: Dir; hand: 'L' | 'R' })
  | (At & { kind: 'round'; size: 1 | 2; h: number; cap?: boolean })
  | (At & { kind: 'technic'; len: number; rows: number })
  | (At & { kind: 'halo'; len: number; wid: number; dir: Dir })
  | (At & { kind: 'part'; part: Kind; w: number; d: number; h: number; dir?: Dir; hand?: 'L' | 'R'; root?: boolean }) // prettier-ignore
  | { kind: 'wheel'; x: number; cy: number; z: number; width: number; r: number; tone: NightKey }
  | { kind: 'axle'; x: number; cy: number; z: number; len: number; tone: NightKey };

/** A ramp profile: how far it runs and how many plates it falls. */
export const PROFILE = {
  slope45: { run: 2, h: 3 },
  slope33: { run: 3, h: 3 },
  inv45: { run: 2, h: 3 },
  curve3: { run: 3, h: 2 },
  cheese: { run: 1, h: 2 },
  curve2: { run: 2, h: 2 },
  curve4: { run: 4, h: 3 },
} as const;

/** Rectangles a course is packed with, biggest first. */
const SIZES: [number, number][] = [[8, 2], [6, 2], [4, 2], [3, 2], [2, 2], [8, 1], [6, 1], [4, 1], [3, 1], [2, 1], [1, 1]]; // prettier-ignore

const base = (kind: Kind, a: At, w: number, d: number, h: number, rot: Piece['rot'] = 0): Piece => ({
  kind,
  x: a.x,
  y: a.y,
  z: a.z,
  w,
  d,
  h,
  rot,
  tone: a.tone,
});

/** One course of a block: the cells packed greedily, long along x on even courses and along z
 *  on odd ones; `phase` shortens the first piece of each row so its seams fall elsewhere. */
function course(kind: Kind, s: At & { w: number; d: number }, y: number, odd: boolean, phase = 0): Piece[] {
  const free = new Set<string>();
  for (let i = 0; i < s.w; i++) for (let j = 0; j < s.d; j++) free.add(`${i},${j}`);
  const out: Piece[] = [];
  const h = kind === 'brick' ? 3 : 1;
  for (let i = 0; i < s.w; i++) {
    for (let j = 0; j < s.d; j++) {
      if (!free.has(`${i},${j}`)) continue;
      const first = phase > 0 && (odd ? j === 0 : i === 0);
      for (const [a, b] of SIZES) {
        if (first && a > phase) continue;
        const [w, d] = odd ? [b, a] : [a, b];
        let fits = i + w <= s.w && j + d <= s.d;
        for (let u = 0; fits && u < w; u++) for (let v = 0; fits && v < d; v++) fits = free.has(`${i + u},${j + v}`);
        if (!fits) continue;
        for (let u = 0; u < w; u++) for (let v = 0; v < d; v++) free.delete(`${i + u},${j + v}`);
        out.push(base(kind, { ...s, x: s.x + i, z: s.z + j, y }, w, d, h));
        break;
      }
    }
  }
  return out;
}

const overlaps = (a: Piece, b: Piece): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.z < b.z + b.d && b.z < a.z + a.d;

/** Whether the courses so far hold together as one: pieces join where one sits on the next. */
function holds(courses: Piece[][]): boolean {
  const all = courses.flat();
  const parent = all.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i] ?? i)));
  let k = 0;
  courses.forEach((c, n) => {
    const below = courses[n - 1] ?? [];
    const start = k - below.length;
    c.forEach((p, i) =>
      below.forEach((q, j) => {
        if (overlaps(p, q)) parent[find(k + i)] = find(start + j);
      }),
    );
    k += c.length;
  });
  return all.every((_, i) => find(i) === find(0));
}

/** A block's courses, each re-laid with a shifted first piece until the block holds together:
 *  the bond a builder uses, so no seam runs through the whole block. */
function bond(kinds: Kind[], s: At & { w: number; d: number; lay?: 'x' | 'z' }): Piece[] {
  const courses: Piece[][] = [];
  let y = s.y;
  kinds.forEach((kind, n) => {
    const odd = (n % 2 === 1) !== (s.lay === 'z');
    const tries = [0, 1, 3, 2, 5].map((phase) => course(kind, s, y, odd, phase));
    courses.push(tries.find((c) => holds([...courses, c])) ?? tries[0] ?? []);
    y += kind === 'brick' ? 3 : 1;
  });
  return courses.flat();
}

/** The pieces a shape is made of. */
export function swap(s: Shape): Piece[] {
  switch (s.kind) {
    case 'block': {
      const kinds: Kind[] = [];
      const capped = s.top === 'tiles' || s.top === 'grille';
      for (let left = s.h - (capped ? 1 : 0); left > 0; left -= left >= 3 ? 3 : 1)
        kinds.push(left >= 3 ? 'brick' : 'plate');
      if (capped) kinds.push(s.top === 'grille' ? 'grille' : 'tile');
      const out = bond(kinds, s);
      if (s.root && out[0]) out[0].root = true;
      return out;
    }
    case 'ramp': {
      const { run, h } = PROFILE[s.profile];
      const along = s.dir === 'x+' || s.dir === 'x-';
      return Array.from({ length: s.wid }, (_, k) =>
        base(s.profile, { ...s, x: along ? s.x : s.x + k, z: along ? s.z + k : s.z }, run, 1, h, ROT[s.dir]),
      );
    }
    case 'wedge':
      return [{ ...base('wedge', s, s.len, s.wid, 1, ROT[s.dir]), hand: s.hand }];
    case 'round': {
      const out: Piece[] = [];
      let y = s.y;
      for (let left = s.h; left > 0; ) {
        const h = left >= 3 ? 3 : 1;
        out.push(base('round', { ...s, y }, s.size, s.size, h));
        y += h;
        left -= h;
      }
      if (s.cap) out.push(base('helmet', { ...s, y }, 2, 2, 3));
      return out;
    }
    case 'technic':
      return Array.from({ length: s.rows }, (_, k) => base('technic', { ...s, z: s.z + k }, s.len, 1, 3));
    case 'halo':
      return [base('uplate', s, s.len, s.wid, 1, ROT[s.dir])];
    case 'part':
      return [{ ...base(s.part, s, s.w, s.d, s.h, ROT[s.dir ?? 'x+']), ...(s.hand ? { hand: s.hand } : {}), ...(s.root ? { root: true } : {}) }]; // prettier-ignore
    case 'wheel':
      return [{ kind: 'wheel', x: s.x, y: 0, z: s.z, w: 0, d: s.width, h: 0, rot: 0, tone: s.tone, cy: s.cy, r: s.r }];
    case 'axle':
      return [{ kind: 'axle', x: s.x, y: 0, z: s.z, w: 0, d: s.len, h: 0, rot: 0, tone: s.tone, cy: s.cy, r: 0.12 }];
  }
}

/** A whole model: every shape swapped, the build order set course by course from the bottom
 *  (in shape order within a course), axles and wheels last, as a builder fits them. With `queue`,
 *  pieces go to builders working side by side, each through its own pieces in that order; a piece
 *  whose queue is null is the base, there before anyone starts (order 0). */
export function build(shapes: Shape[], queue?: (p: Piece) => string | null): Piece[] {
  const pieces = shapes.flatMap((s, i) => swap(s).map((p) => ({ p, i })));
  const level = (p: Piece): number => (p.kind === 'axle' ? 1e3 : p.kind === 'wheel' ? 1e3 + 1 : p.y);
  const groups = new Map<string, { p: Piece; i: number }[]>();
  for (const e of pieces) {
    const q = queue ? queue(e.p) : '';
    if (q === null) e.p.order = 0;
    else groups.set(q, [...(groups.get(q) ?? []), e]);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => level(a.p) - level(b.p) || a.i - b.i);
    const [from, span] = queue ? [0.02, 0.96] : [0, 1];
    list.forEach(({ p }, k) => (p.order = from + (span * k) / Math.max(1, list.length - 1)));
  }
  return pieces.map(({ p }) => p);
}

/** The same shape on the other side of a model `width` studs wide (mirrored across z): its z
 *  flipped, its z-direction reversed and a wedge's cut side swapped. */
export function mirror(s: Shape, width: number): Shape {
  const flip = (d: Dir): Dir => (d === 'z+' ? 'z-' : d === 'z-' ? 'z+' : d);
  const hand = (h: 'L' | 'R'): 'L' | 'R' => (h === 'L' ? 'R' : 'L');
  switch (s.kind) {
    case 'block':
      return { ...s, z: width - s.z - s.d, root: false };
    case 'ramp': {
      const across = s.dir === 'x+' || s.dir === 'x-' ? s.wid : PROFILE[s.profile].run;
      return { ...s, z: width - s.z - across, dir: flip(s.dir) };
    }
    case 'wedge': {
      const across = s.dir === 'x+' || s.dir === 'x-' ? s.wid : s.len;
      return { ...s, z: width - s.z - across, dir: flip(s.dir), hand: hand(s.hand) };
    }
    case 'part': {
      const dir = s.dir ?? 'x+';
      const across = dir === 'x+' || dir === 'x-' ? s.d : s.w;
      // A quarter tile's round edge faces (+u, +v): mirroring swaps its turn with the neighbour's.
      const q: Record<Dir, Dir> = { 'x+': 'z-', 'z-': 'x+', 'z+': 'x-', 'x-': 'z+' };
      return {
        ...s,
        z: width - s.z - across,
        dir: s.part === 'quarter' ? q[dir] : flip(dir),
        ...(s.hand ? { hand: hand(s.hand) } : {}),
      };
    }
    case 'round':
      return { ...s, z: width - s.z - s.size };
    case 'technic':
      return { ...s, z: width - s.z - s.rows };
    case 'halo':
      return { ...s, z: width - s.z - s.wid };
    case 'wheel':
      return { ...s, z: width - s.z - s.width };
    case 'axle':
      return { ...s, z: width - s.z - s.len };
  }
}

/** A shape and its mirror. */
export const both = (s: Shape, width: number): Shape[] => [s, mirror(s, width)];
