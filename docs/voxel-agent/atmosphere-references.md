# Lighting and weather reference card

Retrieved and read on 2026-11-09. These are implementation/visual references, not
copied assets or new user preferences. The older biome/model study remains in
[References](references.md).

| Reference | Extracted constraint | Applied here |
|---|---|---|
| [Three.js Shadows](https://threejs.org/manual/pages/shadows.html) | Shadow lights add scene passes; one directional shadow map is a useful budget. Its camera bounds must contain the subject. | Cached 1024² key map; static casters/receivers; no point-light shadow maps. |
| [Three.js Fog](https://threejs.org/manual/pages/fog.html) | Fog fades object fragments by camera distance; ordered near/far controls matter. | Camera-relative fog and weather-specific haze; transparent site background retained. |
| [Discover Three.js: ambient lighting](https://discoverthreejs.com/book/first-steps/ambient-lighting/) | Indirect fill prevents black backsides; ambient alone cannot describe shadows and reflections. | Key/fill separation; lower ambient; readable cool night fill. |
| [MeshLambertMaterial](https://threejs.org/docs/pages/MeshLambertMaterial.html) | Simple diffuse shading is cheaper than specular/PBR materials; emission is separate from reflected illumination. | Preserve matte voxel faces; a source-cell emission attribute plus bounded practical lights. |
| [Official Minecraft geometry example](https://threejs.org/examples/webgl_geometry_minecraft.html) | Block silhouettes, visible face contrast and distance separation carry terrain readability. | Keep integer voxel geometry and existing surface/contact shading; add atmosphere after placement. |

The local [supernova worked example](https://github.com/JuanSync7/experience-vault/blob/main/Notes/Examples/Figures/Supernova%20-%20lines%20to%20light.md)
was also inspected: light should have falloff at its source rather than read as an
unrelated hard stroke. Here the glow is world-space and depth-tested. No external
textures, art or new engine dependency are included.
