# Kernel index (drawing)

Read this index; do not read the code under it. Paths are in `astro/src/figures/kit/`. The
parent `lego/kernel/INDEX.md` lists the rest of the LEGO kernel. Not edited by a sketch author.

The drawing kernel is `drawing/`: synced from the experience vault's `Playbooks/drawing/kernel`
(`npm run drawing:sync -- <vault>`, `--check` to compare), never edited here. A change to it is
made in the vault, then synced. Its one site file is `drawing/host.ts`, the host contract: the
site's colours (`hexOf`), the tone names (`Tone`), the sketches (`SKETCHES`, from
`legosketches.ts`) and the sheet's unit note (one stud, 8 mm in LEGO).

| API / module | Contract and gotcha |
| --- | --- |
| `LEGO_SKETCHES` / `legosketches.ts`; `Sketch`, `partsOf`, `itemsOf` / `drawing/sketch.ts` (data in `legosketchwings.ts`, `legosketchcar.ts`) | Each sketch: `model`, `title`, `scale` (metres per model unit: per stud here), `drawn`, `number`, `revision`, `doc` (`ga`, `assembly` or `detail`, ISO 10209), `notes` (its sources, R-DRW-2), optional `cut` (z of section A-A), `callout` (where a general arrangement's leader to it ends) and `parts` (each may carry `explode`). A general arrangement lists the sketches it is made of in `of` (item order, with quantities); `partsOf` gathers their parts, `itemsOf` numbers them. |
| `SketchPart`, `sketchGeometry(part)`, `leadingEdge(foil, z)` / `drawing/parts.ts`; `sketchModel(parts, lines, own)` / `legosketch.ts` | Parts: `foil` (cambered section from `le` to `te` across z0..z1, with `spoon` and `sweep`), `plate` (side outline in x, y, `t` across at z), `deck` (plan outline in x, z, `t` thick at y), `post`, `pod`, `wheel` (`rim` gives a tyre on its rim), `hull` (rounded-box sections lofted along x: a nose, a sidepod), `tube` (round, along a smooth curve: a halo). `context: true` keeps a part off the drawing. |
| `plan(id)`, `draftLayout(id)`, `titleFields(layout, sheet)` / `drawing/plan.ts`; shared `A3`, `AREA`, `TURN`, `VIEWS`, `DOC`, `dimmer` / `drawing/base.ts` | A part or assembly: views (side, end, plan, isometric, exploded when its parts carry `explode`), section A-A at 2:1 of the drawing's scale where the sketch has a `cut`, overall sizes, centre and cutting lines, symbol, A3 `scale`. A `ga` sketch is laid out by `gaPlan` instead. `draftLayout` returns the words a page sets as DOM. |
| `gaPlan(sketch)` / `drawing/ga.ts` | A general arrangement: spacing in paper mm, the largest standard scale that fits, the isometric at its own smaller standard scale when it must be (labelled); length, height, wheelbase, width and both tracks; item numbers in circles above the side elevation on leaders ending in dots (ISO 6433), never crossing. Its parts list is sheet 2 (`lego:sheet -- <id> parts`, ISO 7573). |
| `viewEdges(solid, look)` / `drawing/edges.ts` | The lines a view shows of a solid: hard edges and that view's silhouette (where a face turned to the viewer meets one turned away). A smooth body has no outline without it. |
| `draftScene(sketch, own)` / `drawing/scene.ts` | The drawing as a three.js group, monochrome: one turned copy of the part per view (exploded in the isometric); depth-only solids so hidden edges draw dashed (`GreaterDepth`); the plan's 2D line work and the hatched section flat on top. Model units (studs here), x right, y up, the area's top left at the origin: an orthographic camera from (0, -h) to (w, 0) frames it. |
| `A3`, `AREA` / `drawing/base.ts` | The sheet and its drawing area in mm; `AREA.w / AREA.h` is the shape a page gives the canvas, or the text will not line up. |
| `chain`, `dimLines`, `arrow`, `symbolLines`, `sectionAt`, `hatch`, `segs` / `drawing/lines.ts` | 2D line work as segment lists (y down); `sectionAt` cuts solids by a plane z, `hatch` fills unordered outlines even-odd. Lengths scale with the drawing unit `m`. |
| `drawingSheet(id, width)`, `partsListSheet(id, width)` / `drawing/sheet.ts` (on the frame in `drawing/frame.ts`) | The whole A3 sheet for review: frame, ISO 5457 grid border and centring marks, title block (sheet n of the document), the sketch's notes, view names, dimension values; or a general arrangement's parts list. Reached by `lego:sheet -- <id> drawing | parts`. Never imported by a page. |
| `lego-drawing` (figure) / `src/figures/lego-drawing.ts` | The rear wing's drawing on a page; still; group `post`. |
| `src/lib/lettering` (a synced copy of the vault playbook `Playbooks/lettering`; never edit here) | ISO 3098 type B lettering: `GLYPHS`, `TYPE_B`, `textStrokes`, `outlines`; `font.ts` builds `public/fonts/iso-lettering-b.otf`. Every word on a drawing is set in it (`--nt-drafting` on a page; `'ISO Lettering B'` on the sheet, capital height 0.7 of the font size). |
