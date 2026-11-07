# System context

| | |
|---|---|
| What | The procedural voxel-world engine behind `/lab/voxel-scene/`. |
| Why | Seeds must change the composition, not only the colours or small offsets. |
| Who | One voxel agent, using deterministic scripts and visual review. |
| When | A biome, recipe, solver, camera or rule changes. |
| Where | `astro/src/figures/kit/voxel-world/`; the template is `astro/src/figures/templates/voxel-scene.ts`. |

The engine is a pure plan-and-build pipeline. Its version is part of `WorldSpec` and
its audit report. A public template seed selects a layout seed through the existing
figure grammar. CLI seeds are layout seeds unless `--public` is given: record both when moving a browser issue
to the CLI. An engine-version change may change old pictures; repeatability is within
a version, not a promise that old seed pictures survive a new grammar.

## Executable sequence

`astro/src/figures/kit/voxel-world/pipeline.json` owns the stage order. `runPipeline`
executes it; every report retains the actual trace. Preflight research and `planWorld`
precede it. Meshing, ambience, camera, verification and feedback follow it. Read the
manifest rather than maintaining a second hand-written sequence.

Version 3 widens radii to 44–60 (89–121 cells before stretch/coast), with 138 land
archetypes and global population budgets. Ecological fields and weighted communities
keep rare landmarks rarer than floor vegetation. Actual accepted parents own related
components; actual accepted geometry owns the exploration destinations.

## Kernel index

Read this index first; inspect a module's implementation only for the stage being changed.

| Call | Output | Important boundary |
|---|---|---|
| `planWorld(seed, biome?)` | versioned world specification | Invalid numeric seeds fail; a forced biome is an audit input. |
| `stream(seed, stage)` | independent PRNG | Stable stage names; no shared cursor between stages. |
| `terrain(spec)` | height, climate, roof and liquid maps | Mainland cuts continue the biome to the edge; islands and archipelagos have coasts. |
| `shapeBase(world)` | connected, beveled underside | A boundary-distance field shortens outer walls; both renderers cull against per-column bottoms. |
| `buildEcology / shadeCanopy` | moisture, substrate, patch and accepted canopy fields | Hydrology comes first; canopy shade comes before floor dressing. |
| `population(world)` | stable component recipes | Counts use actual habitat area and a seeded density. Zero is valid. |
| `componentModel(recipe)` | local integer voxel geometry | Measure this geometry before placement. Roofs, roots and sails count. |
| `Placement.put(recipe)` | accepted prop or reported omission | Atomic acceptance; bounded search; building lots, canopy spacing and exact 3D solid-column clearance. |
| `planPlaces / buildInterests` | parents, bounded companions and actual camera bounds | Omitted components cannot become phantom destinations. |
| `connectSettlements(world, layout)` | supported access paths | Bounded graph search; no roads through objects or water. |
| `buildGround(world)` | closed boundary of solid columns | The height field is the full solid volume; buried cells need not enter GPU buffers. |
| `populateHarbour(world)` | optional boats on navigable water | No guaranteed boats, fixed coordinates or mandatory docks. |
| `buildWorldView / updateWorldView` | static mesh and frame state | Geometry is built once; time changes only ambience and motion. |
| `frameWorld` | bounds-aware camera | Default zoom fits all bounds; deliberate zoom can crop the edges. |

## Ownership and limits

The source owns the executable behaviour. The vault contains a maintained guidance
mirror, immutable full source/script snapshots and private observations. The site remains the executable owner. `policy.json` owns the numeric
placement, framing and diversity limits. Checks live in `astro/scripts/voxel/` separately
from the kernel. Changing a rule requires a named failure case and a negative fixture;
changing a limit requires a reason, not a desired green result.

Four static neighbouring previews keep WebGL context and animation costs bounded.
Surface meshing removes internal faces against the implicit terrain volume. Water uses a shared GPU wave surface and exposed boundaries; foam and weather are
instanced by family. Meshes greedily merge only equivalent material/AO faces. The same geometry has a 2D fallback.
