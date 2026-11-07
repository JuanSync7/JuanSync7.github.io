---
name: deepdive-agent
description: Use when changing zoom-dive chip, region, city or room generators, their nested camera or layout verification workflow.
---

# Deep-dive agent

The zoom dive should reward close inspection. A seed chooses a valid arrangement
of a real kind of thing; it does not scatter independent marks and hope they align.
The figure skill still owns palette, line weight, clocks and the existing audit.
This workflow owns the explicitly requested layout kernels and their checks.

Read `SYSTEM.md` and the relevant playbook. `RULES.md` holds falsifiable layout
contracts; `LOOK.md` separates visual judgement from measured facts.

Choose the domain protocol alongside the shared stages:
[chips](playbooks/chips.md), [architecture](playbooks/architecture.md), or
[terrain and cities](playbooks/maps.md).

1. **Reproduce.** Keep the public seed, selected chain/era, level, source fingerprint
   and a before image. A public figure seed and a plan's salt are different inputs.
2. **Research.** Follow `playbooks/research.md`. Inspect a real plan or die photograph
   and record the geometric relationships being emulated.
3. **Model.** Follow `playbooks/layout.md`. Reserve boundaries, the selected part,
   access corridors and routing channels before placing repeated units or detail.
4. **Connect.** Follow `playbooks/connectivity.md`. End a route at a declared terminal,
   doorway, junction or boundary continuation. Check the emitted geometry too.
5. **Prove.** Follow `playbooks/verification.md`. First make a deliberately broken
   case fail; then repair the owning rule and sweep seeds across every level/family.
6. **Look.** Follow `playbooks/review.md`. Inspect overview, close-up, phone and
   transition frames; answer `LOOK.md` with actual artifact paths.
7. **Learn.** Follow `playbooks/feedback.md`. Preserve the failed case, fix and
   evidence. Update the relevant rule/playbook when the failure generalizes.

Run from `astro/`: `npm run deepdive:agent -- check`. Use `review --url=URL` for
the deterministic checks plus visual artifact generation. The script cannot decide
whether an image looks coherent; that review is recorded by the inspecting agent.

Never loosen the global figure audit, route a wire through a component to make it
connect, hide a failed seed behind a fallback, or describe an image not inspected.
