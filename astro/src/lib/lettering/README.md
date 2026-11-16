# ISO 3098 lettering library

Lettering for engineering drawings, ISO 3098 type B, vertical, as a library that any drawing,
slide or page can reuse. The characters are pen strokes drawn from the standard's construction
rules, not traced from any existing font, so the whole thing is under this repository's MIT
licence.

## What is in it

| File | What it holds |
|---|---|
| `glyphs.ts` | `GLYPHS`: each character as pen strokes along its centre line, on the type B grid (one unit = the line width d = h/10; capitals 10 tall; a standard capital 6 wide). `arc` draws a bowl that always reaches its top, bottom and sides. |
| `metrics.ts` | `TYPE_B` (h 10, d 1, character spacing a 2, word spacing e 6, baselines b 14, slant 15°), `HEIGHTS_MM` (1.8 … 20), `glyph(ch)` (a character set out with its spacing), `textStrokes(text)` (a line of text as strokes, for a plotter, a canvas or a drawing's line work). |
| `outline.ts` | `outlines(strokes, width)`: the pen's ink as closed outlines, every segment a round-ended bar wound the same way. |
| `font.ts` | `buildFont()`: the OpenType font (CFF outlines). Build scripts only: it needs `opentype.js`. |
| `index.ts` | Everything above except `font.ts`, safe to import in the browser. |

The character set: A–Z, 0–9 and `- . , : / ( ) = + ' " # ! ? %` with `Ø ± ° ×`, 55 in all.
Lower case is set as capitals, as drawings are lettered.

## Using it

- **As a font.** `astro/public/fonts/iso-lettering-b.otf`, family `ISO Lettering B`, token
  `--nt-drafting`. Capitals stand 0.7 of the font size, so for capitals h high set
  `font-size: calc(h / 0.7)`. Pick h from `HEIGHTS_MM` (3.5 for labels and dimensions on A3,
  5 or 7 for titles, 2.5 for notes).
- **As strokes.** `textStrokes('SECTION A-A')` gives polylines in grid units from the baseline's
  left end; scale by h/10 for millimetres. Use it where text has to be line work, never as a
  replacement for real text on a page.
- **In another project.** Copy this folder and `scripts/lettering/`; the only dependency is
  `opentype.js` for the font build.

## Changing it

1. Edit `glyphs.ts` (or the proportions in `metrics.ts`).
2. `npm run lettering:build` writes the font; `npm run lettering:sheet` writes
   `figures-out/lettering-specimen.png`. Read the sheet.
3. `npm run lettering:check` (part of `npm run check`) fails if a character is missing, a
   capital or figure does not stand exactly 0 to 10, a standard capital is not 6 wide, or the
   committed font is not byte for byte what the glyphs build. The font carries a fixed date, so
   the same glyphs always give the same bytes.

Do not copy shapes from another font (osifont is GPL): draw from the standard's rules.
