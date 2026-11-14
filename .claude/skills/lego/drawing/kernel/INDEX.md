# Kernel index (drawing)

Read this index; do not read the code under it. Paths are in `astro/src/figures/kit/`. The
parent `lego/kernel/INDEX.md` lists the rest of the LEGO kernel. Not edited by a sketch author.

| API / module | Contract and gotcha |
| --- | --- |
| `LEGO_SKETCHES`, `Sketch` / `legosketches.ts` | Each sketch: `model` (the LEGO model it is drawn for), `title`, `scale` (metres per stud), `drawn` (date for the title block), `parts`. |
| `SketchPart`, `sketchGeometry(part)`, `sketchModel(parts, lines, own)` / `legosketch.ts` | Parts: `foil` (cambered section from `le` to `te` across z0..z1, with `spoon` and `sweep`), `plate` (outline in x, y, thickness t at z), `post`, `pod`, `wheel`. `context: true` keeps a part off the drawing. |
| `draftLayout(sketch)` / `legodraft.ts` | Pure layout in fractions of the drawing area: each view's box, each dimension (mm, studs, position, vertical), the symbol's box, and the A3 `scale`. What a page positions its DOM text by. |
| `draftScene(sketch, own)` / `legodraft.ts` | The drawing as a three.js group: one turned copy of the part per view; depth-only solids so hidden edges draw dashed (`GreaterDepth`); centre lines; dimensions; the first-angle symbol. Studs, x right, y up, the area's top left at the origin: an orthographic camera from (0, -h) to (w, 0) frames it. |
| `A3`, `AREA` / `legodraft.ts` | The sheet and its drawing area in mm; `AREA.w / AREA.h` is the shape a page gives the canvas, or the text will not line up. |
| `chain`, `dimLines`, `symbolLines`, `segs` / `draftlines.ts` | Line work as segment lists; lengths scale with the drawing unit `m`. |
| `drawingSheet(sketch, width)` / `draftsheet.ts` | The whole A3 sheet for review: frame, ISO 5457 grid border and centring marks, title block, notes, view names, dimension values. Reached by `lego:sheet -- <sketch> drawing`. Never imported by a page. |
| `lego-drawing` (figure) / `src/figures/lego-drawing.ts` | The rear wing's drawing on a page; still; group `post`. |
