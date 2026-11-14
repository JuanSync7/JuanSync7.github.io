import { BoxGeometry, BufferGeometry, CylinderGeometry, LatheGeometry, SphereGeometry, Vector2 } from 'three';
import { detail } from './legodetail';
import { box, fall, GAP, join, plan, profile, SEG, studsAt, type BodyOpts, type Part } from './legogeo';
import { footprint, HOLE_Y, PLATE, wedgeOutline, type Kind, type Piece } from './legoset';

export { GAP, STUD_H, STUD_R, join, type BodyOpts, type Part } from './legogeo';

/** The 3D shape of every catalogue piece, in the piece's own frame: its footprint from (0, 0) to
 *  (w, d) on x and z, its bottom at y = 0. The same builders draw the smooth isometric model
 *  (`studs: false`, no gap, one body per shape) so the two views share their geometry. A piece
 *  can have more than one part (a wheel is a tyre and a rim); `tone` overrides the piece's own. */

/** The tyre: a lathe of a rounded section between the rim and the tread, with two grooves. */
function tyre(r: number, d: number): BufferGeometry {
  const ri = r * 0.64;
  const c = Math.min(0.35, d * 0.18);
  const pts: [number, number][] = [
    [ri, 0], [r - c, 0], [r - c * 0.3, c * 0.3], [r, c], [r, d * 0.3], [r - 0.06, d * 0.33], [r, d * 0.36],
    [r, d * 0.64], [r - 0.06, d * 0.67], [r, d * 0.7], [r, d - c], [r - c * 0.3, d - c * 0.3], [r - c, d], [ri, d],
  ]; // prettier-ignore
  return new LatheGeometry(
    pts.map(([a, b]) => new Vector2(a, b)),
    28,
  ).rotateX(Math.PI / 2);
}

/** The rim: a dished disc on each face with five spokes and a hub. */
function rim(r: number, d: number): BufferGeometry {
  const ri = r * 0.64;
  const parts: BufferGeometry[] = [
    new CylinderGeometry(ri, ri, d * 0.8, 24).rotateX(Math.PI / 2).translate(0, 0, d / 2),
  ];
  for (const z of [0.02, d - 0.02]) {
    parts.push(new CylinderGeometry(0.28, 0.28, 0.12, 12).rotateX(Math.PI / 2).translate(0, 0, z));
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      parts.push(
        new BoxGeometry(ri * 0.95, 0.16, 0.08)
          .translate(ri * 0.47, 0, 0)
          .rotateZ(a)
          .translate(0, 0, z),
      );
    }
  }
  return join(parts);
}

/** A helmet's visor: a band of the dome's sphere, a hair proud of it, across the front (-x). */
const visor = (r: number, squash: number): BufferGeometry =>
  new SphereGeometry(r * 1.015, 24, 6, -Math.PI / 3, (Math.PI * 2) / 3, Math.PI * 0.3, Math.PI * 0.14).scale(
    1,
    squash,
    1,
  );

/** The parts of a piece of kind `kind` and size w x d x h plates, studded or smooth. */
export function body(p: Piece, o: BodyOpts = { studs: true, gap: GAP }): Part[] {
  const { w, d, h } = p;
  const g = o.gap;
  const top = h * PLATE;
  const studded = (): BufferGeometry[] => (o.studs ? studsAt(footprint(p).studs, top) : []);
  const merge = (list: BufferGeometry[]): Part[] => [{ geo: join(list) }];
  const kind: Kind = p.kind;
  switch (kind) {
    case 'brick':
    case 'plate':
    case 'tile':
      return merge([box(g, 0, g, w - g, top, d - g), ...studded()]);
    case 'grille': {
      const ribs = Array.from({ length: w * 2 }, (_, k) => box(k * 0.5 + 0.08, top - 0.12, g + 0.1, k * 0.5 + 0.3, top, d - g - 0.1)); // prettier-ignore
      return merge([box(g, 0, g, w - g, top - 0.12, d - g), ...ribs]);
    }
    case 'technic': {
      const holes = Array.from({ length: w - 1 }, (_, k) => [g - 0.01, d - g + 0.01].map((z) => new CylinderGeometry(0.25, 0.25, 0.04, SEG).rotateX(Math.PI / 2).translate(k + 1, HOLE_Y * PLATE, z))).flat(); // prettier-ignore
      return [...merge([box(g, 0, g, w - g, top, d - g), ...studded()]), { geo: join(holes), tone: 'dark' }];
    }
    case 'slope45':
      return merge([profile([[g, 0], [w - g, 0], [w - g, 0.16], [1, top], [g, top]], d, g), ...studded()]); // prettier-ignore
    case 'cheese':
    case 'curve2':
    case 'curve4':
      return merge([profile([[g, 0], [w - g, 0], ...fall(w - g, top, 0.08, kind !== 'cheese').reverse()], d, g)]);
    case 'wedge':
      return merge([plan(wedgeOutline(p), top), ...studded()]);
    case 'round': {
      const c = new CylinderGeometry(w / 2 - g, w / 2 - g, top, 24).translate(w / 2, top / 2, d / 2);
      return merge([c, ...studded()]);
    }
    case 'dome':
    case 'helmet': {
      const seg = Math.max(24, w * 6);
      const s = new SphereGeometry(w / 2 - g, seg, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(
        1,
        (top - 0.3) / (w / 2),
        1,
      );
      const neck = new CylinderGeometry(w / 2 - g, w / 2 - g, 0.3, seg).translate(0, 0.15, 0);
      const shell: Part = { geo: join([neck, s.translate(0, 0.3, 0)]).translate(w / 2, 0, d / 2) };
      if (kind === 'dome') return [shell];
      return [shell, { geo: visor(w / 2 - g, (top - 0.3) / (w / 2)).translate(w / 2, 0.3, d / 2), tone: 'dark' }];
    }
    case 'uplate': {
      const a = d / 2;
      const pts: [number, number][] = [
        [0, g],
        [w - a, g],
      ];
      for (let k = 1; k < SEG; k++) pts.push([w - a + (a - g) * Math.sin((k / SEG) * Math.PI), a - (a - g) * Math.cos((k / SEG) * Math.PI)]); // prettier-ignore
      pts.push([w - a, d - g], [0, d - g], [0, d - 1 + g], [w - a, d - 1 + g]);
      for (let k = SEG - 1; k > 0; k--) pts.push([w - a + (a - 1) * Math.sin((k / SEG) * Math.PI), a - (a - 1) * Math.cos((k / SEG) * Math.PI)]); // prettier-ignore
      pts.push([w - a, 1 - g], [0, 1 - g]);
      return merge([plan(pts, top)]);
    }
    case 'wheel': {
      const r = p.r ?? 1;
      const cy = (p.cy ?? 0) * PLATE;
      return [{ geo: tyre(r, d).translate(0, cy, 0) }, { geo: rim(r, d).translate(0, cy, 0), tone: 'rim' }];
    }
    case 'axle': {
      const cy = (p.cy ?? 0) * PLATE;
      const r = p.r ?? 0.12;
      return merge([box(-r, cy - r / 3, 0, r, cy + r / 3, d), box(-r / 3, cy - r, 0, r / 3, cy + r, d)]);
    }
    default:
      return detail(p, o);
  }
}
