---
name: blueprint
description: Use when a shared component or page template on juansync.dev gets, changes or is read through its blueprint, or when someone asks for a design change in the drawing's words ("part 3's gap, smaller").
---

# Blueprints on juansync.dev

The blueprint system is a playbook of the web design agent, not an agent of its own. Its one
source is the experience vault's `Playbooks/blueprint` (SKILL.md, RULES.md, LOOK.md, kernel/INDEX.md):
read that SKILL.md first and follow it. The kernel copies here are
`astro/src/blueprints/{types,dom,measure,sizing,drawing,catalogue,overlay}.ts`, with the playbook's checks
`astro/src/blueprints/harness.ts` and `astro/scripts/blueprints/run.mjs`; never edit them here
(`npm run blueprint:sync -- <vault> [--check]`). If the vault isn't reachable, say so and work
from `astro/src/blueprints/README.md`.

This project's own parts:

- Specs: `astro/src/blueprints/<id>.ts`, listed in `index.ts`. The index a request is matched
  against: `astro/src/blueprints/INDEX.md` (`npm run blueprint:index`).
- Where they show: the lab (`/lab/blueprints/`, one page per blueprint with its live drawing at
  desktop and phone, its index rows and its spec) and, for components, `/design-system/` under the
  component (`<BlueprintView>`). Stored sheets: `public/blueprints/<id>[-phone].png`.
- Checks (dev server up): `blueprint:check`, `blueprint:selftest`, `blueprint -- <id> --store`;
  inside `npm run check`: `blueprint:index:check` and `site:tokens` (the zero list).
- Tokens live in `astro/src/styles/tokens/`; a new one is shown on `/design-system/` (CLAUDE.md).

Design follows the `site-taste` skill; words on a drawing follow the lettering playbook.
