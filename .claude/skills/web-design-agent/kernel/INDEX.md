# Web design scene kernel

Implementation stays in `astro/src/figures/kit/`; this index extends the existing
[room kernel](../../tabletop-room/kernel/INDEX.md), rather than copying its builders.

| Module | Contract |
| --- | --- |
| `tabletop.ts` | Append four seed choices after the established tabletop stream: palette 0–3; layout, furniture and light 0–2. Replay is deterministic. |
| `roompalettes.ts` / `roomStyle(theme, variant)` | Four curated semantic-role palettes for each of nine themes, using existing mirrored tokens. |
| `roomplan.ts`, `roomzones.ts`, `roomdressing.ts` | Shared zone anchors; layout 1 mirrors the room, layout 2 deepens secondary zones. Primary table stays fixed. |
| `roommirror.ts` | Mirror x and reverse face winding; swap left/right ownership and recalculate actual bounds. |
| `tableroom.ts`, `tableframes.ts` | Cache keys include every geometric choice. Colour and light choices do not contaminate geometry. Retain at most 18 recent room assemblies so seed browsing does not retain all 243 meshes. |
| `roomlightplan.ts` | Pure source/mood plan: key ray passes through the measured window opening toward the tabletop; window key or source below ceiling, seeded daylight/evening/overcast or clinical/night variations, optional bounded haze. |
| `roomlight.ts` | One shadow key, weak fill, fixture practicals, lazy/disposed PMREM, ACES exposure 1 and reversible monochrome/colour state. |
| `roomoccluders.ts` | Structural walls/ceiling retain separate shadow-only meshes through camera cutaways; no colour/depth writes in the main view. Owned cloned geometry is disposed with the scene. |
| `roompracticals.ts` | Mounted sources mirror room anchors; tabletop lamps follow actual unmirrored item transforms. |
| `roomglow.ts` | At most six depth-tested 0.4-unit emitter sprites. Explicit texture/material teardown; source halos are not bloom or illumination. |
| `roomshade.ts`, `roomflat.ts` | Signed diffuse normal with height/depth modulation. Reuse the per-frame source plan; preserve BSP occlusion. Canvas approximates form lighting, not WebGL effects. |
| `tablefinish.ts`, `tablemesh.ts`, `roommaterial.ts` | Differentiated neutral albedo/roughness, retained procedural detail, palette-aware colour materials and reversible emission state. |
| `roommono.ts` | Semantic neutral value hierarchy; readable cabinet/frame/textile midtones and brighter working surfaces. Reserve near-black for recesses. Existing night tokens only. |
| `roomtonal.ts` | Material-local world height/front ramps plus analytic wall-foot/corner indirect attenuation. Compose after texture and before PCSS. Uniform gain 1 in mono, 0.45 in colour; no geometry or global shader changes. |
| `roomflattonal.ts`, `roomflattexture.ts` | Continuous world-axis Canvas gradients and clipped monochrome/colour grain; no mapped shadows or geometric AO. |
| `room-tone-browser.mjs`, `room-tone-entry.mjs` | Isolated actual-kernel browser render and eroded entity-ID masks; all nine themes in two modes/renderers, exact restoration, actual-image failure mutations and captured old metrics. No production inspection API. |
| `roomview.ts` | Uncontrolled figure thumbnails default to 135° isometric, matching the viewer's existing preset. Explicit eye mode retains the physical camera and continuous ceiling. |
