# Checks

| Rule | Held by |
| --- | --- |
| No clipping, nothing floating, every piece on the grid, every piece a catalogue shape | `npm run lego:check` (every model in `LEGO_MODELS`), and `mustHold` in each LEGO figure at build, which the figure audit catches |
| Each check still catches its fault, on the site's models | `npm run lego:selftest`: a brick inside the chassis, a brick in mid-air, a brick half a stud over, a plate across an axle, a plate inside a wheel, a one-course wing, a 1 x 5 plate (not a catalogue shape) |
| Each check still catches its fault, on the joint rig | frontend-kit, `bricks/`: `npm run selftest` (in its `npm run check`): the rig passes as built and is all catalogue shapes, and the checks catch a brick inside the base, a brick in mid-air, a brick half a stud over, a tile half a stud over with no jumper, a tile through a bracket's flange, a tile on side studs with no bracket, a flap turned down into the base, a flap with no hinge, two plates in one cell of a flap |
| Every catalogue shape is a real part: size, top surface (the underside of an inverted slope), studs, nothing outside the shape's cells; no shape unnamed, no part named for no shape | frontend-kit, `bricks/`: `npm run reference -- <ldraw dir>`, against a local copy of the LDraw library (not in CI) |
| The site's catalogue is frontend-kit's, unedited | `npm run lego:sync -- <frontend-kit> --check` |
| The figure's look, motion, palette and speed | `npm run figure -- <id> --url=…` (the generic figure audit) |
| A sketch's drawing: views, line types, scale, sheet | `drawing/checks/README.md` |
| Silhouette, proportions, pieces where a builder would put them | Judgment: `LOOK.md`, with the wire, solid, catalogue and lego sheets from `npm run lego:sheet` |

`npm run check` runs `lego:check` and `lego:selftest`.
