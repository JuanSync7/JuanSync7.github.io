# Inspect the output

Record yes/no, the file and the relevant object/seed for every question. A no
requires a repair or an explicit scope limitation. Mechanical coverage is in
`checks/README.md`; these are visual judgments.

1. Can the phone drawing be identified by its physical features: ports, die
   layers, fins, optical opening or drive mechanism?
2. Do solid faces hide rear features, with open sockets and hollow barrels still
   open? Inspect the server, power cover, camera barrel and optical connector.
3. Are rim edges and outlines coherent, without radial mesh seams or doubled
   decorative edges? Does wireframe retain the same physical shape?
4. When compute, memory, fans or connectors are selected, do all their repeated
   solids respond? Are the accents confined to the selected semantic assembly?
5. Are board wires supported, separate and attached to real footprints? Do the
   server's layer marks align with the board in isolation?
6. Do front, plan, three-quarter, opening and isolation changes keep the whole
   visible part inside the frame, including during hover?
7. Does the seeded strip scroll without ongoing thumbnail painting? Compare the
   same seed/viewport before and after; report timing as a local measurement.
8. Does selecting a seed retain a live main viewer? Can reduced-motion users
   inspect without motion, and keyboard users choose named parts?
9. Are the figures quiet at thumbnail size? If repeated accents become clutter,
   simplify physical detail; do not silently omit copies from selection.

Required evidence: `hardware-out/*-engineering.png`, `hardware-atlas.seeds.png`,
the three six-state seed audits, `gallery-after.json`, and targeted comparisons
from `capture.mjs`. Export sheets require `hardware:export` followed by capture.
No screenshot proves dimensional accuracy; these remain schematic assemblies.
