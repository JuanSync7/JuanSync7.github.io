# Voxel-world workflow

The voxel agent owns changes to `/lab/voxel-scene/`. It is one agent with stage-specific
playbooks and deterministic scripts, so each correction can become a reproducible
check instead of a larger prompt.

Start at [the agent entry](../../.claude/agents/voxel-agent.md) and its
[skill](../../.claude/skills/voxel-agent/SKILL.md). The
[system index](../../.claude/skills/voxel-agent/SYSTEM.md) maps code, APIs and limits;
[rules](../../.claude/skills/voxel-agent/RULES.md) map failures to tests;
[visual review](../../.claude/skills/voxel-agent/LOOK.md) holds the remaining judgment.
The [run prompt](../../.claude/skills/voxel-agent/examples/prompt.md) carries the task.

From `astro/`, run `npm run voxel:agent -- replay --seed=42` for an inspectable plan and
placement summary, or `npm run voxel:check` for the mechanical gate. Build before
`npm run voxel:browser`; that script can start its own preview. The fixture and motion
checks are part of the voxel gate. CI runs the gate and browser checks.

The stages are plan → terrain and local climate → component recipes and full shapes →
constraint placement and paths → render/light/camera → mechanical and visual checks →
feedback. Shape bounds are measured before choosing a coordinate. Counts can be zero;
there is no universal house, boat pair, central platform or ocean border.

The catalog contains woodland, rainforest, plains, desert, oasis, tundra, snow, frozen
ice lands, wasteland, volcanic, mushroom, village, city and caves. Compatible pairs can
share a continuous terrain field. Landforms include islands, archipelagos, slices,
valleys, dunes, Alps, canyons, calderas and cutaway caverns.

Limits: this is a bounded diorama generator, not an editable Minecraft simulation.
Conservative envelopes can omit a prop that would fit a more expensive solver; omissions
are reported. Access groups can remain separate across water or steep terrain. Default
framing fits the world; user zoom can intentionally crop edges. A version change may
change old seed pictures. Visual checks still need human judgment.

The vault export saves a maintained mirror and evidence under curated Voxel agent
notes. It does not copy private vault context into the public site or mark agent-authored
guidance approved. See the feedback playbook for the incremental loop.
