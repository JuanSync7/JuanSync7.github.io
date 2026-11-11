# PCB, package and die detail

**Use when:** changing board neighborhoods, package construction or modern die
floorplans. Read the primary image references in
`astro/docs/deepdive-chip-references.md` before choosing a recipe.

1. Pick a whole architecture before its detail. A PCB organizes power, clocks,
   memory and edge connectors; a package organizes logic, memory and their shared
   interconnect; a die organizes compute, cache, control and boundary interfaces.
   Repeating one generic grid at all three scales loses this hierarchy.
2. Reserve real routing and component space. Connect additional traces through
   named macro ports or actual footprint pads. A parallel line is a conductor only
   if its two ends and layer are modeled. A bend on one copper layer is not a via.
3. Make the package substrate and interposer distinct physical envelopes. Keep
   decouplers in their reserved neighborhoods and the selected die complete.
   Draw an exposed layer or cutaway deliberately; do not imply that opaque dies
   reveal every hidden contact beneath them.
4. Model a contact field once, with an owner, exposed box, origin, pitch, row/column
   count and radius. Emit its actual sites. Fine microbumps and coarser package
   joints have different pitches. Do not replace a failed contact with a dot nearby.
5. Underfill follows its own die as an attached perimeter. HBM has a base interface,
   inset repeated memory layers and a local vertical-interconnect region. Its
   lateral links meet that base through the interposer, not arbitrary top stripes.
6. Vary valid macro arrangements and compatible counts. Repeated units within one
   drawing retain their dimensions, pitch and facing. A new variant name must
   correspond to different emitted placement, not an unused random label.
7. Run the existing chip checks plus the surface inspector and its corruption
   fixtures. Check whole circles and routes in emitted linework; metadata alone
   cannot establish that a bump or trace was drawn. Keep the existing drawing
   budget and generic audit limits.
8. Compare the same plan salts before and after at board, package and die scales.
   Inspect a phone frame and transition frames too. More detail is useful only
   when footprints, interfaces and repeated groups remain distinguishable.

**Reject:** free-floating texture, unmodeled signal bundles, arbitrary circles
outside contact fields, detached underfill, wires through unrelated bodies,
different pitches within one repeated group, or a dense field hiding the main
functional regions.
