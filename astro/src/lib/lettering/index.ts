/** ISO 3098 type B lettering, as a library: the characters as pen strokes (`GLYPHS`), the
 *  standard's proportions (`TYPE_B`, `HEIGHTS_MM`), text set as strokes (`textStrokes`) for a
 *  plotter, a canvas or line work, and the ink as outlines (`outlines`). `font.ts` builds the
 *  OpenType font from them; it needs opentype.js, so it is imported only by build scripts.
 *  See README.md. */
export { arc, GLYPHS, type Point, type Stroke } from './glyphs';
export { glyph, HEIGHTS_MM, SPACE, textStrokes, TYPE_B, type Glyph } from './metrics';
export { area, outlines } from './outline';
