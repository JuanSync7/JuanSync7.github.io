# Voxel worlds

The `/lab/voxel-scene/` generator creates finite, inspectable pieces of voxel terrain.
A versioned seed chooses the biome and transition, terrain form, dimensions, population,
settlements, boats, recipes, placements and sunlight. Empty wilderness is valid.
Version 3 widens terrain radii from 24–38 to 44–60 cells and adds ecological layers,
related places and close camera exploration. Engine versions can change old seed pictures;
replay is deterministic within a fixed version and source fingerprint.

## What varies

Fourteen biomes span nine terrain forms: island, archipelago, mainland window, valley,
dunes, Alps, canyon, caldera and cutaway cavern. Mainland windows have eroded outlines,
continuous relief, biome strata and a closed stepped underside; cave ceilings retain a rock path to the terrain after skylight carving; they do not gain an
artificial sea border. Real cliffs and cave cutaways remain visible.

The library has 138 land model archetypes, including 15 building types and 14 tree types. The live population/place catalogs reference 135 of them; all 135 must realize a valid placement in the balanced cohort. Three small legacy models remain direct-only. Each seed selects
a themed community with varying dimensions, variants, orientations, counts and sites.
Small groundcover is common; wildlife, supplies and geological discoveries are rarer.
Actual area determines globally bounded populations. Trees reserve canopy spacing but
allow low vegetation underneath with real 3D clearance. Declared loose groundcover
conforms to slopes; rigid objects retain measured geometry and support requirements.

| Biome | Supporting ecology and discoveries |
|---|---|
| Woodland | Cedar/birch/ordinary canopy, ferns, litter, moss, berries, fungus stumps, hollow logs, deer and glades. |
| Rainforest | Jungle canopy, bamboo patches, shore mangroves, tree ferns, orchids, bromeliads, frogs/turtles, pools and overgrown shrines. |
| Mushroom | Giant caps, cup mushrooms, spores, geodes, moss, lichen and cauldron gardens. |
| Snow | Alpine conifers, drift cover, frost shrubs, ice arches, foxes, rabbits and refuge supplies. |
| Tundra | Sparse trees, cotton grass, dwarf shrubs, heather, lichen, standing stones and shelters. |
| Frozen ice lands | Ice peaks, frozen lakes/cascades, spires, arches, drifts, fossils, penguins/polar bears and expedition remains. |
| Desert | Dunes/canyon strata, agave/cacti, dry grass, bones, rare fossils/arches, camels/lizards and sandstone shrines. |
| Oasis | Organic pools, shore plants, palms/acacia/baobabs, water urns and groves beside arid ground. |
| Plains | Meadows, low grass, flowers, sparse acacia, wildlife and occasional mills/gardens. |
| Village | Cottages, mills, workshops, greenhouses, crops, beehives, fences, farm supplies and village greens. |
| City | Varied towers, townhouses, clock squares, workshops, street furniture, planters and supported roads. |
| Volcanic | Caldera lava, dark basalt, obsidian, sulfur, ore, charred stumps and occasional forges/lookouts. |
| Wasteland | Eroded ground, dead trees, dry scrub, scrap, rusted pipes, bones and forgotten remains. |
| Caves | Vaulted cutaways, skylights, stalactites, floor crystals/geodes, fungi and mine/expedition equipment. |

These are possible components, not a promise that every seed contains every item.
Wildlife is static voxel scenery. Separate access groups can remain across water or
steep terrain; there is no walking, editing, multiplayer or infinite chunk streaming.

## Pipeline and placement

The executable [pipeline manifest](../../astro/src/figures/kit/voxel-world/pipeline.json)
owns stage order; `runPipeline` dispatches it and each report records the executed trace.
Preflight research and seed planning precede terrain, hydrology, ecological fields and
population. Buildings and natural parents precede related objects; routes precede
canopy; measured shade precedes floor vegetation. Closed ground, optional boats and
actual-member camera bounds finish generation. Meshing, ambience, verification and
feedback follow.

