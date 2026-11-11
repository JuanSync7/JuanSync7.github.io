# System context

The web design agent owns visual treatment and review. The voxel workflow owns the
procedural world's geometry. Both are operated by one agent for this task.

| Owner | Canonical source | Coupling/check |
|---|---|---|
| Atmosphere inputs and budgets | `astro/src/figures/kit/voxel-atmosphere/profile.ts`, `policy.json` | `atmosphere-check.mjs` |
| Executable update sequence | `voxel-atmosphere/pipeline.json` | actual controller trace and reversed-trace fixture |
| Key/fill, shadows, fog | `voxel-atmosphere/scene.ts` | actual scene flags, budgets, GPU ablation pixels |
| Source-attached practical light | `practicals.ts`, `material.ts` | real emission cells; GPU glow ablation |
| Precipitation and low mist | `weather.ts`, `mist.ts` | topmost solid field, replay and GPU particle ablation |
| Non-WebGL atmosphere | `fallback.ts` | production fallback control/image check |
| Scene adapters | `voxel-world/render.ts`, `voxcel-island/render.ts` | both scenes exercised by the browser harness |
| UI and templates | `VoxelAtmosphereControls.tsx`, both seeded templates | controls, naming, phone and reduced motion |
| Vault archive | `scripts/voxel/vault*.mjs` | hashes, reconstruction, ownership and no-partial-write fixtures |

Read this index first; read an implementation only for the stage being changed.
Geometry stays stable across atmosphere controls. One directional shadow map is cached
until light/weather changes; the moving boats and particles do not cast cached shadows.
Practical lights are bounded and do not cast extra shadow maps. This is a finite diorama,
not a volumetric path tracer. The 2D fallback retains mood/weather but has no mapped shadows.

The public name is **Voxel Island**. Existing `/lab/voxcel-island/` links and historical
archive identifiers remain valid. Voxel Worlds stays at `/lab/voxel-scene/`.

## Seeded room workflow

The room implementation and contracts are indexed in `kernel/INDEX.md` here and
`../tabletop-room/kernel/INDEX.md`. `roomPlan` owns functional anchors;
`roompalettes` owns coordinated seed choices; `roomLightPlan`, `roomLighting` and
`roomOccluders` own source alignment, light roles and structural shadow continuity.
The independent room checks live in `astro/scripts/figures/`; `checks/README.md`
maps their contracts. Room and voxel light/effect budgets apply to their own scenes.
Room feedback uses scoped guidance/check bundles; voxel source/evidence archives
continue through `scripts/voxel/vault*.mjs`. Neither workflow adopts global guidance.
