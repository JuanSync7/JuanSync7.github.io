---
name: lego-drawing
description: Use when a real object, or a part of one, is to be researched, sketched or drawn as an engineering drawing before it is built in LEGO, or when a sketch, its drawing sheet or the lab's LEGO page is changed.
---

# Draw the real thing before the LEGO

A playbook nested in the `lego` skill: stages 1 and 2 of its workflow, done as an engineer
would. Read the parent `SKILL.md` and `RULES.md` first, then the `drawing` skill
(`.claude/skills/drawing/`: the engineering drawing rules, synced from the vault), then
`RULES.md` (the LEGO ones), `LOOK.md` and
`kernel/INDEX.md` here. The worked example is the F1's rear wing (`examples/README.md`), shown
on the site at `/lab/lego/`.

The drawing is the yardstick the LEGO is measured against. It is never the thing on show at the
end; the LEGO model is.

## Workflow

Commands run in `astro/` with the dev server up. Each stage ends with its sheet read.

1. **Research.** Find the real proportions: a published spec, a rule book, a datasheet, a
   photograph you may use. Write each number with its source. When there is no photograph you can
   use, say so (R-DRW-2). Pick the scale the parent model uses (metres per stud).
2. **Sketch.** Add the part to `kit/legosketches.ts` in the model's frame (studs; x along, y up,
   z across): wing elements as `foil`, thin parts as `plate`, floors as `deck`, blocks as
   `post`, fairings as `pod`, a survival cell or nose as `hull`, bent bars as `tube`, tyres and
   rims as `wheel`; a left and right pair as one part with `mirror`. Give it `title`, `scale`, `drawn` and `cut` (where section A-A goes,
   R-DRW-13), and each part that comes apart its `explode` offset (R-DRW-14). Mark the neighbours
   that only place it (`context: true`, R-DRW-3). `npm run lego:sheet -- <sketch> sketch` (four views) and
   `sketch3d` (360°); read both.
3. **Draw.** `npm run lego:sheet -- <sketch> drawing`: the A3 drawing of the part
   (first-angle views, section A-A, exploded isometric, sizes written on their lines as ISO 129-1
   does (R-DRW-12), frame, grid reference border, title block; monochrome, R-DRW-9). For a whole
   model the sketch with `doc: 'ga'` is sheet 1, `parts` its parts list, and each item its own
   drawing (R-DRW-18); `bom` is the LEGO parts list. Answer both `LOOK.md` files
   for it. A dimension that disagrees with step 1 goes back to the sketch, never to the drawing.
4. **Compare.** Plan the LEGO (parent workflow, stage 2), then
   `npm run lego:sheet -- <sketch> compare` lays the sketch in the signal colour over the plan's
   wireframe. Where they part ways, change the plan or name the gap in the hand-over.
5. **Publish (when asked).** A drawing on a page is the `lego-drawing` figure: the canvas draws
   the lines, the page sets every word as DOM from `draftLayout(<sketch>)` (R-DRW-8). Run
   `npm run figure -- lego-drawing --url=…` and look at the page at desktop and phone width.
6. **Hand over.** The sketch, the drawing sheet read, its sources, the gaps between the sketch
   and the LEGO, and what was not verified. The drawing's approval person cell stays empty until a
   person checks it (R-DRW-10).

## When to ask

Ask before drawing when the object, the part or the scale is unclear, or when the only source
is a photograph whose use is in doubt. Do not ask about line types, layout or scale: the kernel
decides them.
