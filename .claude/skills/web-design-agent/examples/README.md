# Review examples

## Rooms

Use `/lab/pixel-still/?seed=6` (study), `?seed=10` (bar), `?seed=3`
(laboratory), `?seed=11` (computer) and `?seed=38` (dining). These retain their
established themes and tabletop inventories because new choices follow the existing
seed stream. Compare Full colour and Monochrome at isometric 135°, then Eye level
at 0°/90°/180°, including a phone viewport.

`npm run rooms:variation -- --url=…` finds four public palette seeds per theme from
the actual planner, writes the seed/variant mapping in its local report and captures
both renderers. `figures-out/room-variants-{webgl,fallback}-{colour,mono}.png` are
review sheets, not hand-authored mockups. Read them before accepting the design.

Bad examples are executable: the lighting check mutates real output into excessive
ambient fill, an extra shadow caster, dense fog, detached glow and glow through
walls and a window key blocked by the wall. The variation browser flattens an actual monochrome image and requires its
tonal check to reject it. The existing room regressions retain overlapping,
floating-support, wrong camera and opaque floor/ceiling failure cases.

## Voxel atmosphere

The pinned old renderer is the failed example for flat light/invisible weather.
`voxel:atmosphere-browser` regenerates its images and the current day/evening/night,
rain/snow/mist/dust/ash comparisons. The vault stores those exact outputs and their
hashes; use the archived run's images as evidence, not a promise about future changes.

`prompt.md` is the bounded task template. Reference documents live in
`docs/voxel-agent/atmosphere-references.md`; the fixed figure skill owns generic audits.