One [voxel agent](../../.claude/agents/voxel-agent.md) owns eleven
[playbooks](../../.claude/skills/voxel-agent/SYSTEM.md), a
[rule table](../../.claude/skills/voxel-agent/RULES.md),
[visual rubric](../../.claude/skills/voxel-agent/LOOK.md) and
[run prompt](../../.claude/skills/voxel-agent/examples/prompt.md).
No component bypasses the placement solver. Each child has a real accepted parent,
a bounded neighborhood and its own measured shape/site checks. Invalid candidates are
rejected within a retry limit; omissions retain stable ids. Checks independently cover
support, attachment, terrain, cave headroom, water, protected lots, actual solid spacing,
paths, habitat conditions, groups, camera bounds, accounting and distribution.

## Rendering and exploration

Greedy surface merging preserves exposed volume, material and corner contact shading.
A bounded solid volume supports culling/AO and camera clearance; buried blocks do not enter the
rendered mesh. Continuous water uses shared GPU waves; CPU boat motion uses the same
wave terms. Foam and weather are instanced, and static geometry stays fixed.

Drag to rotate; Shift-drag or right-drag pans. Two fingers pan and pinch to zoom.
Arrow keys rotate/tilt, Shift-arrows pan, plus/minus zoom, and Home resets. Explore
selects actual accepted places; the zoom range reaches 3.5×. Orbit pauses/resumes
without a live azimuth jump. Focused views lift over foreground terrain while preserving yaw, and camera eyes retreat out of solid geometry. Default framing fits the whole world; deliberate close
zoom can crop. Sunlight/weather controls, reduced motion and a 2D fallback remain available.

## Verification and feedback

From `astro/`:

```sh
npm run voxel:check
npm run voxel:stress -- --count=1536
npm run check
npm run build
npm run voxel:gpu
npm run voxel:browser
npm run voxel:gallery -- --profile
npm run voxel:vault-check
npm run figure:seeds -- voxel-scene 12 --url=http://127.0.0.1:4321
npm run figures:look -- voxel-scene
npm run voxel:agent -- replay --seed=42 --biome=rainforest
npm run voxel:agent -- replay --seed=7 --public
npm run voxel:agent -- replay-snapshot --snapshot=/path/to/source.json --seed=42
npm run voxel:agent -- replay-snapshot --snapshot=/path/to/historical.json --support=/path/to/source.json --expect=VXL-CLEARANCE
npm run voxel:agent -- feedback --seed=42 --rule=VXL-HABITAT --note='Observed issue' --evidence=path
npm run voxel:agent -- vault --vault=/path/to/experience-vault
npm run voxel:agent -- vault --vault=/path/to/experience-vault --check
```

The production browser script starts its own preview. `CHROMIUM_PATH` may select an
installed Chromium; normal CI uses Playwright's browser. Gallery output includes
all-biome overviews, accepted-place close-ups, model sheets, renderer statistics and
source fingerprint. The optional profile measures every biome against the unchanged CPU frame budget; frame intervals are recorded separately. Browser captures include a natural public-seed atlas as well as controlled same-seed biome comparisons. Read the images; a green mechanical report is not a visual review.

The vault export saves maintained guidance, references, the pipeline, run reports,
review images, feedback and immutable full source/script snapshots. Hashes detect drift;
an externally edited mirror is not overwritten. Source remains owned by the site.
Snapshot replay reconstructs exact source in a temporary directory, validates entry hashes and generator identity, and uses archived checks. A historical kernel can overlay a full support snapshot and reproduce a named failure. It leaves the working site/vault unchanged.
Export does not push, grant publication approval, or bypass vault privacy checks.
New authored guidance remains draft and unreviewed.

The [reference study](references.md) records inspected libraries/images and their
actual contribution. No third-party engine code or image asset is bundled into the site.
