# Chip layout review

Read `astro/docs/deepdive-chip-references.md` and the kernel index. First inspect a
real example of the requested era; RF test structures, bipolar analog, NMOS and
modern CMOS have different devices and organisation.

1. Establish the package/die/core boundary, pin-one convention, ordered external
   contacts and the complete selected part. Reserve routing channels and precision
   keepouts before drawing devices.
2. Place repeated macro, memory and execution units using a shared recipe. Vary
   bank counts, lanes and device classes between scenes, not each matched instance.
3. Route named contacts. Preserve signal equivalence through explicit pin groups;
   a repeated string is insufficient proof that two wires share a net. Horizontal
   and vertical metal may cross on different layers; a contact joins them.
   Wire bonds use direct, ordered lead-to-die spans with landing contacts. Reject
   right-angle metal routing, vias, crossed fanouts and mislabeled conductor material.
   For package-to-die handoffs, register the actual child plan's pads, count and
   side order. Retain and inspect the part of each bond inside the portal; the
   frame edge is not a substitute landing. Hierarchy permits own-pad ancestor
   containment, never overlap with an unrelated pad or component.
4. Connect power and return before adding decoupling. Each capacitor needs two
   distinct terminals on those conductors. Guard rings and end pads have physical
   contacts, rather than decorative lines stopping nearby.
5. For analog arrays, verify complete ABBA groups, shared centroids, equal unit
   geometry, gate buses and source/drain contacts. A matched-FET array must not
   become a collection of CMOS logic gates at the next level.
6. For digital cells, check the transistor network and every input combination.
   NMOS load-device logic is distinct from complementary CMOS. Compare the netlist
   to emitted diffusion, poly, metal and contacts; inspect contact footprints as
   well as their centres.
7. Inspect full-size chip sheets and the terminal specimen. At the last physical
   scale the specimen completes before the next journey dissolves in.

Use `chip-check.mjs` and its gate/analog inspectors, then their corruption suites.
Add a negative fixture for each general failure. Keep the existing figure palette,
frame budget and source rules. Geometric and local logic checks are not foundry
DRC/LVS, extracted timing or analog simulation.
