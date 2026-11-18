import opentype from 'opentype.js';
import { GLYPHS } from './glyphs';
import { glyph, SPACE, TYPE_B } from './metrics';
import { outlines } from './outline';

/** The lettering as an OpenType font (CFF outlines), for any page or program to set text in.
 *  1000 units to the em; capitals stand 700 tall, so a font size of h / 0.7 gives capitals h
 *  high. Lower case maps to the capitals. Deterministic: the same glyphs give the same bytes. */

export const FAMILY = 'ISO Lettering B';
export const UNITS_PER_EM = 1000;
/** Font units per grid unit: capitals (10 units) are 700 font units tall. */
export const UNIT = 70;
/** Capital height as a fraction of the font size. */
export const CAP_HEIGHT = (TYPE_B.h * UNIT) / UNITS_PER_EM;

function path(ch: string): { path: opentype.Path; advance: number } | undefined {
  const g = glyph(ch);
  if (!g) return undefined;
  const p = new opentype.Path();
  for (const poly of outlines(g.strokes, TYPE_B.d)) {
    poly.forEach(([x, y], k) => (k === 0 ? p.moveTo(x * UNIT, y * UNIT) : p.lineTo(x * UNIT, y * UNIT)));
    p.close();
  }
  return { path: p, advance: g.advance * UNIT };
}

export function buildFont(version = '1.000'): ArrayBuffer {
  const glyphs = [
    new opentype.Glyph({ name: '.notdef', unicode: 0, advanceWidth: SPACE * UNIT, path: new opentype.Path() }),
    new opentype.Glyph({ name: 'space', unicode: 32, advanceWidth: SPACE * UNIT, path: new opentype.Path() }),
  ];
  const chars = Object.keys(GLYPHS).sort();
  for (const ch of chars) {
    const made = path(ch);
    if (!made) continue;
    const code = ch.codePointAt(0) ?? 0;
    const lower = ch.toLowerCase() !== ch ? ch.toLowerCase().codePointAt(0) : undefined;
    glyphs.push(
      new opentype.Glyph({
        name: `uni${code.toString(16).toUpperCase().padStart(4, '0')}`,
        unicode: code,
        unicodes: lower === undefined ? [code] : [code, lower],
        advanceWidth: made.advance,
        path: made.path,
      }),
    );
  }
  const font = new opentype.Font({
    familyName: FAMILY,
    styleName: 'Regular',
    unitsPerEm: UNITS_PER_EM,
    ascender: 800,
    descender: -200,
    designer: 'Juan Kok, drawn with Claude',
    description: 'ISO 3098 type B lettering, drawn from the standard’s construction rules.',
    version,
    glyphs,
  });
  return stamp(font.toArrayBuffer(), DATE);
}

/** The date written into the font (seconds since 1904, as OpenType counts): the day the
 *  lettering was first drawn, so the same glyphs always give the same bytes. */
const DATE = Date.UTC(2026, 10, 16) / 1000 + 2082844800;

function sum(view: DataView, from: number, length: number): number {
  let s = 0;
  for (let k = 0; k < length; k += 4) s = (s + (from + k + 4 <= view.byteLength ? view.getUint32(from + k) : 0)) >>> 0;
  return s;
}

/** opentype.js stamps the build time into the head table; set both dates to `when` and redo
 *  the head table's checksum and the font's checksum adjustment. */
function stamp(buffer: ArrayBuffer, when: number): ArrayBuffer {
  const v = new DataView(buffer);
  const tables = v.getUint16(4);
  for (let t = 0; t < tables; t++) {
    const rec = 12 + 16 * t;
    if (String.fromCharCode(...[0, 1, 2, 3].map((k) => v.getUint8(rec + k))) !== 'head') continue;
    const [at, length] = [v.getUint32(rec + 8), v.getUint32(rec + 12)];
    for (const field of [20, 28]) {
      v.setUint32(at + field, Math.floor(when / 2 ** 32));
      v.setUint32(at + field + 4, when % 2 ** 32);
    }
    v.setUint32(at + 8, 0);
    v.setUint32(rec + 4, sum(v, at, length));
    v.setUint32(at + 8, (0xb1b0afba - sum(v, 0, buffer.byteLength)) >>> 0);
  }
  return buffer;
}
