# Standards register (R-DRW-15)

Each ISO standard a drawing follows, what it sets, and where it is held. The last column names
the reference implementation, juansync.dev's drawing kernel (`astro/src/figures/kit/draft*.ts`);
another project names its own. "Not yet" lines are the honest gaps.

| Standard | What it sets | Held on juansync.dev by | Status |
|---|---|---|---|
| ISO 216 | A-series paper (A3 420 × 297 mm) | `A3` in `draftbase.ts` | followed |
| ISO 5457 | Sheet layout: frame 20/10 mm, 0.7 mm frame line, grid reference border of 50 mm fields, centring marks | `draftsheet.ts` | followed |
| ISO 7200 | Title block: eight mandatory fields, identification number bottom right, no scale or projection fields | `titleRows` in `draftbase.ts` | followed |
| ISO 5455 | Standard scales (1:2, 1:5, 1:10, 1:20 and so on) | `SCALES`; `partPlan` and `gaPlan` pick the largest that fits (R-DRW-6, R-DRW-17) | followed |
| ISO 5456-2 | Projection: first angle, its symbol | `TURN`, `symbolLines` | followed; symbol proportions not yet checked against the standard |
| ISO 128-2, -20 | Line types and widths: thick 0.5, thin 0.25 (2:1) | `WEIGHT`, widths in paper mm | followed |
| ISO 128-3, -30 | Views: placement, names | `partPlan`, `gaPlan` | followed |
| ISO 128-40, -44 | Sections: cutting plane thin chain, thick at its ends, arrows, letters, "A-A" | `partPlan` | followed |
| ISO 128-50 | Hatching: thin, 45 degrees, even spacing; very thin sections may be filled solid | `hatch` | hatched; solid fill for thin sections not used |
| ISO 129-1 | Dimensioning: value placement and reading direction, extension gaps, arrowheads, the diameter sign | `dimmer`, `dimLines`, `arrow` | followed |
| ISO 10209 | Vocabulary: general arrangement, assembly and detail drawings | the sketch's `doc` (`ga`, `assembly`, `detail`) | followed for the names; not checked against the full vocabulary |
| ISO 6433 | Item references: balloons, leaders ending in a dot | `callouts` in `draftga.ts` (R-DRW-20) | followed; balloon circle size not yet checked against the standard |
| ISO 7573 | Parts list: item, title, quantity, reference, on its own sheet or above the title block | `partsListSheet` in `draftsheet.ts` (R-DRW-18) | followed as a separate sheet; material column not used (none of our parts has one) |
| ISO 3098 | Lettering type B: letter shapes on the grid, heights 1.8, 2.5, 3.5, 5, 7 mm, line width h/10, spacing 2d, words 6d | the vault playbook `Playbooks/lettering` (R-LET) | followed: drawn from the standard's construction rules, not certified against its figures |
