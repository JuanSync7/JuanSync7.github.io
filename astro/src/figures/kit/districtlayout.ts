import { Box3, Vector3 } from 'three';
import type { OBB } from 'three/examples/jsm/math/OBB.js';
import type { Vec3 } from './camera';
import { isBox, type Part, type PartKind } from './city';
import { oriented } from './drawing/clash';
import { frameOf, solidOf } from './districtsolids';
import type { Way } from './separate';

/** Lays a district out for a solid drawing (`kit/districtsketch.ts`). `separate` keeps footprints
 *  apart for the wireframe, where a pylon through a roof or a tree sunk in its lawn cannot be
 *  seen; once every part is a solid that hides what is behind it, they can. So each part is
 *  measured as the box the drawing kernel's clash check measures (its solid's own box, turned
 *  with it: `clash.ts`), and the district is settled in four steps:
 *
 *  1. nothing goes through the board: a part that dips under the ground is lifted onto it, unless
 *     it is ground relief (a pit, a lake, a hill), which belongs to the board;
 *  2. a small thing standing in a thin plate (a tree in its lawn) is stood on the plate;
 *  3. parts that are one thing on purpose become one object: the masses of one building, a pile of
 *     rocks, what stands on a roof, a conveyor and its gantry, a part wholly over another's
 *     footprint;
 *  4. any two objects that still stand in each other: the one that matters less is left out
 *     (props before buildings, small before big; never the landmark, never a pylon its line
 *     hangs from).
 *
 *  The result passes the district's clash check (`kit/districtcheck.ts`) by construction, so a
 *  scene can insist on it (R-FIG-31). Rock and hills are not parts here but terrain (`kit/terrain.ts`). */

export const TOL = 0.002;
/** How far a tree's foot is set into a slope, so it grows out of it and never hangs over it. */
export const SINK = 0.004;
/** Kinds that are the ground itself, cut into or raised from the board. */
const RELIEF: readonly PartKind[] = ['pit', 'lake', 'hill', 'reservoir', 'zebra', 'park'];
const PROPS: readonly PartKind[] = [
  ...(['tree', 'pine', 'birch', 'cypress', 'oak', 'bush'] as const),
  ...(['flowers', 'bench', 'lamp', 'person', 'fountain'] as const),
];
const MASSES: readonly PartKind[] = ['storey', 'portico', 'clocktower'];
const STONE: readonly PartKind[] = ['rock', 'mesa'];
/** Ground works other things are built over: a conveyor under its gantry, a wall ring, a die. */
const WORKS: readonly PartKind[] = ['belt', 'wall', 'damwall', 'cell', 'macro'];
/** Machines that move about a site, and loose mineral: a building outranks them, whatever their
 *  reach (a crane's box is mostly its boom). */
export const MOBILE: readonly PartKind[] = ['crane', 'excavator', 'drill', 'crystal'];
/** Kinds a line is strung from: one that stands in a building is left out and its line strung
 *  past it (`unhook`), never the building. */
const ANCHORS: readonly PartKind[] = ['pylon'];

interface Measured {
  p: Part;
  /** Shrunk by TOL / 2 as the clash check does, and its world-aligned box for a quick reject. */
  b: OBB;
  w: Box3;
  local: Box3;
}

function measure(p: Part): Measured {
  const t = solidOf(p);
  const local = new Box3();
  const v = new Vector3();
  for (let i = 0; i < t.length; i += 3) local.expandByPoint(v.set(t[i] ?? 0, t[i + 1] ?? 0, t[i + 2] ?? 0));
  if (local.isEmpty()) local.set(new Vector3(), new Vector3());
  const m = frameOf(p);
  const b = oriented(local, m);
  b.halfSize.subScalar(TOL / 2).max(new Vector3());
  return { p, b, w: local.clone().applyMatrix4(m), local };
}

const hits = (a: Measured, b: Measured): boolean => a.w.intersectsBox(b.w) && a.b.intersectsOBB(b.b);
/** Standing in or on each other: the boxes grown by TOL, so a part resting on a roof counts. */
const touches = (a: Measured, b: Measured): boolean => {
  const [ga, gb] = [a.b.clone(), b.b.clone()];
  ga.halfSize.addScalar(TOL);
  gb.halfSize.addScalar(TOL);
  return (
    a.w
      .clone()
      .expandByScalar(TOL * 2)
      .intersectsBox(b.w) && ga.intersectsOBB(gb)
  );
};
const footprintIn = (outer: Measured, inner: Measured): boolean =>
  inner.w.min.x >= outer.w.min.x - TOL &&
  inner.w.max.x <= outer.w.max.x + TOL &&
  inner.w.min.z >= outer.w.min.z - TOL &&
  inner.w.max.z <= outer.w.max.z + TOL;

