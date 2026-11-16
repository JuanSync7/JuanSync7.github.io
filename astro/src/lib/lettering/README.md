# ISO 3098 lettering

Lettering for engineering drawings, ISO 3098 type B, vertical. The characters are pen strokes
drawn from the standard's construction rules, not traced from any existing font, so it carries
no other font's licence. This folder is the one source: it lives in the experience vault's
playbook `Playbooks/lettering`, and each project holds a synced copy it never edits (R-LET-4).

## What is in it

| File | What it holds |
|---|---|
| `glyphs.ts` | `GLYPHS`: each character as pen strokes along its centre line, on the type B grid (one unit = the line width d = h/10; capitals 10 tall; a standard capital 6 wide). `arc` draws a bowl that always reaches its top, bottom and sides. |
| `metrics.ts` | `TYPE_B` (h 10, d 1, character spacing a 2, word spacing e 6, baselines b 14, slant 15), `HEIGHTS_MM` (1.8 to 20), `glyph(ch)` (a character set out with its spacing), `textStrokes(text)` (a line of text as strokes, for a plotter or a canvas of lines). |
| `outline.ts` | `outlines(strokes, width)`: the pen's ink as closed outlines, every segment a round-ended bar wound the same way. |
| `font.ts` | `buildFont()`: the OpenType font (CFF outlines), with a fixed date. Build scripts only: it needs `opentype.js`. |
| `index.ts` | Everything above except `font.ts`, safe to import in a browser. |

The character set: A to Z, 0 to 9 and `- . , : / ( ) = + ' " # ! ? %` with the diameter, plus-minus,
degree and multiplication signs, 55 in all. Lower case is set as capitals, as drawings are lettered.

## Using it in a project

- **As a font.** Build it into the project (`lettering:build`), declare it with `@font-face` as
  family `ISO Lettering B`, and set text in it like any font: you type ordinary characters and
  they render in the lettering. Capitals stand 0.7 of the font size, so for capitals h high set
  `font-size: calc(h / 0.7)`. On a canvas, load it first (`document.fonts.load("10px 'ISO Lettering B'")`).
- **As strokes.** `textStrokes('SECTION A-A')` gives polylines in grid units from the baseline's
  left end; scale by h/10 for millimetres. Only for text that must be line work (R-LET-5).

On juansync.dev: the copy is `astro/src/lib/lettering`, the font `astro/public/fonts/iso-lettering-b.otf`,
the token `--nt-drafting`, and `npm run lettering:sync -- <vault>` brings changes in.

## Changing it

1. Edit the kernel here, in the vault (never a project's copy).
2. Sync it into the project, then `lettering:build` and `lettering:sheet`; read the specimen.
3. `lettering:check` fails if a character is missing, a capital or figure does not stand
   exactly 0 to 10, a standard capital is not 6 wide, or the committed font is not byte for byte
   what the strokes build. `lettering:sync -- <vault> --check` fails if the copy differs from here.

Do not copy shapes from another font (osifont is GPL): draw from the standard's rules (R-LET-2).
