# Kernel index: read this, not the code under it

Runs from a project's synced copy (the site's `astro/scripts/library-art/kernel/`), where these files sit in one
package with `graphite_pencil/kernel` and `art_render/kernel`.

| Call | What it does | Gotcha |
|---|---|---|
| `tokens.palette(theme)` | `{key: hex}` for `light` or `dark`, read from the site's `tokens/paper.css` | only `--name: light-dark(#a, #b);` in the first `:root` block; anything else is an error |
| `tokens.digest()` | sha256 of the raw declarations it reads | the site's plate audit computes the same digest; a mismatch is a stale plate |
| `primitives.D(P)` | the SVG writer: `rect`, `line`, `poly`, `circle`, `path`, `text` | `text` exists but words never go into a plate (R-BAKE-8) |
| `penwash.LIGHT`, `penwash.DARK` | the two palettes plus non-colour knobs (`shadeK`, `halo`, `led`) | colours come from `tokens`; never add a hex here |
| `penwash.wrap(P, body, w, h, chalk)` | the finished SVG: defs, `washify`, the chalk filter in dark | `chalk=True` for dark only |
| `penwash.washify(P, body)` | wash under each hatched shape, lines masked by it | runs inside `wrap`; do not call twice |
| `penwash.scaled(d, cx, cy, k, fn)` | draws `fn` scaled about a point | stroke widths scale too; keep `k` near 1.25 to 1.4 |
| `penwash.raised_panel(d, x, y, w, h, t)` | a slab standing proud of the wall | its cast shadow is drawn first |
| `penwash.sconce(d, c, y, P)`, `candle(d, x, base_y)` | a twin-arm candle sconce, a candle | flames are the signal |
| `penwash.flame(cx, cy, k, sgn)` | where a sconce candle's flame sits on the plate | for the manifest's anchors |
| `penwash.crest(d, c, cy, P)`, `monogram(...)`, `laurel(...)` | the shield with the SJ mark and laurel | the logo keeps its own scaled weights |
| `penwash.archive_box(d, x, base)`, `bookend(d, x, base)`, `book_stack(d, x, base)` | shelf fillers, foot on `base`, shadow falling right by `SHADOW` | drawn as their own sprite plates, rendered with no background so they keep their transparency |
| `hatching.TONES` | the five tone tiers: (spacing, width, crossed), lighter is farther apart, darker closer and finer, only 5 crosses | the room's patterns (`hatch0`, `hatch`, `hatch2`) are tiers 1, 2 and 4 at tile-safe spacings |
| `hatching.hatch(d, shape, tone, ang, hand, grade, feather, curve, clean, scale, dash, wash)` | explicit hatch lines clipped to a polygon by geometry, over a wash unless `wash=False` | `hand="ruled"` for built things, `"free"` for pictures; `grade` and `feather` make the gradient; `curve` bends lines over a round form |
| `hatching.scumble(d, shape, n, hand)` | small groups of short marks turned their own ways, for a lit face that has depth but no shadow direction | ruled scumble only turns to the hatch angles |
| `hatching.free_line`, `ellipse`, `crescent` | a breathing outline; polygons for round forms and the shadow side of one | |
| `penpicture.pen_picture(d, x, y, w, h, scene, seed)` | a framed pen-and-ink scene: `lighthouse`, `harbour`, `windmill` | each scene names its far and near boxes in `BANDS` for P11 |
| `penpicture.Pic` | a scene's surface: grid units in, plate units out; `shape`, `shade` (one angle, clean, feathered), `line`, `arc` | parts: `house`, `window`, `door`, `tree`, `rock`, `cloud`, `birds`, `water` |
