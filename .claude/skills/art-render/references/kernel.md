# Kernel index: read this, not the code under it

| Call | What it does | Gotcha |
|---|---|---|
| `render.export(src, out_dir, name, tile_width, background)` | writes `name@1x/2x/4x.webp`, the baked pictures and `name-print.svg` | 4x is rendered, 2x and 1x are Lanczos downsamples |
| `render.pictures(svg)`, `bake_picture(...)` | finds the graphite pictures and bakes each at `PICTURE_SCALE` | |
| `render.lite(svg, tile_width)` | the print vector: pictures baked in, heavy filters removed | never served to the page |
| `render.srcset_html(name, tile_width, height)` | an `<img>` with srcset, lazy and async | a project that registers plates shows them by id instead |
| `BUDGET`, `PICTURE_SCALE`, `RASTER_SCALES`, `WEBP_QUALITY` | the numbers the checks hold | change one only with a reason in the commit |
