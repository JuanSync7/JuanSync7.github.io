# Drawing rules: LEGO

The engineering drawing rules themselves (R-DRW-2, 4 to 7, 9 to 13, 15 to 22: projection, line
weights, the sheet, scales, dimensions, sections, the GA set and its parts list) are the
`drawing` skill (`.claude/skills/drawing/`), synced from the experience vault's
`Playbooks/drawing` with `npm run drawing:sync -- <vault>`; never edit that copy here. Its
`STANDARDS.md` is the ISO register. The rules below are how this site turns a drawing into LEGO,
and are changed here.

Each rule says what holds it. Evidence: `[stated]` is Juan's own ask, `[proposed]` is a rule
Claude wrote while building the first drawings, a trial until he adopts or drops it.

| id | Rule | Why | Case that created it | Evidence | Held by |
|---|---|---|---|---|---|
| R-DRW-1 | Draw the real part before planning its LEGO: a sketch in `kit/legosketches.ts`, in the model's frame and units, from sketch to wireframe to 3D iso. | A LEGO plan drawn from memory looks blocky and wrong in ways nobody can name; a sketch gives the plan something to be measured against. | 2026-11-13, of the F1's rear wing: "take from a picture, and try to do a proper sketch in wire frame then 3D iso"; then "the same for the frontwing". | [stated] | review: the `compare` sheet |
| R-DRW-3 | Neighbours that only place the part (tyres, a crash structure, a nose) are `context: true`: drawn in the sketch sheets, left off the drawing. | Context makes the sketch readable and the drawing unreadable: the tyres set the scale and the part shrinks to a corner. | The rear wing's first drawing. | [proposed] | code: `draftScene` and `draftLayout` skip context parts |
| R-DRW-8 | No words inside a figure canvas. On a page, view names, dimension values and the title block are DOM set from `draftLayout(<sketch>)`, the layout the figure draws by. | The site's rule for every figure; text in a canvas is unreadable to a screen reader and does not scale. | The lab's LEGO page. | [stated] (site `CLAUDE.md`, figures) | review |
| R-DRW-14 | The isometric view is exploded: each part moves by its sketch's `explode` offset, the way it comes apart when built. | It shows the sub-assemblies the LEGO is planned in, which no orthographic view can. | 2026-11-16, from the same repository's exploded layers. | [proposed] | kernel |

## If you catch yourself

The drawing skill's `SKILL.md` has the table for the drawing rules; these are the LEGO ones.

| If you catch yourself | Do this instead |
|---|---|
| planning a LEGO part straight from memory | sketch the real part first and draw it (R-DRW-1) |
| deleting the tyres from the sketch because they crowd the drawing | mark them `context: true` (R-DRW-3) |
| writing a view name or a value into the canvas | set it as DOM from `draftLayout` (R-DRW-8) |
| drawing the isometric view assembled when the LEGO is built in sub-assemblies | give each part its `explode` offset (R-DRW-14) |
