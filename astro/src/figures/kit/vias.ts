import { BoxGeometry, InstancedMesh, type LineSegments, Matrix4, MeshBasicMaterial } from 'three';
import { lines, write } from './boards';
import type { Vec3 } from './camera';
import { STREETS, type District, type Part } from './city';
import { roof } from './citylife';
import { hexOf } from './ink';
import type { Rng } from './rng';
import { along } from './shapes';

/** Vias for a city of stacked boards (System stack): where they stand (a level's ports
 *  first, then rooftops), what they are, how they are drawn each frame, and the request's
 *  path down the hub's vias to the silicon and back. */

const m4 = new Matrix4();

/** Vias between boards, as wireframe structures with teal moving through them: a lift
 *  shaft (a braced lattice with a car riding up and down), a pipe (ringed and flanged, flow
 *  running inside) or a bucket elevator (a belt round two pulleys, buckets climbing one
 *  side and returning down the other). Frames are one line batch, rewritten each frame as
 *  the boards breathe; what moves is one instanced batch of teal boxes. */
export type ViaKind = 'lift' | 'pipe' | 'bucket';
const SLOT = 140;
const PER = 6;
export interface Tubes {
  frame: LineSegments;
  movers: InstancedMesh;
  kinds: readonly ViaKind[];
}
export function tubes(kinds: readonly ViaKind[]): Tubes {
  return {
    frame: lines(new Array(kinds.length * SLOT * 6).fill(0), 'inkSoft', 0.8),
    movers: new InstancedMesh(
      new BoxGeometry(1, 1, 1),
      new MeshBasicMaterial({ color: hexOf('signal') }),
      kinds.length * PER,
    ),
    kinds,
  };
}

/** Place via i from height a up to b at (x, z), r its half width; `flow` (rising, or falling
 *  if negative) moves what it carries. */
export function tube(T: Tubes, i: number, x: number, z: number, a: number, b: number, r: number, flow: number): void {
  const o: number[] = [];
  const h = b - a;
  const seg = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): void => {
    o.push(x + x0, a + y0, z + z0, x + x1, a + y1, z + z1);
  };
  const ring = (y: number, rad: number, n: number): void => {
    for (let k = 0; k < n; k++) {
      const [u, v] = [(k / n) * Math.PI * 2 + Math.PI / n, ((k + 1) / n) * Math.PI * 2 + Math.PI / n];
      seg(Math.cos(u) * rad, y, Math.sin(u) * rad, Math.cos(v) * rad, y, Math.sin(v) * rad);
    }
  };
  const mover = (k: number, px: number, py: number, pz: number, sx: number, sy: number, sz: number): void => {
    T.movers.setMatrixAt(i * PER + k, m4.makeScale(sx, sy, sz).setPosition(x + px, a + py, z + pz));
  };
  for (let k = 0; k < PER; k++) mover(k, 0, 0, 0, 0, 0, 0);
  const steps = Math.max(2, Math.min(12, Math.round(h / 0.05)));
  const kind = T.kinds[i] ?? 'pipe';
  const s = r * 1.4;
  if (kind === 'lift') {
    for (const [cx, cz] of [
      [-s, -s],
      [s, -s],
      [s, s],
      [-s, s],
    ] as const)
      seg(cx, 0, cz, cx, h, cz);
    for (let k = 0; k <= steps; k++) ring((h * k) / steps, s * Math.SQRT2, 4);
    for (let k = 0; k < steps; k++) {
      const [y0, y1] = [(h * k) / steps, (h * (k + 1)) / steps];
      const side = k % 2 ? s : -s;
      seg(-s, y0, side, s, y1, side);
      seg(side, y0, -s, side, y1, s);
    }
    // The car rides up and down, easing to a stop at each level; its counterweight opposite.
    const u = 0.5 - 0.5 * Math.cos(flow * Math.PI * 2);
    mover(0, 0, 0.02 + u * (h - 0.06), 0, s * 1.5, 0.035, s * 1.5);
    mover(1, s * 0.8, 0.02 + (1 - u) * (h - 0.06), s * 0.8, s * 0.3, 0.03, s * 0.3);
  } else if (kind === 'pipe') {
    for (let k = 0; k <= steps; k++) ring((h * k) / steps, r, 8);
    for (const y of [0.008, h / 2, h - 0.008]) ring(y, r * 1.5, 8);
    for (let k = 0; k < 4; k++) {
      const u = (k / 4) * Math.PI * 2;
      seg(Math.cos(u) * r, 0, Math.sin(u) * r, Math.cos(u) * r, h, Math.sin(u) * r);
    }
    for (let k = 0; k < 4; k++) {
      const f = (((k / 4 + flow) % 1) + 1) % 1;
      mover(k, 0, 0.02 + f * (h - 0.04), 0, r * 1.3, 0.04, r * 1.3);
    }
  } else {
    // A belt round a head and a boot pulley, in a frame of two posts each side.
    const p = s * 0.9;
    for (const sx of [-1, 1]) for (const sz of [-0.5, 0.5]) seg(sx * s * 1.3, 0, sz * s, sx * s * 1.3, h, sz * s);
    for (let k = 0; k <= steps; k += 2)
      for (const sx of [-1, 1]) seg(sx * s * 1.3, (h * k) / steps, -s / 2, sx * s * 1.3, (h * k) / steps, s / 2);
    const [y0, y1] = [p + 0.01, h - p - 0.01];
    for (const yc of [y0, y1])
      for (let k = 0; k < 10; k++) {
        const [u, v] = [(k / 10) * Math.PI * 2, ((k + 1) / 10) * Math.PI * 2];
        seg(Math.cos(u) * p, yc + Math.sin(u) * p, 0, Math.cos(v) * p, yc + Math.sin(v) * p, 0);
      }
    seg(p, y0, 0, p, y1, 0);
    seg(-p, y0, 0, -p, y1, 0);
    // Buckets climb the right-hand run full and come down the left.
    const len = 2 * (y1 - y0);
    for (let k = 0; k < PER; k++) {
      const d = ((((k / PER + flow) % 1) + 1) % 1) * len;
      const [bx, by] = d < y1 - y0 ? [p, y0 + d] : [-p, y1 - (d - (y1 - y0))];
      mover(k, bx + (bx > 0 ? 0.012 : -0.012), by, 0, 0.02, 0.016, s * 0.8);
    }
  }
  const out = o.slice(0, SLOT * 6);
  while (out.length < SLOT * 6) out.push(0);
  write(T.frame, out, i * SLOT * 2);
}

