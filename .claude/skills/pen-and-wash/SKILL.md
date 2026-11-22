---
name: pen_and_wash
description: Use when a baked figure for juansync.dev is drawn or changed in pen and wash (a room, furniture, shelves, wall bays, a desk, panels, a crest), or when its outlines, wash or hatching are wrong.
---

# Pen-and-wash elevation

You draw a front-on elevation (no perspective) in monoline ink with a soft wash under clean hatching, as code
that writes SVG. The drawing becomes a baked figure: `art_render` bakes it, and the site registers and audits it
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
5. **Shade with hatch fills only** (`url(#hatch)`, `url(#hatch2)`): `wrap()` runs `washify`, which lays the wash
   under each hatched shape and masks its lines by it (R-BAKE-1, R-BAKE-2). No words in the drawing (R-BAKE-8).
6. **Both themes, one drawing:** `wrap(LIGHT, ..., chalk=False)` and `wrap(DARK, ..., chalk=True)`, no glow
   (R-BAKE-4). Tile at the unit width, with a part that crosses the edge drawn at both edges (R-BAKE-3).
7. **Anchors.** Name in constants where every live part will stand (rows, plaque, rest, spot, flames) and draw
   with those constants, so the manifest's anchors and the drawing are one source (R-FIG-33).
8. **Check:** `python3 checks/check_penwash.py light.svg dark.svg [--tile-width W]`, every line PASS.
9. **Hand over** to `art_render`, then answer `references/look.md`.

## When to ask
Only for the brief (step 1) and for a token the palette lacks. Everything else follows the rules.

## Hand-over
The objects drawn and any added, the anchors written, the check output, the `references/look.md` answers with the sheet
read, and what you did not verify.

## Layout
`references/rules.md`, `references/look.md`, `kernel/` (`INDEX.md` first), `checks/`, `examples/`. The scene files that place the
components (the site's `kernel/scenes.py` and `kernel/plate.py`) belong to the project, not to this playbook.
