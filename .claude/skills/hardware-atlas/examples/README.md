# Calibration cases

The reference card is in `docs/design/hardware-atlas.md`. These cases reproduce
the observed failures; after captures are candidate examples until visually
reviewed. No user endorsement is implied.

| Case | Bad | Expected output and reproduction |
|---|---|---|
| Repeated compute | Only the right die has an accent. | `/lab/icon-kit/?object=accelerator&part=3&open=1`: both compute dies respond. |
| Memory bank | Only one of eight stacks is identified. | Same URL with `part=4`: all stacks have selected outlines in painter order. |
| Board fan-out | Many conductors use one vertical or horizontal lane. | `?object=board&part=0&isolate=1&open=1`: separate supported lanes with real endpoints. |
| Seed 1 lower seams | Square perimeter lines extend past the board's chamfered corners, despite fitting its bounding box. | `/lab/hardware-atlas/?seed=1`: seams follow the actual emitted body profile; `checkSupportedMarkings` rejects the historical rectangular path. |
| Translated board | Laminate marks lie beside the board. | `?object=server&part=1&isolate=1&open=1`: seams follow the board edge. |
| Hollow rim | Annulus tessellation creates radial spokes. | `?object=sensor&part=4&isolate=1&open=1`: barrel opening and ring boundaries remain, without top mesh spokes. |
| Seed strip | Eight thumbnails continually paint at rest. | `/lab/hardware-atlas/?seed=7`: all eight previews remain; profile reports zero idle frame growth. Selecting a preview opens a responsive main. |

`scripts/hardware/capture.mjs` captures the first five cases; `hardware:export`
produces numbered object sheets in both modes and exploded pose. The browser gate
also generates the twelve-seed and six-state audit sheets. Preserve before/after
PNGs and JSON profiles with the exact source commit when filing evidence in the vault.