/** Mark the movers as changed, once a frame after placing every via. */
export function commit(T: Tubes): void {
  T.movers.instanceMatrix.needsUpdate = true;
}

export interface Via {
  /** The stack, the level the via rises from, and where on it. */
  s: number;
  lo: number;
  x: number;
  z: number;
  /** Height it starts at on that level: 0, or a rooftop's. */
  foot: number;
  r: number;
  up: boolean;
  kind: ViaKind;
}
export interface Lay {
  cities: District[];
  dims: [number, number][];
  parts: Part[][];
  kind: ViaKind;
  /** More and wider vias (the energy island), and how many rooftop ones. */
  wide: boolean;
  roofs: number;
}

/** Vias for each stack: per gap between levels, one at each of the lower level's ports
 *  (its gathering points carry its goods up) or where it falls; then pipes off rooftops. */
export function lay(stacks: readonly Lay[], r: number, rng: Rng): Via[] {
  const vias: Via[] = [];
  stacks.forEach((S, s) => {
    const via = (x: number, z: number, lo: number, foot: number, kind: ViaKind): number =>
      vias.push({ s, x, z, lo, foot, r: S.wide && !foot ? r * 1.5 : r, up: vias.length % 2 === 1, kind });
    const n = S.cities.length;
    for (let k = 0; k + 1 < n; k++)
      for (let j = 0; j < (S.wide ? 2 : 1); j++) {
        const port = S.cities[k]?.ports?.[j];
        const x = ((k + j) % 2 ? -1 : 1) * (S.dims[k]?.[0] ?? 1) * (0.2 + (rng() - 0.5) * 0.12);
        via(port ? port[0] : x, port ? port[2] : (rng() - 0.5) * 0.6, k, 0, S.kind);
      }
    for (let m = 0; n > 1 && m < S.roofs; m++) {
      const lo = Math.floor(rng() * (n - 1));
      const p = roof(S.parts[lo] ?? [], rng);
      if (p) via(p.x, p.z, lo, (p.y ?? 0) + p.h, 'pipe');
    }
  });
  return vias;
}

/** The request at time t on a hub whose level k is at height y(k): from a person on the
 *  top level along the street to the first via, down it, across to the next, and so on
 *  to the silicon; then the answer climbs back. Returns where it is and its trail. */
export function request(
  y: (k: number) => number,
  vias: readonly Via[],
  top: number,
  t: number,
): { head: Vec3; trail: number[] } {
  const pts: Vec3[] = [[STREETS.x[0] ?? 0, y(top), STREETS.z[2] ?? 0]];
  for (let k = top; k >= 1; k--) {
    const q = vias[k - 1];
    const last = pts[pts.length - 1];
    if (q && last) pts.push([q.x, y(k), last[2]], [q.x, y(k), q.z], [q.x, y(k - 1), q.z]);
  }
  pts.push([0.72, y(0), -0.34]);
  const cycle = (t / 9) % 1;
  const u = cycle < 0.5 ? cycle * 2 : 2 - cycle * 2;
  const trail: number[] = [];
  for (let i = 0; i < 64; i++) {
    const [a, b] = [along(pts, (u * i) / 64), along(pts, (u * (i + 1)) / 64)];
    trail.push(a[0], a[1] + 0.005, a[2], b[0], b[1] + 0.005, b[2]);
  }
  return { head: along(pts, u), trail };
}
