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
