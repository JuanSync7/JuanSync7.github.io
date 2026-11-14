# LEGO kernel index

The code lives in `astro/src/figures/kit/`. Read this index; open a file only for the part
being changed. Units: x and z in studs, y in plates (3 plates = a brick; a plate is 0.4 of a
stud). A piece's (x, z) is its footprint's minimum corner; rolling parts use their axis.

| API / module | Contract and gotcha |
| --- | --- |
| `Shape` / `legoswap.ts` | What a model is written in: `block`, `ramp`, `wedge`, `round`, `technic`, `halo`, `wheel`, `axle`. Directions `x+`, `x-`, `z+`, `z-` say where a ramp falls or a wedge narrows. A ramp is one piece deep (its profile's run). |
| `swap(shape)`, `build(shapes)` / `legoswap.ts` | Shapes to pieces. Blocks are laid in a bond (`bond`, re-laid until each course holds); `build` sets each piece's `order` (bottom course first, shape order within, axles then wheels last). |
| `PROFILE` / `legoswap.ts` | Run and height of each ramp piece: `slope45` 2 × 3 plates, `cheese` 1 × 2, `curve2` 2 × 2, `curve4` 4 × 3. |
| `Piece`, `KINDS`, `footprint`, `cellsOf`, `studsOf`, `turn` / `legoset.ts` | The catalogue as data: the cells a piece fills, its studs, its quarter turn. Ramps fall from local x = 0 toward +x. Wedges: full width at u = 0, half-stud tip at u = w, hand R or L names the straight side. |
| `inspect`, `mustHold` / `legocheck.ts` | The checks (clipping, floating, off grid). `mustHold` throws, so a figure that builds a broken model fails its audit. Not edited by a model author. |
| `body(piece, opts)` / `legomesh.ts` | Each piece's 3D geometry, in its own frame, with studs, technic holes, the helmet's visor, the tyre's tread. `studs: false, gap: 0` draws the smooth plan solid. |
| `legoModel(pieces, own)` / `legoscene.ts` | The LEGO, one instanced mesh per piece shape; `place(i, lift | null)` then `commit()` moves or hides piece i. |
| `smoothModel`, `wireModel` / `legoscene.ts` | The isometric plan and its wireframe, one solid per shape. |
| `legoLight(scene, renderer, own)` / `legoscene.ts` | Room environment, ambient and key light; no shadow map (pieces move). |
| `legoFlat(ctx, cam, pieces)` / `legoflat.ts` | The no-WebGL fallback: pieces as boxes with studs, wheels as discs. |
| `sheet(model, stage, tile, only)` / `legostudio.ts` | The review sheets behind `npm run lego:sheet`. Never imported by a page. |
| `LEGO_MODELS` / `legomodels.ts` | Every model by id; `lego:check` and `lego:sheet` read it. |
