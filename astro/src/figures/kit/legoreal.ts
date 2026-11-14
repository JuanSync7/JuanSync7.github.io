import { BufferAttribute, BufferGeometry } from 'three';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import data from './data/ldraw.json';
import type { RealParts } from './legoscene';
import type { Piece } from './legoset';

/** Real LEGO geometry: each catalogue shape drawn as the part it stands for, from the LDraw Parts
 *  Library (`npm run lego:ldraw` fits and packs them into `data/ldraw.json`). A shape with no
 *  real part keeps its hand-made body. Pages that draw these credit the library (`LDRAW_CREDIT`). */

export const LDRAW_CREDIT: string = data.credit;

interface Packed {
  p: string;
  i: string;
}
interface Real extends Packed {
  part: string;
  own?: string[];
}
const PARTS: Record<string, Real | undefined> = data.parts;
const Q = 400; // positions are stored on a 1/400-stud grid

const bytes = (b64: string): ArrayBuffer => {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let k = 0; k < s.length; k++) out[k] = s.charCodeAt(k);
  return out.buffer;
};

function unpack(e: Packed): BufferGeometry {
  const q = new Int16Array(bytes(e.p));
  const pos = new Float32Array(q.length);
  for (let k = 0; k < q.length; k++) pos[k] = (q[k] ?? 0) / Q;
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setIndex(new BufferAttribute(new Uint16Array(bytes(e.i)), 1));
  // Smooth across the facets of a stud or a curve, sharp at every real edge.
  const out = toCreasedNormals(geo, Math.PI / 5);
  geo.dispose();
  return out;
}

const realKey = (p: Piece): string => [p.kind, p.w, p.d, p.h, p.hand ?? ''].join('|');

/** The real part a piece is, if the catalogue has one for its shape. */
export const partOf = (p: Piece): string | null => PARTS[realKey(p)]?.part ?? null;

/** The piece's body as the real part, in the piece's own frame; null for a hand-made shape. */
export function realBody(p: Piece): BufferGeometry | null {
  const e = PARTS[realKey(p)];
  return e ? unpack(e) : null;
}

/** The studs (local cells "i,j") a real part draws itself: hollow studs, kept in its body. */
export const ownStuds = (p: Piece): Set<string> => new Set(PARTS[realKey(p)]?.own ?? []);

/** A real stud: centred on its cell, standing on y = 0. */
export const realStud = (): BufferGeometry => unpack(data.stud);

/** Everything `legoModel` needs to draw pieces as real parts. */
export const REAL: RealParts = { body: realBody, own: ownStuds, stud: realStud };
