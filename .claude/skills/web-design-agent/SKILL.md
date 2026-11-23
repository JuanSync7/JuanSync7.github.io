---
name: web-design-agent
description: Use when anything about how juansync.dev looks or moves changes (pages, components, tokens, type, figures and drawings such as 3D, LEGO, rooms, voxel worlds and baked art, page transitions, performance) or the visual evidence workflow is run.
---
# Web design agent

One agent operates this workflow. Read `SYSTEM.md`, then the umbrella for the work below,
`RULES.md` and `LOOK.md`. The umbrella routes to the playbook that owns the work; open only what it
routes you to. The playbooks under an umbrella are hidden from the skill list on purpose
(`disable-model-invocation`), so they are reached through it.

**File budgets come first** (rule WEB-BUDGET in `RULES.md`). Every source file has a line budget, and the numbers live in the
lint config, not here: `astro/eslint.config.js` (`max-lines`, and its larger override for
three.js figures) and the figure check's `length` rule. Read them before writing. A file that
would go past its budget is doing two jobs: name the second file and plan the split by job before
writing, never by packing lines after lint fails.

**Motion runs on the compositor, and figures never hold the page** (rules WEB-PERF-1 to 7 in
`RULES.md`). Anything that moves animates only `transform` and `opacity`; work whose answer never
changes is done at the build; a page's figures build one at a time. Measure before and after with
the probes in `checks/perf/`, and open the motion umbrella whenever a change adds motion, a figure
or a heavy graphic, or something lags.

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

Choose the umbrella:

- [Page design](playbooks/page-design.md): a page, section, component, token, the type or the layout.
- [Figures and drawings](playbooks/figures.md): any drawing, a 3D or canvas scene, LEGO, a room, a voxel world, a baked plate, an icon.
- [Motion and performance](playbooks/motion.md): a page transition, any animation, or anything that lags or freezes.

Do not spawn another agent merely to run a playbook. A missing measurement stays unknown.
A generated contact sheet requires actual visual review. Project feedback does not adopt
global vault guidance. The current user's instruction controls whether to merge or publish.
