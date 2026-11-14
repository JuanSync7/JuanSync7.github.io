---
name: lego
description: Use when anything on juansync.dev is to be built in LEGO (a car, a building, a city, any object), or when a LEGO model, its pieces, its build animation or its checks are changed.
---

# Build anything in LEGO

Read the project `CLAUDE.md`, the `figure` and `site-taste` skills, then `RULES.md`, `LOOK.md`
and `kernel/INDEX.md` here. The worked example is the F1 car: `astro/src/figures/kit/legoformula.ts`
(the design) and `astro/src/figures/lego-f1.ts` (the figure).

`lego-city` on the home page predates this pipeline (its own kits `legocity`, `legobuildings`,
`legoparts`, `lego`); moving it onto the catalogue and checks is open work.

Everything drawn is LEGO pieces, from the first frame to the last. The smooth model and the
wireframe are for planning and review only; they never appear on a page.

## Workflow

Each stage ends with its sheet read before the next starts. Commands run in `astro/` with the dev
server up (`npx astro dev --port 4321 --host 127.0.0.1`).

1. **Brief.** Name the object and what makes it recognisable (for an F1 car: wheels outboard,
   long nose, front and rear wings, sidepods, halo, airbox). Find its real proportions and pick a
   scale: one stud = real width ÷ studs wide. Write both at the top of the model file.
2. **Plan as shapes.** Write the model as a list of shapes in a new kit file (`kit/lego<name>.ts`,
   letters only), registered in `kit/legomodels.ts`. Use only the shape kinds and angles the
   catalogue has (`RULES.md`, "Shapes"). Design the structure as a builder would: one root
   piece, everything connected to it by studs or axles. Then
   `npm run lego:sheet -- <model> wire` and read the top, side, front and isometric views.
3. **Isometric model.** `npm run lego:sheet -- <model> solid`: each shape as one smooth solid,
   turned through 360° plus top and low views. Fix proportions and silhouette here, while they
   are cheap to change. Use `--only=45 --tile=1400` for a close view.
4. **Catalogue.** If the model needs a shape no piece has, add the piece to the catalogue first
   (`kit/legoset.ts` cells and studs, `kit/legomesh.ts` geometry, a sample in
   `kit/legostudio.ts`), then `npm run lego:sheet -- <model> catalogue` and read it. Never fake a
   shape with a piece that is not in the catalogue.
5. **Swap and check.** `npm run lego:check`: the model is swapped into pieces and checked for
   clipping, floating pieces and pieces off the grid. Fix the design, never the check. Then
   `npm run lego:sheet -- <model> lego` and read the LEGO through 360°.
6. **Figure.** Mount the model in a three.js figure with the standard build animation (a LEGO
   base present from the first frame, pieces dropping on in order, the finished model holding,
   pieces lifting off last-on-first-off while the base stays) and `mustHold` at build.
   `npm run figure -- <id> --url=http://127.0.0.1:4321` and read the sheet.
7. **Look.** Answer `LOOK.md` with the sheets as evidence. Fix the cause of anything wrong and
   return to the stage where it was made.
8. **Hand over.** The model file, any new pieces, the figure, the sheets read, and what is still
   unverified. Run `npm run lego:selftest` and `npm run check` before calling it done.

## Tools and limits

`checks/README.md` maps each rule to the command that holds it. `kernel/INDEX.md` lists the
functions; read it instead of the code. Kit files stay under 200 lines, the figure under 350.
The checks (`kit/legocheck.ts`, `scripts/lego/check.mjs`) judge the model; a model author does
not edit them to pass. A change to a check comes with a fixture in `--selftest` that it catches.
