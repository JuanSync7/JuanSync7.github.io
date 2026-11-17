# Checks (drawing)

| Rule | Held by |
| --- | --- |
| First-angle layout, line types, standard scale, context parts left off (R-DRW-3 to 6) | The kernel builds every drawing this way (`kit/legodraft.ts`); there is no other path to a drawing. Not a separate check: a change to the kernel is reviewed against `LOOK.md` with both sketches' sheets. |
| Frame, grid reference border, centring marks, title block (R-DRW-7) | `kit/draftsheet.ts` draws them on every sheet. |
| The drawing figure's palette, motion, blankness and speed | `npm run figure -- lego-drawing --url=…` (the generic figure audit, inside `npm run check`'s figure checks). |
| Sources named, approval left empty, the views read right (R-DRW-2, 10, 11) | Judgment: `LOOK.md`, with the drawing sheet. A convention until a script holds it. |
