# Figures and drawings

An umbrella: open it for any drawing on the site (a cover, a hero, an illustration, a 3D or canvas
scene, a LEGO model, a room, a voxel world, a baked plate, an icon). Every drawing is a figure,
so the figure playbook comes first, and the table then names the playbook that owns the kind. Links
are paths in the site's `.claude/skills/`, where this agent runs.

## Route

| The work | Open, after [figure](../../figure/SKILL.md) |
|---|---|
| A real object, assembly or part as a hidden-line or engineering drawing, the isometric work cards included, and their words | [drawing](../../drawing/SKILL.md), which sets its words by the lettering playbook |
| Anything built in LEGO | [lego](../../lego/SKILL.md) |
| Hardware atlas models, wiring, repeated parts, SVG exports | [hardware-atlas](../../hardware-atlas/SKILL.md) |
| A seeded themed room: proportions, layout, furniture, materials | [tabletop-room](../../tabletop-room/SKILL.md), then [seeded rooms](seeded-room.md) |
| Lighting a room: source, exposure, fill, shadows, glow | [room lighting](lighting.md), with `templates/lighting-brief.md` |
| A procedural voxel world: biomes, placement, camera | [voxel-agent](../../voxel-agent/SKILL.md) |
| A voxel world's lighting, weather and emission | [voxel atmosphere](voxel-atmosphere.md) |
| The zoom dive: chip, region, city and room layouts | [deepdive-agent](../../deepdive-agent/SKILL.md) |
| A baked plate: render, budgets, manifest, parts moving over it | [art-render](../../art-render/SKILL.md) |
| A baked plate drawn in pen and wash (rooms, furniture, shelves, desks) | [pen-and-wash](../../pen-and-wash/SKILL.md) |
| A framed picture in a baked plate drawn in graphite pencil | [graphite-pencil](../../graphite-pencil/SKILL.md) |
| A static SVG icon for a slide or a page | `slide-icons` (visible on its own: slides use it too) |

## Rooms

For rooms, start from `templates/lighting-brief.md`; use `kernel/INDEX.md` and `checks/README.md`
for contracts and commands. Keep the table as the primary activity, the camera, ceiling and
support contracts and the global figure limits. When room vault feedback is requested, use
`agent-feedback/1` inbox entries and scoped attachment bundles of guidance, templates, references
and focused scripts. Link the exact source revision; keep application source, package metadata,
raw logs, reports and images in the source project. The voxel playbook keeps its own source and
evidence archive workflow.

For the 11 November surface-separation correction, follow lighting rules L9 to L11 and run
`npm run rooms:tones` alongside the existing checks. Inspect per-role values, world-space gradients
and the images that failed before; a global histogram is not enough.

## Every figure

A figure never holds the page (WEB-PERF-4 to 6): bake what never changes, and a heavy figure that
cannot be baked is plotted in as part of its look. Read [motion and performance](motion.md) when a
figure moves or is heavy.
