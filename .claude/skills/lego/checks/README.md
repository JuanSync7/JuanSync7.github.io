# Checks

| Rule | Held by |
| --- | --- |
| No clipping, nothing floating, every piece on the grid | `npm run lego:check` (every model in `LEGO_MODELS`), and `mustHold` in each LEGO figure at build, which the figure audit catches |
| Each check still catches its fault | `npm run lego:selftest`: a brick inside the chassis, a brick in mid-air, a brick half a stud over, a plate across an axle, a plate inside a wheel, a one-course wing |
| The figure's look, motion, palette and speed | `npm run figure -- <id> --url=…` (the generic figure audit) |
| Silhouette, proportions, pieces where a builder would put them | Judgment: `LOOK.md`, with the wire, solid, catalogue and lego sheets from `npm run lego:sheet` |

`npm run check` runs `lego:check` and `lego:selftest`.
