import { EdgesGeometry, Group, LineBasicMaterial, LineSegments, Mesh } from 'three';
import type { NightKey } from '../../styles/tokens/palette';
import { hexOf } from './ink';
import { body } from './legomesh';
import type { Piece } from './legoset';
import { placement, plastic, TONE } from './legoscene';
import { compose } from './legopose';
import { PROFILE, ROT, type Shape } from './legoswap';

/** The planning views of a LEGO model, for review only (`npm run lego:sheet`): the smooth
 *  isometric model, one solid per shape, and its wireframe. They never appear on a page. */

/** The body a shape would be as one solid: the plan the LEGO is swapped from. */
function solidOf(s: Shape): Piece[] {
  const at = { y: 0, rot: 0 as const, tone: s.kind === 'sub' ? 'ink' : s.tone };
  switch (s.kind) {
    case 'block':
      return [{ ...at, kind: 'brick', x: s.x, y: s.y, z: s.z, w: s.w, d: s.d, h: s.h }];
    case 'ramp': {
      const { run, h } = PROFILE[s.profile];
      return [{ ...at, kind: s.profile, x: s.x, y: s.y, z: s.z, w: run, d: s.wid, h, rot: ROT[s.dir] }];
    }
    case 'wedge':
      return [
        { ...at, kind: 'wedge', x: s.x, y: s.y, z: s.z, w: s.len, d: s.wid, h: 1, hand: s.hand, rot: ROT[s.dir] },
      ];
    case 'round': {
      const cyl: Piece[] =
        s.h > 0 ? [{ ...at, kind: 'round', x: s.x, y: s.y, z: s.z, w: s.size, d: s.size, h: s.h }] : [];
      return s.cap ? [...cyl, { ...at, kind: 'dome', x: s.x, y: s.y + s.h, z: s.z, w: 2, d: 2, h: 3 }] : cyl;
    }
    case 'technic':
      return [{ ...at, kind: 'brick', x: s.x, y: s.y, z: s.z, w: s.len, d: s.rows, h: 3 }];
    case 'part':
      return [{ ...at, kind: s.part, x: s.x, y: s.y, z: s.z, w: s.w, d: s.d, h: s.h, rot: ROT[s.dir ?? 'x+'], ...(s.hand ? { hand: s.hand } : {}) }]; // prettier-ignore
    case 'wheel':
      return [{ ...at, kind: 'wheel', x: s.x, z: s.z, w: 0, d: s.width, h: 0, cy: s.cy, r: s.r }];
    case 'axle':
      return [{ ...at, kind: 'axle', x: s.x, z: s.z, w: 0, d: s.len, h: 0, cy: s.cy, r: 0.12 }];
    case 'sub':
      return s.shapes.flatMap(solidOf).map((p) => ({ ...p, pose: compose(s.pose, p.pose) }));
  }
}

/** The smooth isometric model: each shape one solid, no studs, no seams. */
export function smoothModel(shapes: Shape[], own: (d: () => void) => void): Group {
  const g = new Group();
  for (const p of shapes.flatMap(solidOf)) {
    for (const part of body(p, { studs: false, gap: 0 })) {
      const m = new Mesh(part.geo, plastic());
      m.material.color.set(hexOf(part.tone ? TONE[part.tone] : p.tone));
      m.applyMatrix4(placement(p));
      own(() => {
        part.geo.dispose();
        m.material.dispose();
      });
      g.add(m);
    }
  }
  return g;
}

/** The wireframe plan: the smooth model's hard edges as lines in one tone. */
export function wireModel(shapes: Shape[], tone: NightKey, own: (d: () => void) => void): Group {
  const g = new Group();
  const mat = new LineBasicMaterial({ color: hexOf(tone) });
  own(() => mat.dispose());
  for (const p of shapes.flatMap(solidOf)) {
    for (const part of body(p, { studs: false, gap: 0 })) {
      const e = new LineSegments(new EdgesGeometry(part.geo, 28), mat);
      e.applyMatrix4(placement(p));
      own(() => {
        e.geometry.dispose();
        part.geo.dispose();
      });
      g.add(e);
    }
  }
  return g;
}
