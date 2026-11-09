---
name: web-design-agent
description: Project workflow for designing and verifying JuanSync web scenes; route seeded interiors and lighting through the existing figure and tabletop-room skills.
---

# Web design agent workflow

This is the user's requested project filing and workflow boundary. It is not a
new autonomous agent, an approved vault-wide agent registration, or permission to
delegate. Reuse the existing figure and tabletop-room kernels. The vault's
VAULT-75 catalog proposal is still a plan; do not invent registry IDs or claim its
gates already exist.

For seeded interiors, read `../tabletop-room/SKILL.md`, its rules and look questions,
then read `RULES.md` and `LOOK.md` and choose the relevant playbook here:

- `playbooks/lighting.md`: source, exposure, fill, shadows, colour, glow and atmosphere.
- `playbooks/seeded-room.md`: coordinated palettes, furniture design and functional placement.

Start from `templates/lighting-brief.md`; find implementation contracts in
`kernel/INDEX.md` and verification in `checks/README.md`. Read only the referenced
implementation needed for the change. Preserve the table as the primary activity,
the camera/ceiling/support contracts and the global figure audit.

Work in this order: brief → source and reuse research → room plan → neutral lighting
→ materials and palette → restrained effects → checks → visual review → PR.
A generated contact sheet is evidence to inspect, not proof of good design.

When vault feedback is requested, propose these project artifacts through its
`agent-feedback/1` inbox and scoped attachment bundles under this workflow's name.
Include source PR/version and actual check outcomes. Archive requested guidance,
templates, references and focused scripts; keep application source, package
metadata, raw logs, reports and images in the source project. Do not promote
project decisions into approved global guidance through an intake PR.