/** Why two parts may share space, or null when they may not. */
function together(a: Measured, b: Measured): boolean {
  const [ka, kb] = [a.p.kind, b.p.kind];
  const both = (list: readonly PartKind[]): boolean => list.includes(ka) && list.includes(kb);
  if (both(MASSES) || both(STONE) || both(RELIEF)) return true;
  // Two blocks of one kind and one height that overlap are one building on an L or T plan.
  if (ka === kb && isBox(ka) && Math.abs(a.p.h - b.p.h) < 1e-9 && (a.p.y ?? 0) === (b.p.y ?? 0)) return true;
  if (PROPS.includes(ka) || PROPS.includes(kb)) return false;
  if (ANCHORS.includes(ka) || ANCHORS.includes(kb)) return false;
  // What stands in the ground's relief (rock on a pit's rim, a headframe in the pit) is ground too.
  if (RELIEF.includes(ka) || RELIEF.includes(kb)) return true;
  // On a roof: the higher part's foot is above the lower part's middle.
  const [lo, hi] = a.w.min.y <= b.w.min.y ? [a, b] : [b, a];
  if (hi.w.min.y > (lo.w.min.y + lo.w.max.y) / 2) return true;
  if (WORKS.includes(ka) || WORKS.includes(kb)) return true;
  return footprintIn(a, b) || footprintIn(b, a);
}

/** How much a part matters when two must not share space: the larger is kept. */
const rank = (p: Part, landmark?: Part): number =>
  p === landmark
    ? 1e9
    : RELIEF.includes(p.kind)
      ? 1e8
      : (PROPS.includes(p.kind) || ANCHORS.includes(p.kind) ? 0 : MOBILE.includes(p.kind) ? 500 : 1e3) +
        p.w * p.d * p.h * 1e4;

/** The highest ground under a box's footprint, at nine points over it. */
export function riseUnder(box: Box3, ground: (x: number, z: number) => number): number {
  let top = 0;
  for (const u of [0, 0.5, 1])
    for (const v of [0, 0.5, 1])
      top = Math.max(top, ground(box.min.x + (box.max.x - box.min.x) * u, box.min.z + (box.max.z - box.min.z) * v));
  return top;
}

export interface Settled {
  parts: Part[];
  /** The object each part belongs to, by index: its name in the drawing's clash check. */
  objects: string[];
  /** The input parts left out, as they were given. */
  left: Part[];
  /** Whether a vehicle may start at a point: nothing kept stands in its bay. */
  open: (at: readonly [number, number, number]) => boolean;
}

/** How high a road's clear space reaches: over the tallest vehicle. */
const HEADROOM = 0.04;

/** A road or street (`Way`) as the space kept clear over it. */
function wayOf([x0, z0, x1, z1, half]: Way): Measured {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const p: Part = { kind: 'belt', x: (x0 + x1) / 2, z: (z0 + z1) / 2, w: len, d: half * 2, h: HEADROOM };
  p.rot = Math.atan2(z1 - z0, x1 - x0);
  const local = new Box3(new Vector3(-len / 2, TOL, -half), new Vector3(len / 2, HEADROOM, half));
  const m = frameOf(p);
  const b = oriented(local, m);
  return { p, b, w: local.clone().applyMatrix4(m), local };
}

/** Where a vehicle starts, kept clear this far round (its half-length and a hair). */
const BAY_R = 0.045;
const bayOf = ([x, y, z]: readonly [number, number, number]): Measured => {
  const p: Part = { kind: 'belt', x, z, y, w: BAY_R * 2, d: BAY_R * 2, h: HEADROOM };
  const local = new Box3(new Vector3(-BAY_R, TOL, -BAY_R), new Vector3(BAY_R, HEADROOM, BAY_R));
  const m = frameOf(p);
  return { p, b: oriented(local, m), w: local.clone().applyMatrix4(m), local };
};

/** `ways` are the roads and streets kept clear; `ground` the terrain's height (`kit/terrain.ts`).
 *  Where a vehicle starts is not cleared here: it starts where `open` says the road is clear. */
