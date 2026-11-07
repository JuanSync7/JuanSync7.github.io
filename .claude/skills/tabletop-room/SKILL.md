---
name: tabletop-room
description: Use when creating or refining the seeded themed rooms in pixel-still, including room proportions, functional layouts, furniture, architectural finishes, lighting, materials, camera controls or verification.
---

# Complete themed rooms

Read the project `CLAUDE.md`, the `figure` and `site-taste` skills, then
`RULES.md`, `LOOK.md` and `kernel/INDEX.md` here. The current implementation and
commands are described in `astro/docs/tabletop-rooms.md`.

## Workflow

1. **Brief.** State the room's purpose and the defining activities it must support.
   Read the reference card and treatment. Preserve the seed URLs, colour switch,
   eye-height camera and 0–180° entrance arc.
2. **Scale first.** Use `ROOM_METRICS` and `roomPlan`. The table grammar's original
   dimensions are local coordinates, not room furniture dimensions. Run
   `npm run rooms:program` before polishing. A desk must leave a room around it.
3. **Plan activities.** Choose primary work/dining, secondary use, storage and
   entrance zones. The dining table permits seats on both sides; task surfaces
   meet the back wall. Use the plan's shared position anchors for fixtures and lights.
4. **Build specific things.** Use `placedRoomPart`, measured post-transform bounds,
   and the relevant furniture builders. Add the parts that identify an object:
   cupboard doors and shelves, sink basin and tap, chair structure and upholstery.
   Materials preserve the semantic finish of inserted room accessories.
5. **Finish the room.** Coordinate windows, coverings, door hardware, wall and floor
   treatment, textiles and fixtures with the same theme. Apply seeded variants to
   real design choices. Stop filling when the space supports its activities.
6. **Light actual sources.** Fit daylight to the casement opening, clinical light to
   ceiling/task fixtures and bar light to pendants. Keep the single shadow key,
   fill and practicals distinct. Compose texture and PCSS hooks locally and dispose
   GPU resources. Static rooms use the shared clock and render on demand.
7. **Check.** Run `npm run rooms:verify -- --url=http://127.0.0.1:4410` in `astro/`
   with the dev server running. It records a failing placeholder first, stops on
   failure and writes `figures-out/room-validation.json`. The independent geometry,
   program and material checks live in `scripts/figures/`, apart from scene kits.
8. **Look.** Read the targeted audit, twelve-seed sheet, nine colour/monochrome
   pairs, fallback images and camera captures. Answer `LOOK.md`. Fix the cause of
   a failed check or visible defect; keep the figure skill's six-pass cap.
9. **Handoff.** Save code, playbook, rules, reference/treatment, kernel index, checks
   and actual preview evidence. State what remains unverified. When the user asks
   for vault feedback, use its `agent-feedback/1` inbox and archive the exact
   supporting package. A project report does not adopt global guidance.

The user's 7 November 2026 requests authorize full colour for this room and the
whole-room redesign. Other figures keep the existing night palette and thresholds.
Room material/light values live in the separate mirrored `roomTones` token family
and enter geometry through `kit/ink.ts`. See `references/materials-and-lighting.md`.

## Tools and limits

`checks/README.md` maps each acceptance rule to its command. `kernel/INDEX.md`
names the public geometry/material/view functions and their coordinate gotchas.
Keep strict TypeScript, kit files below 200 nonblank lines and the Three.js figure
below 350. No figure-owned DOM, clocks, animation loops or per-frame randomness.
No public push or deployment is part of `rooms:verify`.
