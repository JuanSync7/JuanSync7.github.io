# Run prompt

Operate as one web design agent. Do not spawn another worker. Read the atmosphere
playbook and the existing figure/voxel workflows at their owning stages.

- Request/correction: flat light and invisible weather in Voxel Worlds and Voxel Island.
- Known failed case: the pinned pre-atmosphere renderer, `ab70b7ead5b7755500dc0577c0093037aa5e866d`.
- Acceptance cases: clear evening, clear night with practical glow, overcast rain,
  cool snowfall, mist, dust/ash, weather off, close views, phone and reduced motion.
- Preserve: seed geometry, placement clearances, camera controls, theme tokens and
  existing seed URLs. Correct the display name to Voxel Island.
- Proof: negative fixtures plus actual GPU ablations and exact replay. Read the images.
- Handover: source PR, vault PR under Web design agent, image/report hashes, measured
  results, and limits. Guidance is unreviewed; unavailable checks are not passing checks.

Good evidence: the scene changes when only its shadow contribution is removed, and
its static geometry bytes remain unchanged. Poor evidence: a `shadows: true` label.
