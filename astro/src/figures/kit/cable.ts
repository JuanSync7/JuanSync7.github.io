import { Matrix4, Vector3 } from 'three';
import type { Part, Sketch, Tier, V3 } from './drawing/monoline';

/** Wires and cables in a hidden-line scene, drawn as a draftsman would (SITE.md, "Wires and
 *  cables"). A cable is a real run: from a plug to a plug (or a tie), lying on the surfaces it
 *  rests on or hanging straight down from one, bending with a radius, never through a solid. It is
 *  one line while it is thinner than `THICK_PX` at the smallest size the scene is shown, and a
 *  tube with its own silhouette from there up. `cableIssues` is the check the build runs.
 *
 *  Points are the cable's centreline in the scene's coordinates: on a surface, lift it by the
 *  cable's radius (on the floor, by `FLOOR`). Draw a cable outside any frame, or in a moving set
 *  whose pivot is the origin, so the points are where they look. */

export interface Cable {
  /** Names the cable's own object, so its plugs are not counted as its supports. */
  name: string;
  /** The corners of the run, end to end. Each corner is rounded by `bend`. */
  pts: V3[];
  /** Radius in metres: about 0.003 for a network or USB lead, 0.01 for a power cable. */
  r: number;
  /** Pixels per metre at the smallest width the scene is shown: decides line or tube. */
  px: number;
  tier?: Tier;
  /** A connector body at the first and last end; false where the run is tied or enters a gland. */
  plugs?: [boolean, boolean];
  bend?: number;
  /** Moving objects the cable is tied to and travels with (a thread behind a part): it may lie
   *  under or beside them where they stand at their pivots. */
  tied?: string[];
}

/** A cable at least this many pixels across is drawn as a tube, not a line. */
export const THICK_PX = 3;
/** The centre height of a thin cable lying on the floor (clear of its plug's half-height). */
export const FLOOR = 0.012;
const STEP = 0.01;
const PLUG = 0.035;
/** How far a centreline may sit from a surface and still be lying on it. */
const REST = 0.012;
/** The longest run that may cross open air (over an edge, round a bend). */
const SPAN = 0.06;

interface Run {
  name: string;
  path: V3[];
  r: number;
  tied: string[];
}
const runs = new WeakMap<Sketch, Run[]>();

const v = (p: V3): Vector3 => new Vector3(...p);
const t3 = (x: Vector3): V3 => [x.x, x.y, x.z];

/** The run with each corner rounded (a quadratic arc of radius about `bend`), resampled at even
 *  steps so a share of its points is the same share of its length. */
export function route(pts: V3[], bend: number, step = STEP): V3[] {
  const out: Vector3[] = [];
  const p = pts.map(v);
  p.forEach((b, i) => {
    const a = p[i - 1];
    const c = p[i + 1];
    if (!a || !c) return void out.push(b.clone());
    const d = Math.min(bend, a.distanceTo(b) / 2, b.distanceTo(c) / 2);
    const p1 = b.clone().addScaledVector(a.clone().sub(b).normalize(), d);
    const p2 = b.clone().addScaledVector(c.clone().sub(b).normalize(), d);
    for (let s = 0; s <= 8; s++) {
      const u = s / 8;
      out.push(
        p1
          .clone()
          .multiplyScalar((1 - u) ** 2)
          .addScaledVector(b, 2 * u * (1 - u))
          .addScaledVector(p2, u * u),
      );
    }
  });
  const len = out.slice(1).reduce((s, q, i) => s + q.distanceTo(out[i] ?? q), 0);
  const n = Math.max(1, Math.round(len / step));
  const even: V3[] = [];
  let seg = 0;
  let acc = 0;
  for (let i = 0; i <= n; i++) {
    const want = (i / n) * len;
    while (seg < out.length - 2 && acc + (out[seg]?.distanceTo(out[seg + 1] ?? v([0, 0, 0])) ?? 0) < want) {
      acc += out[seg]?.distanceTo(out[seg + 1] ?? v([0, 0, 0])) ?? 0;
      seg++;
    }
    const [a, b] = [out[seg] ?? v([0, 0, 0]), out[seg + 1] ?? out[seg] ?? v([0, 0, 0])];
    const l = a.distanceTo(b);
    even.push(t3(a.clone().lerp(b, l ? Math.min(1, (want - acc) / l) : 0)));
  }
  return even;
}

