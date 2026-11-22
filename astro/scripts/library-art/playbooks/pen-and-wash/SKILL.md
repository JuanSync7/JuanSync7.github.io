---
name: pen-and-wash
description: Draw juansync.dev room and furniture art (shelves, wall bays, desks, panels, crests) as a monoline pen-and-wash elevation with hatching. Use for any illustration on the site except the framed pictures, which use graphite-pencil.
---

# Pen-and-wash elevation

Draw front-on (an elevation, no perspective) with even ink lines. Shadows are a soft wash with clean hatch lines over it. Everything is code in `kernel/`, and every drawing passes `checks/check_penwash.py` before it ships.

## Procedure

1. **Plan the light.** Light comes from the upper left. Write down, for each object, which faces are lit and which are in shadow, and where its cast shadow lands (lower right).
2. **Build with the writer.** `d = D(P)` from `kernel.primitives`, with `P = LIGHT` or `DARK` from `kernel.penwash`. Draw back to front: wall, recess, cast shadows, then the objects that cast them, then details on those objects.
3. **Use the components before drawing new ones.** `raised_panel`, `sconce`, `candle`, `crest` (with the SJ logo through `monogram`), `scaled` for resizing a component. Add a new component to `kernel/penwash.py` when it will be used twice.
4. **Shade with hatch fills only.** Give a shadow shape `fill="url(#hatch)"` (light shade) or `url(#hatch2)` (deep shade). Do not draw tone yourself. `wrap()` runs `washify`, which puts a soft tone under each hatched shape and masks its lines so they fade out inside the shadow.
5. **Give shadows room.** A drop shadow is the casting shape offset by about 4.5 px. Anything narrower than 3 px is drawn as one `hatch2`-coloured line, not a hatch fill.
6. **Export both themes.** `wrap(LIGHT, body, w, h, chalk=False)` and `wrap(DARK, body, w, h, chalk=True)`. The same drawing code produces both, so only palette values differ.
7. **Tile if it repeats.** A repeating section is `UW` wide (760 for the archive wall). Put any element that crosses the tile edge at `x = 0` and draw it again at `x = UW`, so each tile shows half.
8. **Check.** `python3 checks/check_penwash.py light.svg dark.svg --tile-width 760` (drop `--tile-width` for a single scene). Fix every FAIL in the kernel or the drawing, never in the check.
9. **Render.** Hand the SVGs to the art-render playbook. The page never loads these SVGs directly.

## Rules

1. Monoline weights only: hairline 0.5–0.8, line 0.9–1.3, accent 1.6–2.0. Never vary weight along a line.
2. Light from the upper left, everywhere. Shadow and darker bevels go right and down.
3. A shadow is drawn before the object that casts it, so hatching always sits behind the object.
4. Shade only with `hatch`, `hatch2` or `xhatch` fills. Never set a shadow colour or opacity by hand.
5. Colours come from the palettes in `kernel/penwash.py`. Orange (`signal`) only on flames, the J of the logo, a lamp rim or a highlighted label.
6. No glows or light haloes in either theme. Light sources show by a flame or rim, not a halo.
7. Hatch spacing stays at the kernel's values (5.374 and 2.687 px at 45°), so lines meet exactly at 760 px tile edges.
8. Dark mode is the same drawing in chalk: shadows go near-black (`shade`), never lighter.
9. A component that repeats is a function in the kernel, not copied drawing code.
10. The centre of attention stays dominant. Side content may show at most half of itself on screen.

## Checks (`checks/check_penwash.py`)

| Check | Proves |
|---|---|
| P1 monoline weights | rule 1 (the logo keeps its own scaled weights) |
| P2 palette | rule 5 |
| P3 shadow + hatching | rule 4, every hatched shape has its tone and fade mask |
| P4 tile-safe hatching | rule 7 |
| P5 shadows behind | rule 3 |
| P6 seamless tile | step 7, rendered edge columns join like interior columns |
| P7 theme parity | step 6 |

## Kernel

- `kernel/primitives.py` holds `D`, the SVG writer (`rect`, `line`, `poly`, `circle`, `path`, `text`).
- `kernel/penwash.py` holds `LIGHT`, `DARK`, `defs`, `washify`, `wrap`, `scaled`, `raised_panel`, `candle`, `sconce`, `laurel`, `monogram`, `crest`.
- `kernel/scenes.py` holds the archive wall section and desk scene. Build them with `python3 -m kernel.scenes OUT_DIR`.
