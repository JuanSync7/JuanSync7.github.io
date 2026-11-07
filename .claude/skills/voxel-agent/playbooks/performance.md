# Scale, meshing and bounded animation

**Use when:** widening terrain, increasing density, adding model detail or changing motion.
**Inputs:** baseline seed matrix, policy, actual renderer geometry and unchanged figure thresholds.
**Outputs:** bounded surface/volume, equivalent merged mesh, GPU water and measured browser evidence.

1. Increase useful habitat area before increasing counts. Version 3 uses radii 44–60 rather than 24–38; global quotas and retries keep the extra area finite. Defaults cap accepted props at 850, canopy planning at 330, floor planning at 600, total recipes at 1,200, surface cells at 150,000 and transient dense cells at four million. POI recipes are also bounded by habitat area and parent count; the final total, including boats, is audited.
2. Emit the actual closed terrain boundary. The transient solidity volume includes terrain interior, per-column bevels, cave ceilings and props. Refuse a huge sparse bounding box before allocating it.
3. Merge only coplanar, same-material faces with uniform equal contact AO; retain nonuniform corner shading at unit resolution. Expand every merged face and compare with an independent naive exposed-face set. Verify triangle winding and cavities.
4. Render continuous water tops and exposed boundaries, not thousands of complete liquid cubes. Compile CPU boat swell and the GPU shader from the same bounded wave terms. Shared vertices receive equal weights; ice stays fixed. Keep foam outside boat envelopes.
5. Batch particle families with instancing. Weather toggles must hide ambient particles without losing local fire/cauldron effects. Static geometry does not move; repeated time samples must agree.
6. Fit whole-world default bounds and actual POI bounds; intentional close zoom may crop. Test phones, narrow aspect ratios, input clamping and orbit transitions.
7. Run the real shader probe and unchanged figure performance audit. Keep the measured timings, draw calls, triangles and limitations. Optimize the owning implementation if it fails; do not raise audit thresholds or replace the world with a smaller hidden scene.

**Reject:** allocation before bounds checks; changed volume/material after merging; CPU transforms for every water cell per frame; per-particle draw calls; a performance claim inferred from object count.
**Tools:** `volume.ts`, `surfaces.ts`, `mesh-check.mjs`, `water-surface.ts`, `gpu-check.mjs`, `effects.ts`, `voxel:gallery`, figure look.
