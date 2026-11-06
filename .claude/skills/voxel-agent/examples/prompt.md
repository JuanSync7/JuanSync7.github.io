# Run prompt

Operate as the single voxel agent. Read the voxel-agent skill and system index,
then load the playbook for the stage you are changing. Do not spawn subagents.

Task: <the user's requested change>
Current generator version: <from the plan/report>
Public seed and layout seed: <keep both, or mark which is unknown>
Required scene families: <biomes, landforms, optional components>
Acceptance cases: <what must change and what must remain valid>
Known failed case: <seed, rule and evidence>

Reproduce the failure before changing the kernel. Keep all existing placement,
access, diversity, budget, motion and camera checks. Add a negative fixture for a
new rule. Inspect the numbered atlas and phone view. Record actual outcomes and
unknowns, export the guidance/feedback record to the vault, and hand over paths to
the report, screenshots, source change and any remaining limitation.
