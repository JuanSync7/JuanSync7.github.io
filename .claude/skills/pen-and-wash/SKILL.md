---
name: pen_and_wash
description: Use when a baked figure for juansync.dev is drawn or changed in pen and wash (a room, furniture, shelves, wall bays, a desk, panels, a crest) or a framed picture in it is drawn in pen and ink, or when outlines, wash, hatching or the hand are wrong.
# Reached through web-design-agent > Figures and drawings, not listed on its own.
disable-model-invocation: true
---

# Pen-and-wash elevation, pen-and-ink pictures

You draw a front-on elevation (no perspective) in monoline ink with a soft wash under clean hatching, as code
that writes SVG. A framed picture in it is the same pen without the wash (pen and ink), drawn by a free hand,
because it is a painting of a place and not a built thing (R-BAKE-15). The dark theme draws both as chalk on the
board (R-BAKE-13). The drawing becomes a baked figure: `art_render` bakes it, and the site registers and audits it
(R-FIG-33). The rules are in `references/rules.md` (generated from [[Notes/Decks/Baked art]]: never edit it), the judgment
questions in `references/look.md`, the API in `references/kernel.md`. You change neither `kernel/` nor `checks/` to turn a result
green: a kernel change is its own reviewed change, made here and synced to the site.

## Steps

1. **Brief.** Name the objects, wall by wall, and the tile width if it repeats. A one-word brief gets an
   inventory proposed and a yes before drawing (R-FIG-27).
2. **Plan the light.** Upper left, for every object: lit faces, shadow faces, where each cast shadow lands
   (R-BAKE-11).
3. **Palette.** `LIGHT` and `DARK` from `kernel.penwash`; every colour comes from the site's tokens through
   `kernel/tokens.py`. A colour the tokens lack is a token added first, never a literal (R-FIG-33). The signal
   only on a flame, the logo's J, a lamp rim or the newest label (R-BAKE-12).
4. **Draw back to front** with `D(P)`: wall, recess, cast shadows, then the shapes that cast them, then their
   details (R-BAKE-2). Reuse the components (`raised_panel`, `sconce`, `candle`, `crest`, `scaled`); a part used
   twice becomes a kernel function in a separate change.
5. **Shade with hatching only, in tiers** (R-BAKE-16): the pattern fills (`url(#hatch)`, `url(#hatch2)` deep,
   `url(#xhatch)` deepest), which `wrap()` turns into clean ruled hatching on the plate's grid, or
   `hatching.hatch(d, shape, tone, hand="ruled", wash=False, clean=True, tile=W)` for a shadow you shape
   yourself. A shade is hatched or washed, never both (R-BAKE-1).
   Lighter is fewer lines, never far apart; darker is closer and finer; only tone 5 crosses. A shadow is a gradient
   (`grade`, `feather`), and lines on a round surface bend (`curve`). No words in the drawing (R-BAKE-8).
5b. **A picture** is `penpicture.pen_picture(d, x, y, w, h, scene, seed)`: a few real objects with their parts,
   three-quarter, each shaped then shaded at the one picture angle, free hand, no wash (R-BAKE-15 to 17). A new
   scene is a function in `penpicture.SCENES` with its far and near boxes in `BANDS`.
6. **Both themes, one drawing:** `wrap(LIGHT, ..., chalk=False)` and `wrap(DARK, ..., chalk=True)`, no glow
   (R-BAKE-4). Tile at the unit width, with a part that crosses the edge drawn at both edges (R-BAKE-3).
7. **Anchors.** Name in constants where every live part will stand (rows, plaque, rest, spot, flames) and draw
   with those constants, so the manifest's anchors and the drawing are one source (R-FIG-33).
8. **Check:** `python3 checks/check_penwash.py light.svg dark.svg [--tile-width W]`, every line PASS, and
   `--selftest light.svg` (each new rule still catches its breakage).
9. **Hand over** to `art_render`, then answer `references/look.md`.

## When to ask
Only for the brief (step 1) and for a token the palette lacks. Everything else follows the rules.

## Hand-over
The objects drawn and any added, the anchors written, the check output, the `references/look.md` answers with the sheet
read, and what you did not verify.

## Layout
`references/rules.md`, `references/look.md`, `kernel/` (`INDEX.md` first), `checks/`, `examples/`. The scene files that place the
components (the site's `kernel/scenes.py` and `kernel/plate.py`) belong to the project, not to this playbook.
