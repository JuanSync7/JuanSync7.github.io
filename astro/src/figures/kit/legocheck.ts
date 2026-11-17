// One source: JuanSync7/frontend-kit, bricks/src (@juansync7/bricks). A project's copy is synced from it, never edited.
import { clashes } from './legoclash.ts';
import { dot, jointsOf, spot, type Joint } from './legojoint.ts';
import { cellsOf, HOLE_Y, key, turn, type Piece } from './legoset.ts';

/** The checks every LEGO model must pass, kept apart from the catalogue and the swap so the code
 *  that builds a model is not the code that judges it. Pure, so a project runs it in node over its
 *  models, and at build in every figure (`mustHold`, which throws). */

/** Technic holes: the axis x of each, its height, and the z span it runs through. */
const holesOf = (p: Piece): { x: number; y: number; z0: number; z1: number }[] =>
  p.kind !== 'technic'
    ? []
    : Array.from({ length: p.w - 1 }, (_, k) => ({ x: turn(p, k + 1, 0)[0], y: p.y + HOLE_Y, z0: p.z, z1: p.z + p.d }));

export interface Report {
  clipping: string[];
  floating: string[];
  offGrid: string[];
}

const label = (pieces: Piece[], i: number): string => {
  const p = pieces[i];
  return p ? name(p, i) : `#${i}`;
};
const name = (p: Piece, i: number): string => `#${i} ${p.kind} at ${p.x},${p.y},${p.z}${p.sub ? ` in ${p.sub}` : ''}`;

/** The checks: no two pieces in one cell of a grid, and no overlap between sub-assemblies
 *  (clipping); every piece joined to the root through studs, side studs, hinges or an axle
 *  (floating); every block piece on whole studs and plates of its own grid (off grid). */
export function inspect(pieces: Piece[]): Report {
  const report: Report = { clipping: [], floating: [], offGrid: [] };
  const owner = new Map<string, number>();
  pieces.forEach((p, i) => {
    const rolling = p.kind === 'wheel' || p.kind === 'axle';
    if (!rolling && ![p.x, p.y, p.z].every(Number.isInteger)) report.offGrid.push(name(p, i));
    for (const c of cellsOf(p)) {
      const at = `${p.sub ?? ''}|${c}`;
      const o = owner.get(at);
      if (o !== undefined && o !== i) report.clipping.push(`${name(p, i)} meets ${name(pieces[o] ?? p, o)} in ${at}`);
      else owner.set(at, i);
    }
  });
  const parent = pieces.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i] ?? i)));
  const join = (a: number, b: number): void => void (parent[find(a)] = find(b));
  // Joints meet at one point: a stud head on into a socket, or two knuckles on one axis.
  const meet = new Map<string, { i: number; j: Joint }[]>();
  pieces.forEach((p, i) =>
    jointsOf(p).forEach((j) => {
      const list = meet.get(spot(j.at));
      if (list) list.push({ i, j });
      else meet.set(spot(j.at), [{ i, j }]);
    }),
  );
  const hinged = new Set<string>();
  for (const list of meet.values())
    for (const a of list)
      for (const b of list) {
        if (a.i >= b.i) continue;
        const [s, t] = [a.j.kind, b.j.kind];
        const plugged =
          ((s === 'stud' && t === 'socket') || (s === 'socket' && t === 'stud')) && dot(a.j.dir, b.j.dir) < -0.99;
        const pinned = s === 'hinge' && t === 'hinge' && Math.abs(dot(a.j.dir, b.j.dir)) > 0.99;
        if (plugged || pinned) join(a.i, b.i);
        if (pinned) hinged.add(`${a.i}-${b.i}`);
      }
  if (pieces.some((p) => p.sub))
    for (const [a, b] of clashes(pieces, hinged))
      report.clipping.push(`${label(pieces, a)} meets ${label(pieces, b)} across sub-assemblies`);
  pieces.forEach((a, i) => {
    if (a.kind !== 'axle') return;
    const z1 = a.z + a.d;
    pieces.forEach((b, j) => {
      const along = (z0: number, zb: number): boolean => z0 < z1 && zb > a.z;
      if (b.kind === 'wheel' && b.x === a.x && b.cy === a.cy && along(b.z, b.z + b.d)) join(i, j);
      for (const hole of holesOf(b)) if (hole.x === a.x && hole.y === a.cy && along(hole.z0, hole.z1)) join(i, j);
    });
    // The axle's own path must be clear: past its holes and hubs nothing may sit on it.
    for (let z = a.z; z < z1; z++) {
      for (const x of [a.x - 1, a.x]) {
        const o = owner.get(`|${key(x, Math.floor(a.cy ?? 0), z)}`);
        const host = o !== undefined && (pieces[o]?.kind === 'technic' || pieces[o]?.kind === 'wheel');
        if (o !== undefined && !host) report.clipping.push(`${name(a, i)} runs through ${name(pieces[o] ?? a, o)}`);
      }
    }
  });
  const root = pieces.findIndex((p) => p.root);
  pieces.forEach((p, i) => {
    if (root < 0 || find(i) !== find(root)) report.floating.push(name(p, i));
  });
  return report;
}

/** Throws unless the model passes every check. */
export function mustHold(pieces: Piece[], model: string): void {
  const r = inspect(pieces);
  const bad = [...r.offGrid.map((s) => `off grid: ${s}`), ...r.clipping.map((s) => `clipping: ${s}`), ...r.floating.map((s) => `floating: ${s}`)]; // prettier-ignore
  if (bad.length) throw new Error(`lego ${model}: ${bad.length} problem(s)\n${bad.slice(0, 12).join('\n')}`);
}
