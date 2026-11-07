# Kernel index

Paths are relative to `astro/src/figures/kit/` unless marked otherwise. Read the
owner for the stage being changed; do not fork its geometry in a preview script.

| Owner | Responsibility |
| --- | --- |
| `dive.ts`, `dive-plan.ts` | Figure API, seeded level dispatch, chain/era identity and raw/finished plans. |
| `sketch.ts` | Drawing primitives, selected-window geometry, semantic model retention and portal clipping. |
| `dive-camera.ts`, `dive-render.ts` | Nested coordinate transforms, continuous level handoffs and scale-dependent drawing. |
| `dive-connections.ts` | Projected parent/child entrance relationships, tapered approaches and exact outline openings. |
| `silicon.ts`, `dies.ts`, `circuits.ts`, `eras.ts`, `analog.ts` | Silicon scale families and their drawing adapters. |
| `chip-plan.ts`, `chip-analog-layout.ts`, `chip-detail.ts` | Chip component, terminal and route model, matched analog placements and physical detail. |
| `chip-types.ts`, `chip-routing.ts`, `chip-channel.ts` | Typed contacts/net contracts and obstacle-aware channel routing. |
| `chip-matched-fingers.ts`, `chip-matched-lead.ts`, `chip-matched-cell.ts` | ABBA diffusion/electrode layout, precision access and analog terminal specimens. |
| `chip-power.ts`, `chip-digital-detail.ts`, `chip-bipolar-layout.ts` | Connected power networks, repeated digital organisation and reference-based bipolar floorplan. |
| `chip-bond.ts` | Material-specific direct wire-bond spans and landing contacts; no planar metal-routing elbows or vias. |
| `chip-package-pins.ts` | Projection of actual next-die pad contracts into explicit nested package geometry. |
| `gates.ts`, `chip-gate-layout.ts`, `chip-gate-supply.ts` | Digital transistor topology, physical conductors/contacts and shared supplies. |
| `maps.ts`, `map-layout.ts`, `map-parcels.ts`, `map-types.ts` | Urban street graph, blocks, parcels and model contracts. |
| `map-region.ts`, `map-contours.ts`, `map-paint.ts`, `map-region-paint.ts` | Shared-field relief/contours, drainage and map drawing. |
| `rooms.ts`, `architecture-plan.ts`, `architecture-draw.ts`, `urban-block.ts`, `furniture.ts` | Building/room circulation, openings, block frontages and furniture. |
| `architecture-cores.ts`, `architecture-programme.ts` | Measured stair/lift prototypes, landings and repeated meeting-wing programmes. |
| `../templates/zoom-dive.ts` | Figure grammar and presentation; no independent layout implementation. |
| `astro/scripts/deepdive/geometry.mjs` | Independent geometric predicates used by checks. |
| `astro/scripts/deepdive/` | Seed sweeps, negative fixtures, browser/gallery artifacts and run orchestration. |

`Sketch.model` preserves the domain model for inspection. It is evidence to measure,
not an automatic guarantee: compare route endpoints, openings and boundaries with
what the renderer actually emits.
