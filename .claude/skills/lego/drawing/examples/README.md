# Examples

## Rear wing, 2026 rules (good)

- **What it shows:** the whole playbook on one part. Sketch `rearwing` in
  `astro/src/figures/kit/legosketches.ts`: three cambered elements, endplates with their lights,
  two pillars and an actuator pod, with the crash structure and tyres as context. Its drawing
  (`npm run lego:sheet -- rearwing drawing`) prints at 1:10 on A3: side elevation 547 high and
  520 long, end elevation 1126 wide, plan below, isometric, first-angle symbol, grid border A–F
  by 1–8. The LEGO wing it was built against is `kit/legorearwing.ts`, and `compare` lays one
  over the other.
- **Where it came from:** the F1 sessions of 13 and 14 November 2026. No photograph was usable,
  so the proportions came from the 2026 technical rules as reported, and the sketch and the
  drawing both say so.
- **Rules it illustrates:** R-DRW-1 to 7, 9 and 10. On the site it is the `lego-drawing` figure
  on `/lab/lego/`, its words set as DOM (R-DRW-8).

## Front wing, 2026 rules (good, at a smaller scale)

- **What it shows:** the same layout for a wide, low part. The 1890 mm span pushes it to 1:20,
  so the drawing is small on the sheet; that is the standard scale working as meant (R-DRW-6),
  not a fault. Sketch `frontwing`, LEGO in `kit/legoformula.ts`.

## Before the playbook (bad)

- **What it shows:** the F1 as first planned, straight in LEGO with no sketch: wings built as
  stacks of plates, thick and stepped. With nothing to measure it against, the only verdict
  anyone could give was that it looked blocky.
- **Where it came from:** the LEGO F1 before 13 November 2026 (commit 082503f and earlier).
- **Rules it illustrates:** R-DRW-1, by its absence.
