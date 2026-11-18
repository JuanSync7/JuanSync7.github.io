---
name: lego
description: Use when anything on juansync.dev is to be built in LEGO (a car, a building, a city, any object), or when a LEGO model, its pieces, its build animation or its checks are changed.
---

# Build anything in LEGO

Read the project `CLAUDE.md`, the `figure` and `site-taste` skills, then `RULES.md`, `LOOK.md`
and `kernel/INDEX.md` here. The worked example is the F1 car: `astro/src/figures/kit/legoformula.ts`
(the design) and `astro/src/figures/lego-f1.ts` (the figure).

The second worked example is the home page's city (`kit/legocity.ts`, `legobuildings.ts`,
`legoparts.ts`, `lego-city.ts`): a large model planned as voxels for its walls (two plates each)
with every roof, dome, spire, tree, lamp, bench and car a shaped part, built by ten builders at
once (`build(shapes, queue)`).

Everything drawn is LEGO pieces, from the first frame to the last. The smooth model and the
wireframe are for planning and review only; they never appear on a page.

## Workflow

Each stage ends with its sheet read before the next starts. Commands run in `astro/` with the dev
server up (`npx astro dev --port 4321 --host 127.0.0.1`).

1. **Brief.** Name the object and what makes it recognisable (for an F1 car: wheels outboard,
   long nose, front and rear wings, sidepods, halo, airbox). Find its real proportions and pick a
   scale: one stud = real width ÷ studs wide. Write both at the top of the model file.
   **Reference sketch.** Before planning a part whose shape matters (a wing, a nose, a roof),
   draw the real thing first, not in LEGO: an entry in `kit/legosketches.ts` (airfoils, thin
   plates, posts, pods, in the model's frame and units), its sources named in its comment.
   `npm run lego:sheet -- <sketch> sketch` (wireframe: top, side, front, iso) and `sketch3d`
   (shaded, 360°). Work from a photograph where you have one; say when you do not. Then
   `npm run lego:sheet -- <sketch> drawing`: the engineer's drawing (first-angle views,
   dimensions, A3 sheet) to measure the plan against. The nested playbook `drawing/` holds the
   whole of this step: research, sketch, drawing, compare, and putting a drawing on a page.
2. **Plan as shapes.** Write the model as a list of shapes in a new kit file (`kit/lego<name>.ts`,
   letters only), registered in `kit/legomodels.ts`. Use only the shape kinds and angles the
   catalogue has (`RULES.md`, "Shapes"). Design the structure as a builder would: one root
   piece, everything connected to it by studs or axles. Anything thin and upright or set at an
   angle (endplates, flaps) is a sub-assembly on a bracket or a hinge (`RULES.md`,
   "Sub-assemblies"). Then
   `npm run lego:sheet -- <model> wire` and read the top, side, front and isometric views. With a
   sketch, `npm run lego:sheet -- <sketch> compare` lays the sketch (signal colour) over the
   plan's wireframe; `solid` and `lego` with a sketch id frame that part.
3. **Isometric model.** `npm run lego:sheet -- <model> solid`: each shape as one smooth solid,
   turned through twelve angles plus top, low and under views. Fix proportions and silhouette here, while they
   are cheap to change. Use `--only=45 --tile=1400` for a close view.
4. **Catalogue.** The catalogue is the `bricks` package in `JuanSync7/frontend-kit`; this site
   has a synced copy (`kit/lego*.ts` with the one-source line, `scripts/lego/ldraw-parts.json`).
   If the model needs a shape no piece has, find the real LEGO part first, then add it in
   frontend-kit's `bricks/` as its README says (`src/legoset.ts` cells and studs,
   `src/legomesh.ts` or `src/legodetail.ts` geometry, one `CATALOGUE` entry, its number in
   `parts/ldraw-parts.json`) and run its `npm run selftest` and `npm run reference -- <ldraw dir>`
   there. Then `npm run lego:sync -- <frontend-kit>` here, `npm run lego:sheet -- <model>
   catalogue`, and read it. Never fake a shape with a piece LEGO does not make.
5. **Swap and check.** `npm run lego:check`: the model is swapped into pieces and checked for
   clipping, floating pieces, pieces off the grid, and pieces that are not catalogue shapes. Fix the design, never the check. Then
   `npm run lego:sheet -- <model> lego` and read the LEGO through 360°.
6. **Real parts.** Every piece is our own geometry, built from LEGO's published sizes, and every
   catalogue shape is a real part. When a piece changes, run frontend-kit's reference compare
   (`npm run reference -- <ldraw dir>` in `bricks/`) against a local copy of the LDraw library
   (library.ldraw.org, or the GitHub mirror gkjohnson/ldraw-parts-library; never committed). A
   piece that does not match is fixed in the catalogue to match the real part (as the wedge tip,
   the slope lips and the 2 x 2 dome were), never by loosening the comparison.
7. **Figure.** Mount the model in a three.js figure with the standard build animation (a LEGO
   base present from the first frame, pieces dropping on in order, the finished model holding,
   pieces lifting off last-on-first-off while the base stays) and `mustHold` at build.
   `npm run figure -- <id> --url=http://127.0.0.1:4321` and read the sheet.
8. **Look.** Answer `LOOK.md` with the sheets as evidence. Fix the cause of anything wrong and
   return to the stage where it was made.
9. **Hand over.** The model file, any new pieces, the figure, the sheets read, and what is still
   unverified. Run `npm run lego:selftest`, `npm run lego:sync -- <frontend-kit> --check` and
   `npm run check` before calling it done; a catalogue change also passes frontend-kit's
   `npm run check`.

## Tools and limits

`checks/README.md` maps each rule to the command that holds it. `kernel/INDEX.md` lists the
functions; read it instead of the code. Kit files stay under 200 lines, the figure under 350.
The checks (`legocheck.ts` in frontend-kit, `scripts/lego/check.mjs` here) judge the model; a
model author does not edit them to pass. A change to a check comes with a fixture that it
catches: in frontend-kit's `bricks/scripts/selftest.mjs` for the catalogue's checks and the joint
rig, in `--selftest` here for the site's models.
