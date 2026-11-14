# Checks

| Rule | Held by |
| --- | --- |
| No clipping, nothing floating, every piece on the grid | `npm run lego:check` (every model in `LEGO_MODELS`), and `mustHold` in each LEGO figure at build, which the figure audit catches |
| Each check still catches its fault | `npm run lego:selftest`: a brick inside the chassis, a brick in mid-air, a brick half a stud over, a plate across an axle, a plate inside a wheel, a one-course wing; then the joint rig (`kit/legorig.ts`) passes as built, and catches a tile half a stud over with no jumper, a tile through a bracket's flange, a tile on side studs with no bracket, a flap turned down into the base, a flap with no hinge, two plates in one cell of a flap |
| Our pieces match the real parts they stand for: size, top surface (the underside of an inverted slope), studs, nothing outside the shape's cells | `npm run lego:reference -- <ldraw dir>`, against a local copy of the LDraw library (not part of `npm run check`) |
| The figure's look, motion, palette and speed | `npm run figure -- <id> --url=…` (the generic figure audit) |
| A sketch's drawing: views, line types, scale, sheet | `drawing/checks/README.md` |
| Silhouette, proportions, pieces where a builder would put them | Judgment: `LOOK.md`, with the wire, solid, catalogue and lego sheets from `npm run lego:sheet` |

`npm run check` runs `lego:check` and `lego:selftest`.
