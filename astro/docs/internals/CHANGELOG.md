# Changelog

## 2026-11-07 — Apply room appearance to previews

The public gallery opens the room in full colour. The viewer owns one appearance
choice for its main scene and neighbouring seed previews. Room previews use the
same four-canvas frozen preview budget as voxel scenes. The colour browser check
now covers rendered preview changes and the gallery, and runs in CI.

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

## 2026-11-07 — Integrate the room branch with current main

Preserved the newer voxel lab, paper palette and design-system layout while adding
room controls and the room palette ledger. Both GPU template forms supply their
renderer so canvas templates keep their smaller bundle. Capability checks cache
and release their single probe. The room kernel uses `roundRod` for endpoint
cylinders, retaining its rectangular `rod` and the base atlas's hollow `tube` API.
The metadata checker covers both GPU template forms with missing/invalid-callback
counterexamples; its global visual thresholds are unchanged.
