import { CylinderGeometry, type BufferGeometry } from 'three';
import { box, fall, join, plan, profile, SEG, STUD_R, studsAt, type BodyOpts, type Part } from './legogeo';
import { footprint, PLATE, type Piece } from './legoset';

/** Geometry for the detail pieces: the gentler and inverted slopes, the 3-long curve, rounded
 *  tiles, the cone, the bar and the fin. Same frame as `legomesh.ts`: footprint (0, 0) to (w, d),
 *  bottom at y = 0; a ramp's high end at u = 0. */
export function detail(p: Piece, o: BodyOpts): Part[] {
  const { w, d, h } = p;
  const g = o.gap;
  const top = h * PLATE;
  const studs = (): BufferGeometry[] => (o.studs ? studsAt(footprint(p).studs, top) : []);
  const one = (list: BufferGeometry[]): Part[] => [{ geo: join(list) }];
  switch (p.kind) {
    case 'slope33':
      return one([profile([[g, 0], [w - g, 0], [w - g, 0.16], [1, top], [g, top]], d, g), ...studs()]); // prettier-ignore
    case 'inv45':
      // A studded flat top; underneath, one stud row of bottom and then the face rising away.
      return one([profile([[g, 0], [1, 0], [w - g, top - 0.16], [w - g, top], [g, top]], d, g), ...studs()]); // prettier-ignore
    case 'curve3':
      return one([profile([[g, 0], [w - g, 0], ...fall(w - g, top, 0.08, true).reverse()], d, g)]);
    case 'quarter': {
      // The rounded edge faces away from the corner at (0, 0).
      const r = 1 - g;
      const arc = Array.from({ length: SEG + 1 }, (_, k): [number, number] => {
        const a = (k / SEG) * (Math.PI / 2);
        return [r * Math.cos(a), r * Math.sin(a)];
      });
      return one([plan([[0, 0], ...arc], top)]);
    }
    case 'roundtile':
      return one([new CylinderGeometry(w / 2 - g, w / 2 - g, top, 24).translate(w / 2, top / 2, d / 2)]);
    case 'cone':
      return one([new CylinderGeometry(STUD_R, 0.5 - g, top, 20).translate(0.5, top / 2, 0.5), ...studs()]);
    case 'bar':
      return one([
        new CylinderGeometry(0.1, 0.1, top, 10).translate(0.5, top / 2, 0.5),
        new CylinderGeometry(0.16, 0.16, 0.12, 10).translate(0.5, top - 0.06, 0.5),
      ]);
    case 'fin': {
      const t = 0.12;
      const fin = profile([[g, 0], [w - g, 0], [w - g, top], [w - 0.7, top], [g, 0.25]], d, d / 2 - t); // prettier-ignore
      return one([fin, box(g, 0, d / 2 - 0.2, w - g, 0.12, d / 2 + 0.2)]);
    }
    default:
      throw new Error(`lego: no geometry for ${p.kind}`);
  }
}
