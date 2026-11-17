---
name: drawing
description: Use when a real object, an assembly or a part is to be drawn as an engineering drawing (first-angle views, dimensions, an A3 sheet, a general arrangement with its parts list), or when a drawing, its sheet or its layout is changed, in any project and for any 3D model.
status: "[adopted] the deck Engineering drawing is a draft; R-DRW-4, 5, 7, 9, 12 and 15 quote the owner, the rest he adopted on 2026-11-17."
---

# Drawing playbook

An engineering drawing is the yardstick a model is measured against: the real object's sizes,
on a sheet anyone trained can read. The rules are in `RULES.md` (generated from the deck: never
edit it), the ISO standards each one follows in `STANDARDS.md`, and the questions to read a
sheet by in `LOOK.md`. A project gets a synced copy of these four files (R-DRW-22) and keeps its
own rules for how it builds the object apart; on juansync.dev that is the LEGO skill's
`drawing/` playbook, and its kernel (`astro/src/figures/kit/draft*.ts`) is the worked example.

The words on a drawing follow the lettering playbook (`Playbooks/lettering`, R-LET).

## Workflow

Each stage ends with its sheet read.

1. **Research.** Find the real sizes: a published specification, a rule book, a datasheet, a
   photograph you may use. Write each number with its source; when there is no photograph, say
   so (R-DRW-2). Pick the scale the model uses.
2. **Model the real thing.** Build it as geometry in the project's own frame and units, from
   the research, not from memory. Mark each item: its title, its drawing number, its document
   kind (general arrangement, assembly or detail), where a section cuts it (R-DRW-13), and how
   many there are and whether one is a mirror image (R-DRW-19).
3. **Review views.** Read the wireframe (top, side, front, isometric) and the shaded model
   turned through 360 degrees. They judge shape and carry no dimensions (R-DRW-21); a change of
   shape is made here, once.
4. **Draw.** Each sheet is computed from the model, never drawn by hand (R-DRW-11): first-angle
   views (R-DRW-4), outlines and silhouettes per view (R-DRW-16), line weights (R-DRW-5), a
   standard scale laid out in paper millimetres (R-DRW-6, R-DRW-17), dimensions as ISO 129-1
   writes them (R-DRW-12), the ISO 5457 sheet and ISO 7200 title block (R-DRW-7), in ink only
   (R-DRW-9). A dimension that disagrees with step 1 goes back to the model.
5. **The set.** For a whole object: sheet 1 is the general arrangement with balloons, sheet 2
   its parts list, then a drawing per item (R-DRW-18, R-DRW-20). Read every sheet with `LOOK.md`.
6. **Hand over.** The model, each sheet read, the sources, the gaps between the drawing and
   what was built from it, and what was not verified. The approval cell stays empty until a
   person checks the drawing (R-DRW-10).

## When to ask

Ask before drawing when the object, the part or the scale is unclear, or when the only source
is a photograph whose use is in doubt. Do not ask about line types, layout or scale: the
standards decide them.

## If you catch yourself

| If you catch yourself | Do this instead |
|---|---|
| eyeballing a size from memory because there is no photo | find the published number, write its source, and say "no photograph traced" (R-DRW-2) |
| printing an odd scale such as 1:13 | let the layout pick the next standard scale (R-DRW-6) |
| nudging a dimension because it "looks wrong" | fix the model and draw again (R-DRW-11) |
| naming sizes L1, W1 with a table on a part drawing | write the value on its line, in mm, as ISO 129-1 does (R-DRW-12) |
| colouring a part to make the drawing livelier | ink only; the accent is for display (R-DRW-9) |
| boxing each view to make the sheet look tidier | views float, aligned by projection; the boxes belong to the frame, grid border and title block (R-DRW-7) |
| putting every part's sizes on the whole object's sheet | the GA gives overall sizes; each item gets its own drawing (R-DRW-18) |
| drawing the left wheel and the right wheel twice | one drawing, quantity 2, the mirror noted (R-DRW-19) |
| adding dimensions to the wireframe or the 360-degree sheet | those are review views; dimensions belong on the drawing (R-DRW-21) |
| filling the approval cell | leave it for a person (R-DRW-10) |
