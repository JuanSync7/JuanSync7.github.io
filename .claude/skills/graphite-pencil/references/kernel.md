# Kernel index: read this, not the code under it

Runs from a project's synced copy, in one package with `pen_and_wash/kernel` (it imports its writer).

| Call | What it does | Gotcha |
|---|---|---|
| `graphite.pencil_picture(d, px0, py0, pw, ph, seed=...)` | a framed landscape: ranges, mist, treelines, lake, path, cabin, an oak, with burn, dodge and vignette | draws into `d`'s palette; the dark theme is told by `P["theme"]`, never by a colour |
| filters `graphite`, `graphiteLine`, `graphiteEdge`, `soft1`, `soft2` | grain and blending, from `penwash.defs` | every stroke inside a picture sits under one of them (G1) |
