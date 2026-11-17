import { CylinderGeometry, type BufferGeometry } from 'three';
import { box, fall, join, LIP, plan, profile, SEG, STUD_H, STUD_R, studsAt, type BodyOpts, type Part } from './legogeo';
import { FLANGE_T, flangeOf, KNUCKLE_OUT, KNUCKLE_R, KNUCKLE_Y } from './legopose';
import { footprint, PLATE, type Piece } from './legoset';

/** Geometry for the detail pieces: the gentler and inverted slopes, the 3-long curve, rounded
 *  tiles, the cone and the bar. Same frame as `legomesh.ts`: footprint (0, 0) to (w, d),
 *  bottom at y = 0; a ramp's high end at u = 0. */
export function detail(p: Piece, o: BodyOpts): Part[] {
  const { w, d, h } = p;
  const g = o.gap;
  const top = h * PLATE;
  const studs = (): BufferGeometry[] => (o.studs ? studsAt(footprint(p).studs, top) : []);
  const one = (list: BufferGeometry[]): Part[] => [{ geo: join(list) }];
  switch (p.kind) {
    case 'slope33':
      return one([profile([[g, 0], [w - g, 0], [w - g, LIP], [1, top], [g, top]], d, g), ...studs()]); // prettier-ignore
    case 'inv45':
      // A studded flat top; underneath, one stud row of bottom and then the face rising away.
      return one([profile([[g, 0], [1, 0], [w - g, top - LIP], [w - g, top], [g, top]], d, g), ...studs()]); // prettier-ignore
    case 'curve3':
      return one([profile([[g, 0], [w - g, 0], ...fall(w - g, top, LIP, true).reverse()], d, g)]);
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
      // A short round foot, then the taper up to the stud (as the real cone).
      return one([new CylinderGeometry(0.5 - g, 0.5 - g, LIP, 20).translate(0.5, LIP / 2, 0.5), new CylinderGeometry(STUD_R, 0.5 - g, top - LIP, 20).translate(0.5, LIP + (top - LIP) / 2, 0.5), ...studs()]); // prettier-ignore
    case 'bar':
      return one([
        new CylinderGeometry(0.1, 0.1, top, 10).translate(0.5, top / 2, 0.5),
        new CylinderGeometry(0.16, 0.16, 0.12, 10).translate(0.5, top - 0.06, 0.5),
      ]);
    case 'bracket': {
      // The base, the flange half a plate thick just outside its front edge, the flange's studs
      // pointing out (-z).
      const [f, t] = [flangeOf(p), FLANGE_T];
      const side = Array.from({ length: w * f }, (_, k) => new CylinderGeometry(STUD_R, STUD_R, STUD_H, SEG).rotateX(Math.PI / 2).translate((k % w) + 0.5, Math.floor(k / w) + 0.5, -t - STUD_H / 2)); // prettier-ignore
      return one([box(g, 0, g, w - g, PLATE, d - g), box(g, 0, -t, w - g, f, g), ...side, ...studs()]);
    }
    case 'jumper':
      // The plate, and its one stud in the middle (always drawn: no shared stud stands there).
      return one([box(g, 0, g, w - g, top, d - g), new CylinderGeometry(STUD_R, STUD_R, STUD_H, SEG).translate(w / 2, top + STUD_H / 2, d / 2)]); // prettier-ignore
    case 'hinge': {
      // The plate and its knuckle on the far side, as the real click hinges: two thin fingers
      // near the middle (60471), or one between them with its locking teeth on top (44567).
      const two = (p.fingers ?? 2) === 2;
      const spans = two ? [[0.5, 0.72], [1.28, 1.5]] : [[0.76, 1.24]]; // prettier-ignore
      const at = d + KNUCKLE_OUT;
      const fingers = spans.flatMap(([u0 = 0, u1 = 0]) => [
        new CylinderGeometry(KNUCKLE_R, KNUCKLE_R, u1 - u0, SEG)
          .rotateZ(Math.PI / 2)
          .translate((u0 + u1) / 2, KNUCKLE_Y, at),
        box(u0, 0, d - g, u1, PLATE, at),
        ...(two ? [] : [box(u0, KNUCKLE_Y, at - 0.2, u1, 0.67, at + 0.2), box(0.5, 0, d - g, 1.5, 0.44, d + 0.3)]),
      ]);
      return one([box(g, 0, g, w - g, top, d - g), ...fingers, ...studs()]);
    }
    default:
      throw new Error(`lego: no geometry for ${p.kind}`);
  }
}
