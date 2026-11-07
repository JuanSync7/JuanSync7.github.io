# Seed and scene plan

**Use when:** the result repeats a composition, a seed cannot be replayed, or a new
world-level choice is introduced.

**Inputs:** user brief, layout seed, generator version and optional biome constraint.
**Outputs:** `WorldSpec`, named RNG streams and an explicit scene family.

1. Validate the seed with `planWorld`. The public template derives a layout seed; keep
   that mapping in a replay record instead of confusing the two seed namespaces.
2. Choose a biome, a compatible secondary biome or none, a landform, dimensions,
   relief, density, settlement target, boat target and daylight. A geological feature
   or wilderness can be the focus; there is no compulsory main building.
3. Derive independent streams with stable names for terrain, climate, hydrology,
   population, each recipe, its site search, navigation and ambience. Never make
   later choices consume the terrain stream.
4. Terrain area determines the final population budget. Object shapes and sites use
   stable recipe ids, so deleting one object does not reroll every later shape.

**Reject:** out-of-range seeds, hidden defaults, a single shared RNG cursor, fixed
house/boat counts, or a change without a diversity regression case.
**Check:** `check.mjs`, `diversity.mjs`, stream-isolation cases.
**Tools:** `planWorld`, `stream`, `voxel:agent replay`. Do not alter stage names casually:
changing a stream identity changes its seed contract.
