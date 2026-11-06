# Terrain and biome transitions

**Use when:** adding a biome or landform, changing dimensions, or fixing seams,
unsupported water, cave clearance or a repeated island outline.

**Inputs:** `WorldSpec`; terrain, climate and hydrology streams.
**Outputs:** solid height field, local biome map, cave roof/clearance maps, liquids,
seabed and named geological features.

1. Select the landform from the habitat catalog. Islands and archipelagos have an
   ocean mask. Slices, valleys, dunes, Alps, canyons and caverns end in terrain cuts.
2. Compute a domain-warped transition weight. Blend relief continuously, then assign
   local habitats for vegetation. Compatible transitions are catalog data.
3. Generate the height field before grading a building site. Preserve high relief
   outside each accepted foundation; do not flatten a universal central plaza.
4. Add supported ponds, rivers, crater lava or ice only when the scene plan calls for
   them. River cuts reach the bounds of a mainland slice. Record liquid bottom and level.
5. For caves, preserve separate roof geometry and lowest free headroom, including
   hanging formations. Open a cutaway so the interior can be inspected.
6. Emit the closed boundary of the solid columns. Treat the height field as the full
   solid volume when testing intersections or culling hidden faces.

**Reject:** a flat base with only recoloured props, an ocean border on every biome,
missing declared transitions, unsupported liquid or a ceiling that clips objects.
**Check:** terrain/transition/liquid/headroom checks and visual landform recognition.
**Tools:** `terrain`, `climate`, `ground`, `water-features`; numbered seed atlas.
