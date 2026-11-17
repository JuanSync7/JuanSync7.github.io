# LEGO kernel index

The code lives in `astro/src/figures/kit/`. Read this index; open a file only for the part
being changed. The catalogue modules (marked **kit**: `legoset`, `legocatalogue`, `legoswap`,
`legomirror`, `legopose`, `legojoint`, `legoclash`, `legocheck`, `legoaero`, `legogeo`,
`legounder`, `legodetail`, `legomesh`, `legoplay`, `legorig`) are synced copies of
`JuanSync7/frontend-kit`'s `bricks/src` (`npm run lego:sync -- <frontend-kit>`): change them
there. Everything else here is the site's. Units: x and z in studs, y in plates (3 plates = a brick; a plate is 0.4 of a
stud). A piece's (x, z) is its footprint's minimum corner; rolling parts use their axis.

| API / module | Contract and gotcha |
| --- | --- |
| **kit** `Shape` / `legoswap.ts` | What a model is written in: `block` (`lay: 'z'` starts its courses across the car, so one plate reaches from a hub to the chassis), `ramp`, `wedge`, `round` (`cap`: a 2 x 2 dome on top), `technic`, `part` (any one catalogue piece: a quarter tile, a cone, a bar, a bracket with its `flange`, a hinge row with its `fingers`, split into 2 x 1 hinges), `wheel`, `axle`. Directions `x+`, `x-`, `z+`, `z-` say where a ramp falls or a wedge narrows. A ramp is one piece deep (its profile's run). |
| **kit** `mirror(shape, width)`, `both(shape, width)` / `legomirror.ts` | The other side of a symmetric model: z flipped, z-directions reversed, wedge hands swapped, a quarter tile's turn swapped. Write one side, mirror it. |
| **kit** `swap(shape)`, `build(shapes)`, `sizesOf` / `legoswap.ts` | Shapes to pieces. Blocks are laid in a bond (sizes LEGO makes; a grille course's odd cell takes a plain 1 x 1 tile) (`bond`, re-laid until each course holds); `build` sets each piece's `order` (bottom course first, shape order within, axles then wheels last). A sub-assembly's pieces go on no lower than its pose's origin, so a sideways endplate whose foot hangs below its bracket still follows the bracket. |
| **kit** `PROFILE` / `legoswap.ts` | Run and height of each ramp piece: `slope45` 2 × 3 plates, `slope33` 3 × 3, `inv45` 2 × 3 (inverted: the underside rises toward `dir`), `cheese` 1 × 2, `curve2` 2 × 2, `curve3` 3 × 3, `curve4` 4 × 3. |
| **kit** `Piece`, `KINDS`, `footprint`, `cellsOf`, `studsOf`, `turn`, `Tones` / `legoset.ts` | The catalogue as data: the cells a piece fills, its studs, its quarter turn. Ramps fall from local x = 0 toward +x. Wedges: full width at u = 0 (1.93 on the 2 x 2), a one-stud tip at u = w, hand R or L names the straight side (our 2 x 2 R is LEGO's Left, 24299: the part map holds the truth). A tone is a name; the site names them in `legotones.ts` (the night palette's keys). |
| **kit** `CATALOGUE`, `CATALOGUE_KEYS` / `legocatalogue.ts` | Every shape a model can be swapped into, once each, each a real part in the part map. `lego:check` fails a model piece whose `partKey` is not here; `lego:sheet -- <model> catalogue` draws them all. |
| **kit** `inspect`, `mustHold` / `legocheck.ts` | The checks (clipping, floating, off grid). `mustHold` throws, so a figure that builds a broken model fails its audit. Not edited by a model author. |
| **kit** `socketsOf`, `partKey` / `legoset.ts` | An inverted slope takes studs only under its stud row. `partKey` names a shape as the parts list and `ldraw-parts.json` do (a bracket's flange, a hinge's fingers, a wheel's radius and width). A bracket's flange takes the cells in front of its base; a hinge's knuckle the row behind its plate. |
| **kit** `detail(piece, opts)` / `legodetail.ts`, primitives / `legogeo.ts` | Geometry of the detail pieces (33° and inverted slopes, 3-long curve, quarter and round tiles, cone, bar 4L, bracket, hinge, jumper); `box`, `profile`, `plan`, `studsAt`, `fall`, `join` shared by both geometry files. |
| **kit** `body(piece, opts)` / `legomesh.ts` | Each piece's 3D geometry, in its own frame, with studs, technic holes, the 2 x 2 dome's lathe profile and crown stud, the tyre on its 30 mm rim with six spokes. `studs: false, gap: 0` draws the smooth plan solid. |
| `legoModel(pieces, own)` / `legoscene.ts` | The LEGO, one instanced mesh per piece shape and one for every stud; `place(i, lift | null)` then `commit()` moves or hides piece i, and a stud hides once the piece that covers it is down. Unchanged pieces cost nothing. |
| **kit** `liftAt(order, u, timeline)`, `loopOf`, `finishedAt` / `legoplay.ts` | The standard build animation every LEGO figure uses. |
| **kit** `build(shapes, queue?)` / `legoswap.ts` | With a queue, pieces go to builders working side by side; a null queue is the base (order 0). |
| `cityShapes`, `cityQueue` / `legocity.ts`; parts / `legoparts.ts` | The city: voxel walls laid as plates (`yOf`), shaped parts (`gable`, `dome`, `spire`, `tree`, `lamp`, `bench`, `car`) that stand on the highest voxel under them. |
| `smoothModel`, `wireModel` / `legoplan.ts` | The isometric plan and its wireframe, one solid per shape. |
| `legoLight(scene, renderer, own)` / `legoscene.ts` | Room environment, ambient and key light; no shadow map (pieces move). |
| `legoFlat(ctx, cam, pieces)` / `legoflat.ts` | The no-WebGL fallback: pieces as boxes with studs, wheels as discs. |
| `sheet(model, stage, tile, only)` / `legostudio.ts` | The review sheets behind `npm run lego:sheet`: wire in top, side, front, iso; solid and lego through twelve angles plus top, low and under. Never imported by a page. |
| `LEGO_MODELS` / `legomodels.ts` | Every model by id; `lego:check` and `lego:sheet` read it. |
| **kit** `Pose`, `onSide(bracket)`, `onHinge(hinge, angle)`, `compose`, `mirrorPose`, `hingeRow`, `FLANGE_T`, `KNUCKLE_*` / `legopose.ts` | Sub-assemblies: the pose that fixes one to a bracket's side studs (half a plate out) or a hinge's knuckle (half a stud out, 0.75 plate up). Pure. |
| **kit** `jointsOf(p)` / `legojoint.ts` | Every stud, socket and knuckle of a piece in the model's space, whichever way it faces: what `floating` joins on. |
| **kit** `clashes(pieces, hinged)` / `legoclash.ts` | Clipping across sub-assemblies: turned cell boxes, a bracket's flange as its half plate, a knuckle as the square inside its finger; separating-axis test. |
| **kit** `piece(shape)` / `legoswap.ts` | The piece a part shape becomes (to hang a sub-assembly on). |
| `LEGO_SKETCHES` / `legosketches.ts`; `sketchModel` / `legosketch.ts` | Reference sketches of real objects (review only): `lego:sheet -- <id> sketch \| sketch3d \| compare \| drawing`. The drawing kernel (`kit/drawing/`, synced from the vault's `Playbooks/drawing/kernel`) is indexed in `drawing/kernel/INDEX.md`. |
| **kit** `flap`, `flapTiles` / `legoaero.ts` (a flap is a one-finger hinge row, tiled; a cascade lays a two-finger row on it instead and hangs the next flap a stud behind); `rearWing` / `legorearwing.ts` | Hinged flaps and thin endplates for any car; the F1's 2026 rear wing, built to the `rearwing` sketch. |
| **kit** `jumper` (catalogue) | A 1 x 2 plate with one centre stud: what sits on it in a sub-assembly posed 0.5 over is held (`legojoint.ts`). |
| **kit** `RIG` / `legorig.ts` | The joint rig: a bracket with a sideways tile, a hinge with a flap, a jumper. frontend-kit's selftest breaks it; `lego:sheet -- rig` draws it. |
| **kit** `hollow(w, d, top, gap)` / `legounder.ts` | The real underside of a brick, plate or tile (walls, roof, tubes or pins), drawn in the LEGO view (`under: true`). |