/** A connector body ending at `end`, lying along the direction the cable arrives from. */
function plug(k: Sketch, end: V3, from: V3, r: number, tier: Tier): void {
  const x = v(end).sub(v(from)).normalize();
  const up = Math.abs(x.y) > 0.9 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0);
  const z = x.clone().cross(up).normalize();
  const y = z.clone().cross(x).normalize();
  const m = new Matrix4().makeBasis(x, y, z).setPosition(v(end).addScaledVector(x, -PLUG / 2));
  const h = Math.max(1.8 * r, 0.007);
  k.frame(m, () => k.box(-PLUG / 2, -h, -h, PLUG / 2, h, h, { tier }));
}

/** Draws a cable and records it for `cableIssues`. Returns its even-stepped path (for reveals). */
export function cable(k: Sketch, c: Cable): V3[] {
  const tier = c.tier ?? 'soft';
  const path = route(c.pts, c.bend ?? Math.max(4 * c.r, 0.03));
  const [first, last] = c.plugs ?? [true, true];
  const cut = Math.ceil(PLUG / STEP);
  const wire = path.slice(first ? cut : 0, last ? path.length - cut : path.length);
  k.object(`cable:${c.name}`, () => {
    if (first && path[0] && path[cut]) plug(k, path[0], path[cut], c.r, tier);
    const tail = path[path.length - 1];
    const before = path[path.length - 1 - cut];
    if (last && tail && before) plug(k, tail, before, c.r, tier);
    if (2 * c.r * c.px >= THICK_PX) k.tube(wire, c.r, { tier, sharp: true });
    else k.line(wire, tier);
  });
  const list = runs.get(k) ?? [];
  list.push({ name: c.name, path, r: c.r, tied: c.tied ?? [] });
  runs.set(k, list);
  return path;
}

/** How far `p` is from part `q`'s box (0 inside), and how deep inside it is (0 outside). */
function reach(p: Vector3, q: Part, at: V3): [number, number] {
  const local = p.clone().sub(q.obb.center).sub(v(at)).applyMatrix3(q.obb.rotation.clone().transpose());
  const h = q.obb.halfSize;
  const out = new Vector3(Math.max(Math.abs(local.x) - h.x, 0), Math.max(Math.abs(local.y) - h.y, 0), Math.max(Math.abs(local.z) - h.z, 0)); // prettier-ignore
  const d = out.length();
  return [d, d > 0 ? 0 : Math.min(h.x - Math.abs(local.x), h.y - Math.abs(local.y), h.z - Math.abs(local.z))];
}

/** Every way a recorded cable breaks the rule: an end in the air, a run through a solid, or a
 *  run floating more than `SPAN` without resting on anything or hanging straight down. */
export function cableIssues(k: Sketch): string[] {
  const zero: V3 = [0, 0, 0];
  const all: [Part, V3][] = [...k.parts.map((p): [Part, V3] => [p, zero]), ...k.lives.flatMap((l) => l.parts.map((p): [Part, V3] => [p, l.pivot]))]; // prettier-ignore
  const issues: string[] = [];
  for (const run of runs.get(k) ?? []) {
    const own = `cable:${run.name}`;
    const others = all.filter(([p]) => p.obj !== own && !run.tied.includes(p.obj));
    const near = (p: V3): [number, number, string] => {
      let [d, deep, obj] = [Infinity, 0, ''];
      for (const [q, at] of others) {
        const [dq, iq] = reach(v(p), q, at);
        if (dq < d) d = dq;
        if (iq > deep) [deep, obj] = [iq, q.obj];
      }
      return [d, deep, obj];
    };
    const ends = [run.path[0], run.path[run.path.length - 1]];
    ends.forEach((e, i) => {
      if (e && near(e)[0] > run.r + 0.004) issues.push(`${run.name}: its ${i ? 'last' : 'first'} end is in the air`);
    });
    let free = 0;
    let through = '';
    let floats = '';
    run.path.forEach((p, i) => {
      const [d, deep, obj] = near(p);
      if (deep > Math.max(run.r, 0.003) && !through) through = obj;
      const prev = run.path[i - 1] ?? p;
      const dir = v(p).sub(v(prev));
      const hangs = dir.length() > 0 && Math.abs(dir.normalize().y) > 0.96;
      free = d <= run.r + REST || hangs ? 0 : free + STEP;
      if (free > SPAN && !floats) floats = `${run.name}: floats near (${p.map((x) => x.toFixed(2)).join(', ')})`;
    });
    if (floats) issues.push(floats);
    if (through) issues.push(`${run.name}: runs through ${through}`);
  }
  return issues;
}
