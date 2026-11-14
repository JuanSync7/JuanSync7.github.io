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
   (shaded, 360°). Work from a photograph where you have one; say when you do not.
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
4. **Catalogue.** If the model needs a shape no piece has, add the piece to the catalogue first
   (`kit/legoset.ts` cells and studs, `kit/legomesh.ts` geometry, a sample in
   `kit/legostudio.ts`), then `npm run lego:sheet -- <model> catalogue` and read it. Never fake a
   shape with a piece that is not in the catalogue.
5. **Swap and check.** `npm run lego:check`: the model is swapped into pieces and checked for
   clipping, floating pieces and pieces off the grid. Fix the design, never the check. Then
   `npm run lego:sheet -- <model> lego` and read the LEGO through 360°.
6. **Real parts.** Every piece is our own geometry, built from LEGO's published sizes. Where a
   shape has a real LEGO part, name it in `scripts/lego/ldraw-parts.json` (LDraw number) and run
   `npm run lego:reference -- <ldraw dir>` against a local copy of the library (library.ldraw.org,
   or the GitHub mirror gkjohnson/ldraw-parts-library; never committed). A piece that does not
   match is fixed in our catalogue to match the real part (as the wedge tip and the slope lips
   were), never by loosening the comparison.
7. **Figure.** Mount the model in a three.js figure with the standard build animation (a LEGO
   base present from the first frame, pieces dropping on in order, the finished model holding,
   pieces lifting off last-on-first-off while the base stays) and `mustHold` at build.
   `npm run figure -- <id> --url=http://127.0.0.1:4321` and read the sheet.
8. **Look.** Answer `LOOK.md` with the sheets as evidence. Fix the cause of anything wrong and
   return to the stage where it was made.
9. **Hand over.** The model file, any new pieces, the figure, the sheets read, and what is still
   unverified. Run `npm run lego:selftest` and `npm run check` before calling it done.

## Tools and limits

`checks/README.md` maps each rule to the command that holds it. `kernel/INDEX.md` lists the
functions; read it instead of the code. Kit files stay under 200 lines, the figure under 350.
The checks (`kit/legocheck.ts`, `scripts/lego/check.mjs`) judge the model; a model author does
not edit them to pass. A change to a check comes with a fixture in `--selftest` that it catches.
