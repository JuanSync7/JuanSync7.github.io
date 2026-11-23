---
name: web-design-agent
description: Use when changing website design, seeded interiors, interactive scene lighting, weather, or the visual evidence workflow.
---
# Web design agent

One agent operates this workflow. Read `SYSTEM.md`, then the applicable playbook,
`RULES.md` and `LOOK.md`. Use the figure skill for drawings and site-taste for controls
and page composition. Use the voxel-agent workflow when procedural world geometry,
biome generation or placement changes. Room work also reads
`../tabletop-room/SKILL.md` and its rules, look questions and kernel index.

**File budgets come first** (rule WEB-BUDGET in `RULES.md`). Every source file has a line budget, and the numbers live in the
lint config, not here: `astro/eslint.config.js` (`max-lines`, and its larger override for
three.js figures) and the figure check's `length` rule. Read them before writing. A file that
would go past its budget is doing two jobs: name the second file and plan the split by job before
writing, never by packing lines after lint fails.

**Motion runs on the compositor, and figures never hold the page** (rules WEB-PERF-1 to 7 in
`RULES.md`). Anything that moves animates only `transform` and `opacity`; work whose answer never
changes is done at the build; a page's figures build one at a time. Measure before and after with
the probes in `checks/perf/`, and follow [the performance playbook](playbooks/performance.md)
whenever a change adds motion, a figure or a heavy graphic, or something lags.

1. Record the user's correction, affected scenes, acceptance cases and current source.
2. Reproduce the old result. Load references and extract the visual/physical constraints.
3. Implement through the owning kernel and template. Keep mechanical limits in policy;
   name the failure case when changing a kernel or check. Keep fixed figure thresholds.
4. Run independent checks with negative fixtures, then inspect actual pixels at desktop,
   phone and reduced motion. A property named `shadows` does not prove a visible shadow.
5. Review the comparison sheets. Fix unreadable night scenes, invisible weather,
   clipped subjects or unrelated glow. Preserve contrary evidence and remaining limits.
6. Archive the requested artifacts under the vault's Web design agent area using the
   owning workflow. Guidance remains draft/unreviewed. Open the requested PR; report
   its actual URL and check status. A passing check is not publishing approval.

Choose the relevant playbook:

- [Room lighting](playbooks/lighting.md): source, exposure, fill, shadows, colour, glow and atmosphere.
- [Seeded rooms](playbooks/seeded-room.md): coordinated palettes, furniture design and functional placement.
- [Voxel atmosphere](playbooks/voxel-atmosphere.md): lighting, weather, practical emission and GPU evidence.
- [Motion and performance](playbooks/performance.md): an animation that stutters, a page or figure that freezes as it loads, or new motion or a heavy figure.
- [Blueprints](../blueprint/SKILL.md): a component's or page's parts, sizing and tokens, and design changes asked for by name.

For rooms, start from `templates/lighting-brief.md`; use `kernel/INDEX.md` and
`checks/README.md` for contracts and commands. Preserve the table as the primary
activity, camera/ceiling/support contracts and global figure limits. When room vault
feedback is requested, use `agent-feedback/1` inbox entries and scoped attachment
bundles of guidance, templates, references and focused scripts. Link the exact source
revision; keep application source, package metadata, raw logs, reports and images in
the source project. The voxel playbook retains its own source/evidence archive workflow.

Do not spawn another agent merely to run a playbook. A missing measurement stays unknown.
A generated contact sheet requires actual visual review. Project feedback does not adopt
global vault guidance. The current user's instruction controls whether to merge or publish.

For the 11 November surface-separation correction, follow lighting rules L9–L11
and run `npm run rooms:tones` alongside existing checks. Inspect per-role values,
world-space gradients and actual failed-before images; a global histogram is insufficient.
