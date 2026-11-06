# Component recipes and shapes

**Use when:** adding content, changing silhouettes, or correcting fixed sizes and
repeated houses, trees, boats or biome props.

**Inputs:** actual habitat areas, population budget, recipe ids and shape streams.
**Outputs:** immutable recipes and complete local voxel models with measured bounds.

1. Use the local habitat catalog. Rainforest can support broad jungle canopies and
   ferns; tundra is sparse; desert can support cacti, bones and camps; caves use
   mushrooms, crystals and rock formations. Do not scatter every prop everywhere.
2. Plan counts from habitat area, density and seeded budgets. Zero buildings, trees
   or boats is valid. Cities and villages may have many independently shaped shelters.
3. Draw dimensions, roof/body variant, height and quarter-turn from each recipe's
   own stream. Size affects geometry and placement cost, not only metadata.
4. Realize the entire local model before placement. Include eaves, branches, vines,
   a tent's poles and a boat's sail. Measure bounds from the actual voxels.
5. Keep integer block coordinates. Closed solids may share cells within one model's
   builder map; distinct placed models cannot share a solid cell.

**Reject:** labels on plain filler boxes, a new recipe with a fixed silhouette despite
size settings, or geometry outside its declared envelope.
**Check:** geometry/envelope/ecology checks and house/tree recipe diversity.
**Tools:** `population`, `recipe`, `componentModel`, `Blocks`; shape tests and atlas.
