---
name: art-render
description: Turn juansync.dev pen-and-wash and graphite drawings into what the page loads, with level of detail for far, normal and zoomed-in views and performance budgets. Use after either drawing playbook and before anything ships to the site.
---

# Render and level of detail

The browser never runs the art's effects (grain, chalk, blur, masks). They are expensive and repaint on every scroll, carousel move or zoom. Bake every drawing once at build time into an image pyramid. The page picks a level by how large the drawing appears on screen.

| Level | File | When it shows | Why |
|---|---|---|---|
| Far | `name@1x.webp` | smaller than 0.75 CSS px per drawing px | Lanczos-averaged from @4x, so fine hatching turns into tone instead of moire |
| Normal | `name@2x.webp` | 0.75–1.5x, and DPR-2 screens | everything baked, sharp on retina |
| Near | `name@4x.webp` | zoom, pinch, DPR-3 | fetched lazily, only when someone zooms in |
| Print | `name-print.svg` | print and archive only | vector lines, pictures embedded at 4x, no noise filters |

## Procedure

1. **Build the sources.** `python3 -m kernel.scenes OUT` from the drawing playbooks.
2. **Export.** `python3 -m kernel.render SRC.svg OUT_DIR NAME --tile-width W --background "#F3ECDF"` for light, and again with `"#16191E"` for dark. It renders @4x once, Lanczos-downsamples to @2x and @1x, and writes the print SVG.
3. **Check.** `python3 checks/check_render.py SRC.svg OUT_DIR NAME --tile-width W`. Fix a failing budget by simplifying the drawing, never by raising the budget without a reason written in the commit.
4. **Serve by resolution.** For an `<img>`, use `srcset_html()` from `kernel/render.py`: `src` is @2x, `srcset` lists 1x, 2x and 4x, with `loading="lazy"` and `decoding="async"`, and the width and height are set so nothing shifts. On juansync.dev a plate that follows the theme is a token instead: `--pp-lib-shelf-art: image-set(url(…-1x.webp) 1x, url(…-2x.webp) 2x)` in `tokens/paper.css`, with the dark plate in both night blocks. Leave @4x off a page that never draws the plate above its design size, and keep it in the export for zoom views and print.
5. **Repeat tiles by reference.** The carousel reuses one URL per tile type. Preload only the neighbouring tiles.
6. **Animate on the compositor.** Move things with `transform` and `opacity` only, never `left`, `top`, `width` or `height`. For a path that arcs, nest one element per axis (across, down, turn), each with its own easing. Read every duration from the stylesheet's tokens at run time, so the script's timeline and the CSS never disagree.
7. **Keep live UI as HTML.** Binders, labels and buttons stay HTML on top of the baked images, so they stay sharp and accessible at every level.
8. **Mount live figures late.** A canvas figure sizes itself from its box on screen, transforms included. Mount it only after the transform that grows its box has ended.

## Rules

1. The page loads images, never the source SVG with filters.
2. One render per drawing at the top scale. Lower levels are Lanczos downsamples of it.
3. Every level is an exact multiple of the tile width, so tiles meet without a seam.
4. Budgets per tile: @1x ≤ 120 KB, @2x ≤ 400 KB, @4x ≤ 1200 KB (lazy), print SVG ≤ 60 KB gzipped without pictures.
5. Pictures inside print SVGs are baked at 4x their drawn size.
6. Animation uses `transform` and `opacity` only.
7. Interactive and readable content is HTML above the art, never baked into it.
8. A timeline reads its durations from the same tokens the CSS uses.
9. A canvas figure is mounted only once its box is at full size.

## Checks (`checks/check_render.py`)

| Check | Proves |
|---|---|
| R1 pyramid budgets | rule 4 |
| R2 pyramid tiling | rule 3 |
| R3 near detail | zooming to @4x gains real detail over @2x |
| R4 far view | rule 2, @1x is averaged (no moire) |
| R5 no live effects | rule 1 for the print SVG, plus its size |
| R6 print parity | print looks like what the page shows |
| R7 picture sharpness | rule 5 |

## Lessons

- The prototype's binder flight moved `left` and `top`. On the site it is three nested transforms (across, down, the 3D turn), which also gives the arc for free (22 Nov 2026).
- A cover figure mounted while the paper was still scaled down drew at a tenth of its size and stayed blurry. Rule 9 came from that.
