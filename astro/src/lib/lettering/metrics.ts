import { GLYPHS, type Point, type Stroke } from './glyphs';

/** ISO 3098 lettering type B, vertical, in grid units (one unit is the line width d = h/10):
 *  capitals 10 tall, line width 1, characters 2 apart (ink to ink), words 6 apart, baselines at
 *  least 14 apart. Heights in mm come from the series 1.8, 2.5, 3.5, 5, 7, 10, 14, 20. */
export const TYPE_B = { h: 10, d: 1, a: 2, e: 6, b: 14, slant: 15 } as const;
export const HEIGHTS_MM = [1.8, 2.5, 3.5, 5, 7, 10, 14, 20] as const;

export interface Glyph {
  /** Strokes moved so the ink starts `a/2` from the left of the character's box. */
  strokes: Stroke[];
  /** The character's advance: its ink, plus half the spacing on each side. */
  advance: number;
}

function inkRange(strokes: Stroke[]): [number, number] {
  const xs = strokes.flat().map(([x]) => x);
  return [Math.min(...xs), Math.max(...xs)];
}

/** A character set out for typesetting, or undefined when the lettering has no such character.
 *  Lower case is set as capitals: drawings are lettered in capitals. */
export function glyph(ch: string): Glyph | undefined {
  const strokes = GLYPHS[ch] ?? GLYPHS[ch.toUpperCase()];
  if (!strokes) return undefined;
  const [lo, hi] = inkRange(strokes);
  const shift = TYPE_B.a / 2 + TYPE_B.d / 2 - lo;
  return {
    strokes: strokes.map((s) => s.map(([x, y]): Point => [x + shift, y])),
    advance: hi - lo + TYPE_B.d + TYPE_B.a,
  };
}

/** The advance of a space: words stand `e` apart, ink to ink. */
export const SPACE = TYPE_B.e - TYPE_B.a;

/** A line of text as pen strokes, in grid units from its baseline's left end; scale by h/10 for
 *  millimetres. Characters the lettering lacks are left as a space. */
export function textStrokes(text: string): { strokes: Stroke[]; width: number } {
  const strokes: Stroke[] = [];
  let x = 0;
  for (const ch of text) {
    const g = ch === ' ' ? undefined : glyph(ch);
    if (g) strokes.push(...g.strokes.map((s) => s.map(([px, py]): Point => [px + x, py])));
    x += g ? g.advance : SPACE;
  }
  return { strokes, width: x };
}