export function settle(
  input: readonly Part[],
  landmark?: Part,
  ways: readonly Way[] = [],
  ground: (x: number, z: number) => number = () => 0,
): Settled {
  // 1 and 2: lift what dips under the board, stand props on the plates they sink into, and set
  // what stands on the terrain on the ground there (a tree's foot a hair into the slope).
  const parts = input.map((p) => (p === landmark ? p : { ...p }));
  let m = parts.map(measure);
  const plates = m.filter((q) => RELIEF.includes(q.p.kind) && q.w.max.y - q.w.min.y < 0.012);
  const onSlope = new Set<Part>();
  m = m.map((x) => {
    const p = x.p;
    if (RELIEF.includes(p.kind)) return x;
    const rise = riseUnder(x.w, ground);
    if (rise > TOL) onSlope.add(p);
    let lift = Math.max(0, -x.w.min.y);
    if (PROPS.includes(p.kind)) {
      for (const q of plates) if (hits(x, q)) lift = Math.max(lift, q.w.max.y - x.w.min.y);
      lift = Math.max(lift, ground(p.x, p.z) - SINK - (p.y ?? 0));
    }
    if (lift <= 0) return x;
    p.y = (p.y ?? 0) + lift;
    return measure(p);
  });
  // 3: one object for parts that are one thing (union-find over the pairs that may touch).
  const root = m.map((_, i) => i);
  const find = (i: number): number => (root[i] === i ? i : (root[i] = find(root[i] ?? i)));
  for (let i = 0; i < m.length; i++)
    for (let j = i + 1; j < m.length; j++) {
      const [a, b] = [m[i], m[j]];
      if (a && b && touches(a, b) && together(a, b)) root[find(i)] = find(j);
    }
  // Relief belongs to the board, and so does whatever is one object with it.
  const relief = new Set(m.flatMap((x, i) => (RELIEF.includes(x.p.kind) || onSlope.has(x.p) ? [find(i)] : [])));
  const name = (i: number): string => {
    const r = find(i);
    return relief.has(r) ? 'board' : `${m[r]?.p.kind}-${r}`;
  };
  // 4: in order of what matters, keep a part only if it stands in no kept part of another object.
  const worth = m.map((x) => rank(x.p, landmark));
  const order = m.map((_, i) => i).sort((a, b) => (worth[b] ?? 0) - (worth[a] ?? 0));
  const clear = ways.map(wayOf);
  const kept: number[] = [];
  for (const i of order) {
    // Nothing stands on a road but what the road is built through (a conveyor, a pylon, relief).
    const loose = (x: Measured): boolean =>
      x.p !== landmark && !RELIEF.includes(x.p.kind) && !WORKS.includes(x.p.kind) && !ANCHORS.includes(x.p.kind);
    const b = m[i];
    if (b && loose(b) && clear.some((c) => hits(b, c))) continue;
    // Two trees never stand in each other, even on the same slope.
    const clash = (j: number): boolean =>
      !!m[j] &&
      (name(j) !== name(i) || (PROPS.includes(b?.p.kind ?? 'park') && PROPS.includes(m[j]?.p.kind ?? 'park'))) &&
      hits(b as Measured, m[j] as Measured);
    if (b && !kept.some(clash)) kept.push(i);
  }
  kept.sort((a, b) => a - b);
  return {
    parts: kept.flatMap((i) => m[i]?.p ?? []),
    objects: kept.flatMap((i) => (m[i] ? [name(i)] : [])),
    left: input.filter((_, i) => !kept.includes(i)),
    open: (at) => {
      const bay = bayOf(at);
      return !kept.some((i) => m[i] && hits(bay, m[i] as Measured));
    },
  };
}

/** The power lines once the pylons in `gone` are left out: a line is strung straight past a missing
 *  pylon, sagging between its neighbours, and stops at the last pylon left at its end. Each span
 *  is its own pipe from one top to the next (`powerline` in kit/civic.ts). */
export function unhook(pipes: readonly Vec3[][], gone: readonly Part[]): Vec3[][] {
  const at = (v: Vec3 | undefined, p: Part): boolean =>
    !!v && Math.abs(v[0] - p.x) < 1e-6 && Math.abs(v[2] - p.z) < 1e-6 && Math.abs(v[1] - (p.y ?? 0) - p.h) < 1e-6;
  let out = pipes.map((q) => [...q]);
  for (const p of gone.filter((g) => ANCHORS.includes(g.kind))) {
    const into = out.find((q) => at(q[q.length - 1], p));
    const from = out.find((q) => at(q[0], p));
    out = out.filter((q) => q !== into && q !== from);
    const [a, b] = [into?.[0], from?.[from.length - 1]];
    if (a && b) out.push([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 0.03, (a[2] + b[2]) / 2], b]);
  }
  return out;
}
