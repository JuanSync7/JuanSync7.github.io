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

## Kernel index

Read this index first; inspect a module's implementation only for the stage being changed.

| Call | Output | Important boundary |
|---|---|---|
| `planWorld(seed, biome?)` | versioned world specification | Invalid numeric seeds fail; a forced biome is an audit input. |
| `stream(seed, stage)` | independent PRNG | Stable stage names; no shared cursor between stages. |
| `terrain(spec)` | height, climate, roof and liquid maps | Mainland cuts continue the biome to the edge; islands and archipelagos have coasts. |
| `population(world)` | stable component recipes | Counts use actual habitat area and a seeded density. Zero is valid. |
| `componentModel(recipe)` | local integer voxel geometry | Measure this geometry before placement. Roofs, roots and sails count. |
| `Placement.put(recipe)` | accepted prop or reported omission | Atomic acceptance; bounded search; conservative occupancy grid. |
| `connectSettlements(world, layout)` | supported access paths | Bounded graph search; no roads through objects or water. |
| `buildGround(world)` | closed boundary of solid columns | The height field is the full solid volume; buried cells need not enter GPU buffers. |
| `populateHarbour(world)` | optional boats on navigable water | No guaranteed boats, fixed coordinates or mandatory docks. |
| `buildWorldView / updateWorldView` | static mesh and frame state | Geometry is built once; time changes only ambience and motion. |
| `frameWorld` | bounds-aware camera | Default zoom fits all bounds; deliberate zoom can crop the edges. |

## Ownership and limits

The source owns the executable behaviour. The vault contains a maintained guidance
mirror and private observations, not a second engine. `policy.json` owns the numeric
placement, framing and diversity limits. Checks live in `astro/scripts/voxel/` separately
from the kernel. Changing a rule requires a named failure case and a negative fixture;
changing a limit requires a reason, not a desired green result.

Four static neighbouring previews keep WebGL context and animation costs bounded.
Surface meshing removes internal faces against the implicit terrain volume. Liquid
columns and foam are instanced. The same geometry has a 2D fallback.
