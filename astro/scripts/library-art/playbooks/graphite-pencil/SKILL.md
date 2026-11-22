---
name: graphite-pencil
description: Draw the framed pictures on juansync.dev (landscapes and other scenes inside pen-and-wash frames) as graphite pencil drawings with tonal depth and paper grain. Use only for pictures inside frames; the room around them uses pen-and-wash.
---

# Graphite pencil drawing

A picture is built in tone, like real pencil: soft gradients with paper grain, highlights lifted out with an eraser, and edges that appear where two values meet. It is never built from outlines. All of it runs through `kernel/graphite.py`, and every picture passes `checks/check_graphite.py`.

## Procedure

1. **Frame it with pen-and-wash.** The frame (`etching2` in `kernel/scenes.py`) belongs to the room. Call `pencil_picture(d, x, y, w, h, seed)` for the inside.
2. **Block in depth planes, far to near.** Sky, then the farthest range (palest, most blurred), far range, a band of mist that fades to the paper, near range, treeline, water, foreground. Each plane is darker and sharper than the one behind it.
3. **Model each form with three values.** A lit side, a half-lit side and a shadow side, plus a core shadow where the shadow side meets the light. That darker band defines the edge, not a line.
4. **Lift highlights.** Clouds, snow, water glints and paths are paper colour on light paper, or chalk on dark paper, laid over the tone like an eraser.
5. **Shrink with distance.** Trees, grass and ripples are smaller and fainter far away, and larger and darker near you.
6. **Cast shadows away from the light.** Every standing object (tree, cabin, rock) gets a soft shadow to the lower right.
7. **Strokes last, and soft.** Grass, bark and leaf marks go in a `graphiteLine` group. Never draw an unfiltered stroke inside a picture.
8. **Burn, dodge, vignette.** Darken the corners, lift the sun area and the lit slopes, then let the drawing fade towards its margins.
9. **Check.** `python3 checks/check_graphite.py scene.svg` and again with `--background "#16191E"` for dark mode. Fix every FAIL in the kernel.
10. **Render.** Hand the file to the art-render playbook, which bakes the picture so the browser never computes its grain.

## Rules

1. No outlines. An edge is two values meeting. A darker core shadow is the strongest edge allowed.
2. Every mark inside a picture sits under a graphite filter (`graphite` for tone, `graphiteLine` for strokes).
3. Gradients use at least five stops, so tone never bands.
4. Distance moves towards the paper colour in both themes: lighter on cream, darker on dark.
5. Use the full value range. The darkest accent sits in the foreground, the lightest is lifted paper.
6. Light from the upper left, the same as the room around the picture.
7. Foreground objects are backed with solid paper, so nothing behind them shows through the grain.
8. Highlights are lifted (paper on light, chalk on dark), never drawn as white lines.
9. Change the scene with `seed` and new layers in the kernel. Do not hand-edit generated SVG.

## Checks (`checks/check_graphite.py`)

| Check | Proves |
|---|---|
| G1 no vector-crisp marks | rule 2 |
| G2 no hard lines | rule 1, sharp steps cover under 1.2% of the picture at 3x zoom |
| G3 full value range | rule 5 |
| G4 paper grain present | the grain filter is working |
| G5 depth by value | rule 4 |

## Kernel

- `kernel/graphite.py` holds `pencil_picture` (the layered landscape) and its helpers.
- The filters (`graphite`, `graphiteLine`, `soft1`, `soft2`) are defined once in `kernel/penwash.defs`.
