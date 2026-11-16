# Kernel index (drawing)

Read this index; do not read the code under it. Paths are in `astro/src/figures/kit/`. The
parent `lego/kernel/INDEX.md` lists the rest of the LEGO kernel. Not edited by a sketch author.

| API / module | Contract and gotcha |
| --- | --- |
| `LEGO_SKETCHES`, `Sketch` / `legosketches.ts` | Each sketch: `model` (the LEGO model it is drawn for), `title`, `scale` (metres per stud), `drawn` (date for the title block), `cut` (z of section A-A), `parts` (each may carry `explode`). |
| `SketchPart`, `sketchGeometry(part)`, `leadingEdge(foil, z)`, `sketchModel(parts, lines, own)` / `legosketch.ts` | Parts: `foil` (cambered section from `le` to `te` across z0..z1, with `spoon` and `sweep`), `plate` (outline in x, y, thickness t at z), `post`, `pod`, `wheel`. `context: true` keeps a part off the drawing. |
| `plan(sketch)`, `draftLayout(sketch)` / `draftplan.ts` | The whole layout: views (side, end, plan, exploded isometric), section A-A at 2:1 of the drawing's scale, dimensions, centre and cutting lines, symbol, A3 `scale`. `draftLayout` returns the words (`labels`: text, point in fractions, side of the point) and the `variables` table; a page sets both as DOM. |
| `draftScene(sketch, own)` / `legodraft.ts` | The drawing as a three.js group, monochrome: one turned copy of the part per view (exploded in the isometric); depth-only solids so hidden edges draw dashed (`GreaterDepth`); the plan's 2D line work and the hatched section flat on top. Studs, x right, y up, the area's top left at the origin: an orthographic camera from (0, -h) to (w, 0) frames it. |
| `A3`, `AREA` / `legodraft.ts` | The sheet and its drawing area in mm; `AREA.w / AREA.h` is the shape a page gives the canvas, or the text will not line up. |
| `chain`, `dimLines`, `arrow`, `symbolLines`, `sectionAt`, `hatch`, `segs` / `draftlines.ts` | 2D line work as segment lists (y down); `sectionAt` cuts solids by a plane z, `hatch` fills unordered outlines even-odd. Lengths scale with the drawing unit `m`. |
| `drawingSheet(sketch, width)` / `draftsheet.ts` | The whole A3 sheet for review: frame, ISO 5457 grid border and centring marks, title block, notes, view names, dimension values. Reached by `lego:sheet -- <sketch> drawing`. Never imported by a page. |
| `lego-drawing` (figure) / `src/figures/lego-drawing.ts` | The rear wing's drawing on a page; still; group `post`. |
