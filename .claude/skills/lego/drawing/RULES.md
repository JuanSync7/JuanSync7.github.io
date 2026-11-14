# Drawing rules

Each rule says what holds it. Evidence: `[stated]` is Juan's own ask, `[proposed]` is a rule
Claude wrote while building the first drawings, a trial until he adopts or drops it.

| id | Rule | Why | Case that created it | Evidence | Held by |
|---|---|---|---|---|---|
| R-DRW-1 | Draw the real part before planning its LEGO: a sketch in `kit/legosketches.ts`, in the model's frame and units, from sketch to wireframe to 3D iso. | A LEGO plan drawn from memory looks blocky and wrong in ways nobody can name; a sketch gives the plan something to be measured against. | 2026-11-13, of the F1's rear wing: "take from a picture, and try to do a proper sketch in wire frame then 3D iso"; then "the same for the frontwing". | [stated] | review: the `compare` sheet |
| R-DRW-2 | Every number in a sketch names its source in the sketch's comment. When no photograph was used, the comment and the drawing's notes say so. | A sketch that looks exact but rests on a guess passes the guess on to every stage after it. | The 2026 wings: no usable photograph, so the proportions came from the rules as reported. | [proposed] | review; note 3 on the drawing sheet |
| R-DRW-3 | Neighbours that only place the part (tyres, a crash structure, a nose) are `context: true`: drawn in the sketch sheets, left off the drawing. | Context makes the sketch readable and the drawing unreadable: the tyres set the scale and the part shrinks to a corner. | The rear wing's first drawing. | [proposed] | code: `draftScene` and `draftLayout` skip context parts |
| R-DRW-4 | A drawing is first-angle orthographic projection: the side elevation as the main view, the end elevation from the nose on its right, the plan below it, an isometric view, and the first-angle symbol (the cone's narrow end away from its circles). | It is the UK and European convention, and a reader who knows it reads the part without being told which view is which. | 2026-11-14: "do you also proper a blueprint like all the various view", then "yes" to the drawing sheet. | [stated] | kernel: `kit/legodraft.ts` lays out every drawing this way |
| R-DRW-5 | Line types: visible edges solid, hidden edges dashed, centre lines chain (long, short), dimensions thin with arrowheads and extension lines that leave a gap at the part. | Each line type says something different; one line type for all of them hides the hidden edges and the centre. | Same request. | [proposed] | kernel |
| R-DRW-6 | A drawing prints at a standard scale on A3 (1:1, 1:2, 1:5, 1:10, 1:20 …). The margins grow to fit it; the drawing never stretches to fill the sheet. | A drawing at 1:13 cannot be measured with a scale rule. | The rear wing first came out at 1:20 with wide margins; tighter view spacing brought it to 1:10. | [proposed] | kernel: `plan()` in `kit/legodraft.ts` |
| R-DRW-7 | The sheet follows ISO 5457: frame with a 20 mm filing margin and 10 mm elsewhere, a grid reference border of 50 mm fields from the centre lines (numbers along, letters up, no I or O), centring marks, and a title block (title, drawing number, scale, projection, drawn, checked, date, units). | That is what a proper drawing sheet carries, and "the lamp is at D6" is something two people can point at. | 2026-11-14, Juan: "dont they also have proper boxes for the different views". | [stated] for the ask; [proposed] for this answer to it | `kit/draftsheet.ts` |
| R-DRW-8 | No words inside a figure canvas. On a page, view names, dimension values and the title block are DOM set from `draftLayout(<sketch>)`, the layout the figure draws by. | The site's rule for every figure; text in a canvas is unreadable to a screen reader and does not scale. | The lab's LEGO page. | [stated] (site `CLAUDE.md`, figures) | review |
| R-DRW-9 | Colour comes from the night tokens only. Lamps (sketch parts in `signal`) carry the signal colour; everything else is ink. | One bright mark says where to look; the page filter recolours it on paper. | The rear wing's rain lights. | [proposed] | the figure audit's palette check |
| R-DRW-10 | Claude never fills the "Checked" cell. It stays empty until a person has checked the drawing against its sources. | A checked box that nobody checked is a false record. | The first drawing sheet. | [proposed] | review |
| R-DRW-11 | A dimension that disagrees with the research goes back to the sketch. Never move a dimension line or its value by hand. | Dimensions are measured from the sketch's geometry; a hand-moved value is a drawing that lies. | Design of `draftLayout`. | [proposed] | code: dimensions are computed, not written |

## If you catch yourself

| If you catch yourself | Do this instead |
|---|---|
| eyeballing the shape from memory because there is no photo | find the published numbers, write each one's source, and say "no photograph traced" (R-DRW-2) |
| deleting the tyres from the sketch because they crowd the drawing | mark them `context: true` (R-DRW-3) |
| printing an odd scale such as 1:13 | let the layout grow its margins to the next standard scale (R-DRW-6) |
| writing a view name or a value into the canvas | set it as DOM from `draftLayout` (R-DRW-8) |
| nudging a dimension because it "looks wrong" | fix the sketch and draw again (R-DRW-11) |
| boxing each view to make the sheet look tidier | views float, aligned by projection; the boxes belong to the frame, grid border and title block (R-DRW-7) |
| ticking "Checked" | leave it for a person (R-DRW-10) |
