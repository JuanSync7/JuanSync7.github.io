# Voxel-world references

The voxel agent studies these sources to improve the world generator. Source revisions and
content hashes are in [the reference manifest](references.json). Observations below describe
what was inspected; they do not promise the capabilities of those full engines in this diorama.
No external textures, images or source files are bundled with the website.

| Source | Inspected material | Finding and application |
|---|---|---|
| [noa](https://github.com/fenomas/noa) | README, terrain mesher, world/chunk manager | Greedy faces must agree in material and contact shading; generation and rendering have distinct budgets. Preserve exposed geometry and verify merged output independently. |
| [Voxelize](https://github.com/voxelize/voxelize) | README, generation-stage exports, four landscape/habitat images | Separate climate, substrate, canopy, floor dressing and structures. Macro terrain, medium landmarks and small habitat details need different placement rules. |
| [Minetest Game for Luanti](https://github.com/luanti-org/minetest_game) | Default mapgen decorations and trees | Decorations depend on local substrate, elevation, coherent noise and nearby water. Emergent trees and ordinary canopy are distinct layers. |
| [FastNoiseLite](https://github.com/Auburn/FastNoiseLite) | Feature documentation and preview examples | Domain warp and ridged/coherent fields supply regional structure. The existing noise helpers can supply these mechanisms without importing a whole engine. |

The [Voxelize massif image](https://github.com/voxelize/voxelize/blob/main/assets/town-hub2-massif-4k.webp)
shows coherent rock ridges, elevation-dependent snow and lower forest. It is a mountain reference,
despite its file name mentioning a hub. The
[greenhouse pond](https://github.com/voxelize/voxelize/blob/main/assets/creature-axolotl-greenhouse-pond.webp)
shows canopy above shrubs, flowers and grasses, with shoreline vegetation and rocks around a
terraced pond. The
[volcanic habitat](https://github.com/voxelize/voxelize/blob/main/assets/creature-ashen-dragon-volcano.webp)
uses dark geological patches and bright fissures at several scales. The
[underwater garden](https://github.com/voxelize/voxelize/blob/main/assets/underwater-lantern-garden.webp)
uses repeated kelp, fine floor cover and depth cues to form a recognizable habitat.

The transferable visual rules are coherent patches, large/medium/small structure, vegetation
under canopy, dressing that belongs to its setting, and visible approaches to places. Reference
assets have their own licensing; citation does not grant permission to copy them.
