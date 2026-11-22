---
name: graphite_pencil
description: Use when a framed picture inside a baked figure for juansync.dev is drawn or changed in graphite pencil (a landscape, an etching on a wall), or when its lines read hard or its depth reads flat.
---

# Graphite pencil picture

You draw a picture as graphite: depth from value, blended, with no hard line (R-BAKE-5). It sits inside a
pen-and-wash plate (`pen_and_wash`) and is baked with it (`art_render`). The rules are in `references/rules.md` (generated
from [[Notes/Decks/Baked art]]), the questions in `references/look.md`, the API in `references/kernel.md`. You change neither
`kernel/` nor `checks/` to pass.

## Steps

1. **Bands.** Split the picture into far, middle and near, and give each its value range: the far band closest
   to the paper colour, the near band farthest from it, in both themes (R-BAKE-6).
2. **Tone before edges.** Build each form from eased multi-stop gradients and the grain filter; an edge is a
   darker band along the shadow side, never a drawn line (R-BAKE-5).
3. **A crisp stroke only for depth:** where it shows the third dimension (a near trunk's edge), and still under
   the graphite filter (R-BAKE-5).
4. **Draw it with** `pencil_picture(d, x, y, w, h, ...)` inside the plate's frame; colours from the palette only
   (R-FIG-33).
5. **Check:** `python3 checks/check_graphite.py PLATE.svg [--background HEX]`, with the theme's paper colour for
   the dark plate; every line PASS.
6. **Hand over** to `art_render` (it bakes pictures at `PICTURE_SCALE`), then answer `references/look.md`.

## When to ask
Only for what the picture shows. The look follows the rules.

## Hand-over
The bands and their value ranges, the check output in both themes, the `references/look.md` answers with a 4x crop read.

## Layout
`references/rules.md`, `references/look.md`, `kernel/` (`INDEX.md` first), `checks/`, `examples/`.
