# Component blueprints

Each shared component can have a blueprint: a spec file here (`<id>.ts`, listed in `index.ts`)
that says what the component is made of and how it is built, and an A3 engineering sheet drawn
from the spec and the component as it renders. The spec is what an agent reads and writes; the
sheet is for a person to review; the check holds the code to the spec.

A spec names only structure: the parts (root, boxes, slots), how each sizes (`hug` wraps its
content, `fill` takes its parent's room, `fixed` keeps its size), and which design token sets each
size (padding, gap, minimum height, line width, radius, the printed edge). Colours, motion and
content stay in the code and tokens, so the spec never becomes a second copy of the CSS.

| Command | What it does |
|---|---|
| `npm run blueprint -- <id>` | Draws `figures-out/blueprint-<id>.png` from the example on `/design-system/`. |
| `npm run blueprint:check` | Measures every spec's component: each size against its token, each part's sizing (by widening its parent and lengthening its content). Fails on any difference. |
| `npm run blueprint:selftest` | Breaks a spec three ways and proves the check catches each. |

All three need the dev server and Playwright's Chromium. The sheet uses the A3 frame shared with
the LEGO drawings (`figures/kit/sheetframe.ts`) and the ISO 3098 lettering; sizes are named by
their tokens, and the table under the view gives their values.

To add a component: write `<id>.ts` with its parts and sizes (the `demo` selector must find an
example on `/design-system/`), list it in `index.ts`, run the check, then draw and read the sheet.
