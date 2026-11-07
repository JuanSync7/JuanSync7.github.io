# Changelog

## 2026-11-07 — Whole-room design

The seeded room viewer now opens with a complete isometric room at human furniture
scale. The oversized tabletop grammar is converted at one boundary, with independent
monitor/tower sizing, theme-specific secondary zones, appropriate seating/storage,
architectural finishes, window/door treatments and source-aligned lighting.

The user's proportion correction is preserved as a failing before-case. Independent
program checks cover scale, required furnishings, floor supports and circulation;
geometry checks now distinguish separate rugs from furniture/support contact and use
the actual door span. The room playbook separates rules, look, kernel index and checks.
The work item and rulings are in `../room-design-treatment.md`.
