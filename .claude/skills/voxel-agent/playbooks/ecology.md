# Layered ecology and abundance

**Use when:** vegetation looks uniform, details vanish on slopes, or a biome lacks supporting life.
**Inputs:** completed hydrology/terrain, actual habitat areas, independent ecological seed streams.
**Outputs:** environment fields, global population quotas, canopy cover and supported floor dressing.

1. Compute shoreline distance, coherent moisture/patch fields, grade and biome substrate before recipes. Frozen water does not count as an open wetland source.
2. Select a seeded community from the local biome catalog. Retain several suitable floor species; weight small groundcover above medium shrubs, wildlife, expedition supplies and rare geological discoveries. One rare fossil must not appear as often as grass.
3. Derive counts from actual biome area. Scale quotas globally, reserving capacity for POI children. The policy bounds planning, accepted objects and transient/render geometry independently.
4. Place large canopies before small trees; protect tree-to-tree spacing and building lots. Use actual solid-column clearance for low vegetation below a high crown. Preserve coherent gaps instead of saturating all ground.
5. Measure shade from accepted leaves, then place the floor layers. Reeds/cattails and turtles require nearby open liquid water; frogs need high moisture plus shade or nearby water; moisture-sensitive plants reject dry fields; roots reject ice and hostile substrates. Cultivated props require a nearby accepted building.
6. Only the declared loose groundcover set may conform each column to the terrain (maximum local grade four). Keep every column supported and every fragment attached to some real supporting ground cell. Trees, fossils, architecture and rigid props retain their geometry and support requirements.
7. Independently audit habitat values, recipe/local biome agreement, actual roots, 3D separation and walking headroom. The valid understory fixture must pass; touching-canopy and unsupported-groundcover fixtures must fail.

**Reject:** rectangular empty tree envelopes excluding all understory; plants on ice; riparian species scattered across dry ground; flattening mountains to force a prop; raising detail counts to hide a bad distribution.
**Tools:** `ecology.ts`, `abundance.ts`, `habitat-rules.ts`, `placement-rules.ts`, `ecology-check.mjs`, `spatial-check.mjs`.
