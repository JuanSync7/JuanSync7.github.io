import { BoxGeometry, InstancedMesh, Matrix4, MeshBasicMaterial } from 'three';
import type { Vec3 } from './camera';
import { STREETS, type District } from './city';
import { hexOf } from './ink';
import type { Rng } from './rng';
import { PAVEMENT } from './streets';
import type { At } from './traffic';

/** People in a city scene, one instanced batch: walkers out on a district's street grid
 *  (`STREETS`, `kit/city.ts`), on its pavements (`kit/streets.ts`), and workers standing where districts put them (along an
 *  assembly line, on a platform). */

const m4 = new Matrix4();
interface Walker {
  line: number;
  along: boolean;
  u: number;
  v: number;
}
export interface Crowd {
  mesh: InstancedMesh;
  walkers: Walker[];
  workers: { s: number; k: number; p: Vec3 }[];
}

export function crowd(cities: District[][], walkers: number, rng: Rng): Crowd {
  const workers = cities.flatMap((stack, s) => stack.flatMap((c, k) => (c.workers ?? []).map((p) => ({ s, k, p }))));
  const mesh = new InstancedMesh(
    new BoxGeometry(0.014, 0.03, 0.014),
    new MeshBasicMaterial({ color: hexOf('inkSoft') }),
    walkers + workers.length,
  );
  const ws = Array.from({ length: walkers }, () => {
    const alongX = rng() > 0.5;
    const n = alongX ? STREETS.z.length : STREETS.x.length;
    return { line: Math.floor(rng() * n), along: alongX, u: rng(), v: (rng() - 0.5) * 0.1 };
  });
  return { mesh, walkers: ws, workers };
}

/** Walkers stroll the streets of stack s's level k (a w × d board); workers stay at work. */
export function gather(C: Crowd, t: number, at: At, s: number, k: number, w: number, d: number): void {
  const put = (i: number, q: Vec3): void => C.mesh.setMatrixAt(i, m4.makeTranslation(q[0], q[1] + 0.016, q[2]));
  C.walkers.forEach((p, i) => {
    const span = p.along ? w * 0.9 : d * 0.9;
    const u = (((((p.u + (p.v * t) / span) % 1) + 1) % 1) - 0.5) * span;
    // On the pavement, one side or the other, so where streets cross they cross on the zebra.
    const side = i % 2 ? PAVEMENT : -PAVEMENT;
    const fixed = (p.along ? (STREETS.z[p.line] ?? 0) : (STREETS.x[p.line] ?? 0)) + side;
    put(i, at(s, k, p.along ? [u, 0, fixed] : [fixed, 0, u]));
  });
  C.workers.forEach((q, i) => put(C.walkers.length + i, at(q.s, q.k, q.p)));
  C.mesh.instanceMatrix.needsUpdate = true;
}
