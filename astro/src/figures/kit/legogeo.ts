// One source: JuanSync7/frontend-kit, bricks/src (@juansync7/bricks). A project's copy is synced from it, never edited.
import { BoxGeometry, BufferGeometry, CylinderGeometry, ExtrudeGeometry, Shape, Vector2 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Shared geometry primitives for the LEGO pieces (`legomesh.ts`, `legodetail.ts`): a box, a
 *  side profile pushed across, a plan outline pushed up, studs, a falling top, and a merge that
 *  takes mixed geometry. Every piece is drawn in its own frame, footprint (0, 0) to (w, d). */

export const STUD_R = 0.3;
export const STUD_H = 1.7 / 8; // 1.7 mm, on the 8 mm stud pitch
export const GAP = 0.02;
export const SEG = 16;

export interface Part {
  geo: BufferGeometry;
  tone?: 'rim' | 'dark';
}
export interface BodyOpts {
  studs: boolean;
  gap: number;
  /** Draw the real underside (walls, tubes, pins) where the piece has one. */
  under?: boolean;
}

/** Merges parts of mixed kinds (indexed boxes, unindexed extrusions) into one geometry. */
export function join(list: BufferGeometry[]): BufferGeometry {
  const flat = list.map((g) => {
    const f = g.index ? g.toNonIndexed() : g;
    f.deleteAttribute('uv');
    return f;
  });
  const out = mergeGeometries(flat);
  if (!out) throw new Error('lego: parts would not merge');
  return out;
}

export const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): BufferGeometry =>
  new BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);

/** A side profile (u along x, height y) pushed across z from g to d - g. */
export function profile(points: [number, number][], d: number, g: number): BufferGeometry {
  const s = new Shape(points.map(([u, y]) => new Vector2(u, y)));
  return new ExtrudeGeometry(s, { depth: d - 2 * g, bevelEnabled: false }).translate(0, 0, g);
}

/** A plan outline (u along x, v along z) pushed up from 0 to h. */
export function plan(points: [number, number][], h: number): BufferGeometry {
  const s = new Shape(points.map(([u, v]) => new Vector2(u, -v)));
  return new ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: SEG }).rotateX(-Math.PI / 2);
}

export const studsAt = (cells: [number, number][], top: number): BufferGeometry[] =>
  cells.map(([i, j]) =>
    new CylinderGeometry(STUD_R, STUD_R, STUD_H, SEG).translate(i + 0.5, top + STUD_H / 2, j + 0.5),
  );

/** The lip a slope keeps at its low end, as on the real parts (1.6 mm). */
export const LIP = 0.2;

/** A falling top from height `hi` at u = from to `lo` at u = run: straight, or a curve that
 *  holds its height and then rolls off (1 - t^2, the profile of the real curved slopes). */
export function fall(run: number, hi: number, lo: number, curved: boolean, from = 0): [number, number][] {
  const n = curved ? 12 : 1;
  return Array.from({ length: n + 1 }, (_, k): [number, number] => {
    const t = k / n;
    const y = curved ? lo + (hi - lo) * (1 - Math.pow(t, 2.1)) : hi + (lo - hi) * t;
    return [from + (run - from) * t, y];
  });
}
