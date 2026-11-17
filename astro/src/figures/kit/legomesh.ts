import { BoxGeometry, BufferGeometry, CylinderGeometry, LatheGeometry, SphereGeometry, Vector2 } from 'three';
import { detail } from './legodetail';
import {
  box,
  fall,
  GAP,
  join,
  LIP,
  plan,
  profile,
  SEG,
  STUD_H,
  STUD_R,
  studsAt,
  type BodyOpts,
  type Part,
} from './legogeo';
import { hollow } from './legounder';
import { footprint, HOLE_Y, PLATE, wedgeOutline, type Kind, type Piece } from './legoset';

export { GAP, STUD_H, STUD_R, join, type BodyOpts, type Part } from './legogeo';

/** The 3D shape of every catalogue piece, in the piece's own frame: its footprint from (0, 0) to
 *  (w, d) on x and z, its bottom at y = 0. The same builders draw the smooth isometric model
 *  (`studs: false`, no gap, one body per shape) so the two views share their geometry. A piece
 *  can have more than one part (a wheel is a tyre and a rim); `tone` overrides the piece's own. */

/** A real tyre's inner radius against its outer: both F1 wheels are on 30 mm rims (56904,
 *  56145) in 43 mm tyres. */
const RIM = 0.7;
/** The tyre: a lathe of a rounded section between the rim and the tread, with two grooves. */
function tyre(r: number, d: number): BufferGeometry {
  const ri = r * RIM;
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

/** The rim: a dished disc on each face with six spokes and a hub. */
function rim(r: number, d: number): BufferGeometry {
  const ri = r * RIM;
  const parts: BufferGeometry[] = [
    new CylinderGeometry(ri, ri, d * 0.8, 24).rotateX(Math.PI / 2).translate(0, 0, d / 2),
  ];
  for (const z of [0.02, d - 0.02]) {
    parts.push(new CylinderGeometry(0.28, 0.28, 0.12, 12).rotateX(Math.PI / 2).translate(0, 0, z));
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
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
      return merge([o.under ? hollow(w, d, top, g) : box(g, 0, g, w - g, top, d - g), ...studded()]);
    case 'grille': {
      // As the real 1 x 2 grille tile (2412b): two slots a stud along its length, open through,
      // between three bars, closed at each end by a half-height block.
      const long = w >= d;
      const [L, S] = long ? [w, d] : [d, w];
      const at = (a0: number, s0: number, a1: number, s1: number, y1: number): BufferGeometry =>
        long ? box(a0, 0, s0, a1, y1, s1) : box(s0, 0, a0, s1, y1, a1);
      const bars = Array.from({ length: S }, (_, j) => [0, 0.4, 0.8].map((z) => at(g, j + Math.max(z, g), L - g, j + Math.min(z + 0.2, 1 - g), top))).flat(); // prettier-ignore
      return merge([...bars, at(g, g, 0.25, S - g, top / 2), at(L - 0.25, g, L - g, S - g, top / 2)]);
    }
    case 'technic': {
      const holes = Array.from({ length: w - 1 }, (_, k) => [g - 0.01, d - g + 0.01].map((z) => new CylinderGeometry(0.25, 0.25, 0.04, SEG).rotateX(Math.PI / 2).translate(k + 1, HOLE_Y * PLATE, z))).flat(); // prettier-ignore
      return [...merge([box(g, 0, g, w - g, top, d - g), ...studded()]), { geo: join(holes), tone: 'dark' }];
    }
    case 'slope45':
      return merge([profile([[g, 0], [w - g, 0], [w - g, LIP], [1, top], [g, top]], d, g), ...studded()]); // prettier-ignore
    case 'cheese':
    case 'curve2':
    case 'curve4':
      return merge([profile([[g, 0], [w - g, 0], ...fall(w - g, top, LIP, kind !== 'cheese').reverse()], d, g)]);
    case 'wedge':
      return merge([plan(wedgeOutline(p), top), ...studded()]);
    case 'round': {
      const c = new CylinderGeometry(w / 2 - g, w / 2 - g, top, 24).translate(w / 2, top / 2, d / 2);
      return merge([c, ...studded()]);
    }
    case 'dome': {
      // The 2 x 2 (30367) is a lathe of the real one's profile (its round wall, its shoulder and a
      // flat crown carrying one stud); the 4 x 4 (86500) a flatter dome on a short wall.
      if (w === 2) {
        const prof: [number, number][] = [[0, 0], [1, 0], [1, 0.55], [0.95, 0.71], [0.88, 0.81], [0.73, 1.04], [0.64, 1.12], [0.5, 1.19], [0.4, top], [0, top]]; // prettier-ignore
        const shell = new LatheGeometry(
          prof.map(([r, y]) => new Vector2(Math.max(0, r - g), y)),
          28,
        );
        const stud = new CylinderGeometry(STUD_R, STUD_R, STUD_H, 16).translate(0, top + STUD_H / 2, 0);
        return [{ geo: join([shell, stud]).translate(1, 0, 1) }];
      }
      const seg = Math.max(24, w * 6);
      const n = 0.3;
      const s = new SphereGeometry(w / 2 - g, seg, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, (top - n) / (w / 2), 1); // prettier-ignore
      const neck = new CylinderGeometry(w / 2 - g, w / 2 - g, n, seg).translate(0, n / 2, 0);
      return [{ geo: join([neck, s.translate(0, n, 0)]).translate(w / 2, 0, d / 2) }];
    }
    case 'wheel': {
      const r = p.r ?? 1;
      const cy = (p.cy ?? 0) * PLATE;
      return [{ geo: tyre(r, d).translate(0, cy, 0) }, { geo: rim(r, d).translate(0, cy, 0), tone: 'rim' }];
    }
    case 'axle': {
      const cy = (p.cy ?? 0) * PLATE;
      const r = p.r ?? 0.3;
      return merge([box(-r, cy - r / 2.6, 0, r, cy + r / 2.6, d), box(-r / 2.6, cy - r, 0, r / 2.6, cy + r, d)]);
    }
    default:
      return detail(p, o);
  }
}
