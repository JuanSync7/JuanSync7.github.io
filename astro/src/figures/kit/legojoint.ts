import { apply, flangeOf, KNUCKLE_Y, local, rotate, type V3 } from './legopose.ts';
import { PLATE, socketsOf, studsOf, type Piece } from './legoset.ts';

/** Where pieces join, in the model's own space, whatever way up each piece is: a stud (pointing
 *  out of its piece), a socket that takes a stud (pointing back at it), and a hinge knuckle (its
 *  axis). A stud and a socket join where they meet head on; two knuckles join on one axis. Pure. */

export interface Joint {
  kind: 'stud' | 'socket' | 'hinge';
  at: V3;
  dir: V3;
}

const minus = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

export function jointsOf(p: Piece): Joint[] {
  const q = p.pose;
  const turned = (v: V3): V3 => (q ? rotate(q, v) : v);
  const up = turned([0, 1, 0]);
  const down: V3 = [-up[0], -up[1], -up[2]];
  const out: Joint[] = [];
  const { at, top } = studsOf(p);
  for (const [x, z] of at) out.push({ kind: 'stud', at: apply(q, [x + 0.5, top * PLATE, z + 0.5]), dir: up });
  for (const c of socketsOf(p)) {
    const [x = 0, y = 0, z = 0] = c.split(',').map(Number);
    out.push({ kind: 'socket', at: apply(q, [x + 0.5, y * PLATE, z + 0.5]), dir: down });
  }
  if (p.kind === 'bracket') {
    const out0 = turned(minus(local(p, 0, 0, -1), local(p, 0, 0, 0)));
    for (let i = 0; i < p.w; i++)
      for (let k = 0; k < flangeOf(p); k++) out.push({ kind: 'stud', at: apply(q, local(p, i + 0.5, k + 0.5, 0)), dir: out0 }); // prettier-ignore
  }
  if (p.kind === 'hinge') {
    const axis = turned(minus(local(p, 1, 0, p.d), local(p, 0, 0, p.d)));
    out.push({ kind: 'hinge', at: apply(q, local(p, p.w / 2, KNUCKLE_Y, p.d)), dir: axis });
  }
  return out;
}

/** A point rounded to a thousandth of a stud, to find joints that meet. */
export const spot = (v: V3): string => v.map((c) => Math.round(c * 1000)).join(',');
export const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
