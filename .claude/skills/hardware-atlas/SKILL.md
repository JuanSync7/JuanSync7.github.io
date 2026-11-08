---
name: hardware-atlas
description: Use when creating or repairing hardware atlas models, wiring, repeated-part inspection, solid or wireframe rendering, SVG exports, camera framing or seeded gallery performance.
---

# Hardware atlas

Use this playbook in the existing coding agent. Read the site's `figure` skill,
`RULES.md`, `LOOK.md` and `kernel/INDEX.md`. The system and references are in
`docs/design/hardware-atlas.md`; the current brief and revision record are in
`docs/design/hardware-atlas-treatment.md`.

## Work in order

1. **Bound the repair.** Record the object, seed, viewport, mode, camera, opening,
   detail and selected part that reproduce the defect. Name the failure class and
   its sibling cases. Preserve before captures; do not overwrite them with afters.
2. **Read the reference card.** For a new object, inspect several real references,
   including a plain assembly diagram. Record shared physical rules before drawing.
   For a repair, preserve the features the user has already judged useful.
3. **Build in model space.** A named part is a semantic assembly, a solid is one
   physical piece, and a surface belongs to a solid. Repeat solids inside a part
   when all copies should lift, isolate and highlight together. Use `Draft` and
   the shared builders. Do not make separate canvas and SVG geometry.
   Use `laminate(p)` immediately after its host extrusion: it reads the emitted
   profile, including chamfers and transforms. Do not redraw a rectangular seam
   from the host's width/depth bounds.
4. **Route on a support.** Use `Draft.trace(points, from, to)` on the board or
   interposer that carries it. Derive every source, sink and lane from the actual
   footprints. Independent conductors need separate lanes. A line that represents
   an exposed pin, winding or flex conductor is different from a board trace;
   name that physical feature in the part note and inspect its attachment.
5. **Inspect as one assembly.** Every visible repeated solid gets an accent when
   its part is selected. Other assemblies remain grey. Pick from the unlifted
   pose with the same camera and framing used to paint. Preserve painter order:
   an accent behind an opaque face stays hidden.
6. **Choose detail and rendering deliberately.** Hide tessellation seams; retain
   physical rims, creases and openings. Translate markings with their host.
   Thumbnails are still previews; selecting one opens the live main viewer. Skip
   unseen warm-up geometry for this responsive, time-independent template.
7. **Check before judging.** Run `npm run hardware:check` in `astro/`. It includes
   negative fixtures; do not weaken a threshold to clear a model. After code is
   final, run `npm run hardware:verify`. It stops on the first failed command.
8. **Look in the browser.** Read the numbered object sheets, seed sheet, six-state
   audits and targeted before/after views. Answer `LOOK.md` with exact filenames.
   A passing structural test cannot establish that a socket or overlap looks right.
9. **Hand over evidence.** Give the source SHA, commands and outcomes, failed cases
   fixed, remaining limits, and screenshots. When vault storage is requested,
   archive the exact playbook, kernel and checks with a SHA-256 manifest and an
   `agent-feedback/1` report. Open PRs; merge and deployment need their own scope.

## Ownership

Ordinary model work edits the relevant model builder and its reference/treatment.
The kernel and checks are read-only for that work. A request to repair the atlas
pipeline may change them in a separately reviewable infrastructure change, with
failing fixtures and independent review. This playbook grants no new permissions.
Never edit the general figure audit or its thresholds to make an atlas model pass.

## Tools

| Tool | Use and pitfall |
|---|---|
| `hardware:check` | Model, projection, routing, repeated signals, transitions and fault fixtures; no browser needed. |
| `hardware:export` | Writes SVGs and numbered sheets to ignored `astro/hardware-out/`; rerun after geometry changes. |
| `hardware:browser` | Builds must already exist. Runs UI checks, normal-motion gallery regression and figure audits. |
| `hardware:verify` | Complete local gate: repository checks, atlas checks, build, export and browser checks. |
| `hardware:archive -- /absolute/path` | Archives committed source and readable playbook copies with hashes. Refuses changed existing bytes; use a new directory for a new revision. |
| `gallery-profile.mjs` | Same viewport and seed before/after; `--check` rejects idle thumbnail work. Timing is host-dependent evidence. |
| `capture.mjs` | Browser PNGs from exported sheets and targeted workbench URLs; inspect the images. |

See `checks/README.md` for exact commands, output paths and configuration.
