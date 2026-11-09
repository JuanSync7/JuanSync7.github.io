# Voxel atmosphere

**Use when:** a voxel scene looks flat, weather is invisible, lighting disagrees with
weather, or night/glow/fog/shadows are being changed.
**Input:** accepted world, seed, actual bounds, user controls, figure time and camera.
**Output:** deterministic atmosphere, measured images, a reviewed comparison and vault PR.

1. Reproduce both existing scenes from a pinned commit and public/layout seeds. Preserve
   their images and geometry hashes. Read the [reference card](../../../../docs/voxel-agent/atmosphere-references.md).
2. Resolve biome weather and time once. `pipeline.json` owns the executable stage order;
   inspect its actual trace rather than maintaining another list in the prompt.
3. Balance directional key, hemisphere fill and practical sources. Frame one cached
   shadow map around the world; flag actual static casters and receivers. Size the fog
   range relative to camera distance and terrain radius, including close views.
4. Emit only real windows/fire/lava. Add bounded soft world-space halos and a small
   number of local lights. Do not turn crops/foliage into lamps. Keep effects depth-tested.
5. Instance precipitation and low mist. Seed sites once; evaluate motion from figure
   time. Respect topmost terrain/props/cave roofs. Keep local smoke/fire separate from
   the ambient-weather switch. Reduced motion uses the frozen figure clock.
6. Run `voxel:atmosphere-check`, then `voxel:atmosphere-browser`. Use ablations of actual
   GPU effects, not scene labels. Run the existing world/island geometry, water, camera,
   browser and fixed figure audits. Inspect both numbered seed sheets and phone images.
7. Read `LOOK.md`, record uncertainty and archive the source, policy, checks, prompt,
   references and evidence under the vault's Web design agent. Open the requested PR;
   keep review status and any unavailable host checks visible. Do not merge implicitly.

**Tools:** `atmosphereProfile`, `buildAtmosphere`, `practicalSources`,
`emissiveVoxelMaterial`, `buildWeather`, `buildMist`, `fallbackAtmosphere`.
**Pitfalls:** strong ambient fill erases shadows; shadow maps need light/renderer/mesh
flags together; point-light shadows are expensive; emission alone does not illuminate
neighbors; fog tied to a fixed camera distance breaks on zoom; a JSON counter is not
visible weather. The browser harness records the public old-renderer baseline and
actual before/after pixels without adding a production inspection API.
