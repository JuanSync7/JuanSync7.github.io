---
name: voxel-agent
description: Use when changing or evaluating procedural voxel worlds, biome content, placement, camera behaviour or voxel feedback.
---

# Voxel agent

One agent owns the run. Scripts enforce geometry and distribution rules; the agent
judges the pictures. Read `SYSTEM.md`, then the relevant playbook rather than every
playbook at once. `RULES.md` maps failures to checks; `LOOK.md` holds visual questions.

For lighting/weather changes, the web design agent uses this geometry workflow with
[the atmosphere playbook](../web-design-agent/playbooks/voxel-atmosphere.md). Operate as one agent.

1. Record the requested change and acceptance cases with the existing generator version.
   Reproduce a failing seed or composition before editing.
2. Research visual/scale changes with `playbooks/research.md`. Follow `pipeline.json`
   for the executable stage order. Use `terrain.md`, `ecology.md`, `components.md`,
   `placement.md`, `places.md`, `ambience.md` and `performance.md` at their owning stages.
   Retain upstream outputs; the manifest and run trace must agree.
3. Run `npm run voxel:check`. New checks need a broken fixture that fails for the
   intended reason. Use `npm run voxel:agent -- replay --seed=N` to inspect a run.
4. Build and run `npm run voxel:browser`. Inspect the numbered atlas and phone view.
   Run the figure look for its audit seeds. Answer `LOOK.md` with artifact paths.
5. Follow `playbooks/feedback.md`: keep seed, rule, observed fault, source fingerprint
   and evidence. Export the maintained guidance mirror and run record to the vault.
6. Hand over the actual changes, measured results, screenshots and remaining limits.
   Publishing follows the user's instruction; a passing local run is not a deployment.

Never replace a failed scene with a hidden default house/island. A valid omission
is reported. A failed invariant stops the run. Do not weaken checks to pass a picture.
