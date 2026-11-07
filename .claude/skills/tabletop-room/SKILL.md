---
name: tabletop-room
description: Build, refine and validate the seeded Three.js tabletop rooms in the Astro lab, including themed geometry, physical clearances, procedural materials, monochrome/full-colour appearance, lighting and fallback rendering. Use when changing pixel-still or its room controls, kits, palette or verification scripts.
---

# Seeded tabletop rooms

Read `CLAUDE.md`, the `figure` and `site-taste` skills, then
`astro/docs/tabletop-rooms.md` and this skill's
[material and lighting rules](references/materials-and-lighting.md).

The user explicitly requested full colour and a monochrome switch on 7 November
2026. This is a scoped exception to the figure skill's single-accent rule for
`pixel-still`. Keep every other figure's palette and thresholds unchanged.

## Build rules

1. Work in `astro/`. Drawing code lives in `src/figures/`; React only passes controls
   through `FigureCanvas.data`. No private animation loop, DOM queries, timers or
   per-frame random choices in figures or their geometry.
2. Keep kit files below 200 nonblank lines and the Three.js figure below 350.
   Use strict types. Geometry, materials, lighting and rendering have separate jobs.
3. Preserve the seed's theme and object placement. Appearance changes must not
   change geometry, selection, camera angle, zoom or the seed. A new seed must
   preserve the chosen appearance while the viewer remains mounted.
4. Keep the 0–180° entrance camera contract, eye height and true orthographic
   isometric preset. Fit visible furniture, keep the table flush to the back wall,
   and cut away the near return wall with its hidden fixtures.
5. Distinct objects need distinct physical footprints. Feet meet their support;
   rugs are explicit supports. Clear the central entrance aisle and door approach.
   Check actual model bounds and outward normals, including reversed profiles.
6. Materials and lights take colours through `kit/ink.ts`. Room colour values live
   in `roomTones`, mirrored by `--nt-room-*` CSS tokens and the design-system ledger.
   Do not put room colours in the `night` palette or widen its audit band.
7. Texture belongs to the material. Use deterministic world-space coordinates,
   consistent grain direction and derivative filtering. Bump changes lighting,
   never the collision geometry. Avoid visible random speckles or moiré at phone size.
8. Choose materials and lighting from the theme. Give each visible light an actual
   fixture or emitting object. Use a single shadow key, restrained fill, practical
   lights and a prefiltered reflection environment. Preserve highlight detail.
9. Compose material-detail and shadow shader hooks locally. Never mutate global
   Three.js shader chunks. Dispose reflection targets, geometry, materials, shadow
   maps and renderer resources when a scene is unmounted.
10. Update both WebGL and the 2D fallback. The fallback uses the same geometry,
    clearances, camera, cutaways and palette, with simpler material detail.
11. Static rooms use `ThreeFrame.renderWhen` to redraw when camera, appearance,
    pointer selection or size changes. Keep the shared clock. Generate reflection
    maps only when colour is first used, and remount preview canvases by seed so
    released WebGL contexts are never reused. Preserve outer-button focus.

## Verification and handoff

Run `npm run rooms:verify -- --url=http://127.0.0.1:4410` from `astro/` with the
Astro dev server running. The script runs the source/type/lint checks, production
build, geometry/material checks, targeted figure audit, both browser suites, the
full-colour frame budget and idle-redraw checks, seed
sheet, compact galleries and the whole-site figure audit. It writes
`figures-out/room-validation.json`; a failed stage stops the run.

Read the targeted audit sheet, twelve-seed sheet, all nine colour/monochrome
pairs and the camera captures. The audit numbers do not replace visual review.
If the shared audit code is changed, run `figures:selftest` too. Do not loosen a
threshold to get a pass. Fix the cause and rerun the affected stage, then complete
the final verification.

Save the playbook, new rules, scripts and skill updates with the code. Hand over
actual scene previews and the validation result. `rooms:verify` never publishes,
pushes a branch or sends external messages; publication is a separate action.
