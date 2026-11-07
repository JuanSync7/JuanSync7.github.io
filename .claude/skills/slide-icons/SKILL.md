---
name: slide-icons
description: Use when a slide or web page needs an icon, an existing icon does not fit, or a static SVG icon needs adding, revising or reviewing.
---

# Slide and web icons

The subject is open. Follow the slide's meaning and the site's taste. A bathtub,
instrument, household object or new metaphor is as valid as a processor. The
library is a starting point, not a list of permitted concepts.

## Route by stage

| Stage | Load now | Do / exit |
| --- | --- | --- |
| Find and judge | [Fit](stages/fit.md) | Search themed icons and library references. Exit with a recorded reuse/create decision for the actual brief. |
| Reuse fits | [Reuse](stages/reuse.md) | Preserve the selected source, license and useful silhouette. Exit with a pinned source/spec. |
| Create is needed | [Create](stages/create.md), [craft rules](RULES.md) | Choose a view, visible parts and relevant physical constraints. Exit with an original source/spec. |
| Check and look | [Review](stages/review.md), [LOOK](LOOK.md) | Run deterministic checks and inspect the configured size proofs. Exit with evidence tied to the exact revision. |
| Integrate | [Ship](stages/ship.md) | Update generated assets and run the affected integration checks. Exit with a report of what passed and what remains unknown. |

Use `npm run slides:brief -- --stage=fit --task="slide meaning"` from `astro/`
for a versioned packet of the current stage. Change `--stage` as work advances;
add `--id` when reviewing an existing candidate. The receipt records supplied
context, not proof that it was read or followed.

Read only the current stage and its links. Retain the brief, chosen source and
specification; iterate the failing part instead of restarting the concept.

## Boundaries

Icon authors own source SVGs, source specifications, fit decisions and review
records. The maintained [kernel API](../../../astro/scripts/slides/kernel/README.md)
and [checks](../../../astro/scripts/slides/checks/README.md) are read-only to an
asset task. The repository guard enforces the change boundary in CI.

Theme dimensions and tolerances come from `astro/scripts/slides/rules.json`.
Catalog size, family names, subject names and camera descriptions are never caps.
A new normal subject uses existing constraint types without a validator edit.
A genuinely new geometric operation goes through the maintainer lane with a
failing example, a passing example and an independent review. Keep its asset
unapproved while that capability is unresolved; do not weaken a check.

Playbook maintainers load [EVAL](EVAL.md). Asset authors do not need the evaluation
suite. This skill implements the user's current request; its later behavioral
results are evidence, not automatic adoption into the vault's rule package.
