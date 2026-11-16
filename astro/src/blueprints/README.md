# Component blueprints

Each shared component can have a blueprint: a spec file here (`<id>.ts`, listed in `index.ts`)
that says what the component is made of and how it is built, and an A3 engineering sheet drawn
from the spec and the component as it renders. The spec is what an agent reads and writes; the
sheet is for a person to review; the check holds the code to the spec.

A spec names only structure: the parts (root, boxes, slots), how each sizes (`hug` wraps its
content, `fill` takes its parent's room, `fixed` keeps its size), and which design token sets each
size (padding, gap, minimum height, line width, radius, the printed edge). Colours, motion and
content stay in the code and tokens, so the spec never becomes a second copy of the CSS.

| Command                             | What it does                                                                                                                                                    |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run blueprint -- <id>`         | Draws `figures-out/blueprint-<id>.png` from the example on `/design-system/`.                                                                                   |
| `npm run blueprint -- <id> --store` | Draws it into `public/blueprints/<id>.png`, the stored sheet the design system links to.                                                                        |
| `npm run blueprint:check`           | Measures every spec's component: each size against its token, each part's sizing (by widening its parent and lengthening its content). Fails on any difference. |
| `npm run blueprint:selftest`        | Breaks a spec three ways and proves the check catches each.                                                                                                     |

All three need the dev server and Playwright's Chromium. The sheet uses the A3 frame shared with
the LEGO drawings (`figures/kit/sheetframe.ts`) and the ISO 3098 lettering; sizes are named by
their tokens, and the table under the view gives their values.

## On the design system

A component with a blueprint shows it on `/design-system/` beside its specimen and code:
`<BlueprintView id="…">` wraps a live example, enlarges it by `--bp-zoom` (tokens in
`styles/tokens/blueprint.css`) and draws the blueprint over it in DOM (`overlay.ts`): slots
dashed and named with their sizing, each size dimensioned by its token, the printed edge as a
leader note. The token table under it is filled from a hidden 1:1 copy, so its values are what
renders, whatever the drawing's scale. On a narrow column the whole sheet scales down as one
drawing. The spec's code follows as a `CodeExample`, and the title block links the stored A3
sheet. The drawing, the stored sheet and the spec are the component's visual reference.

The overlay draws PaperAction's parts by name today. The second component to get a blueprint
generalises it: dimensions read from the spec rather than from fixed selectors.

To add a component: write `<id>.ts` with its parts and sizes (the `demo` selector must find an
example on `/design-system/`), list it in `index.ts`, wrap its specimen on `/design-system/` in `<BlueprintView>`, run the check,
then draw, read and store the sheet (`--store`).
