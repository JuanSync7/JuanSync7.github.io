# Lighting references and reuse record

Read 9 November 2026. The app uses Three.js **0.170**, so check installed source and
API types before copying examples from newer documentation. No new dependency was
needed for this change.

- [Three.js colour management](https://threejs.org/manual/pages/color-management.html):
  distinguish sRGB inputs/output from linear-light calculation. Preserve the app's
  existing renderer output handling and avoid a second tone-mapping pass.
- [Three.js shadows](https://threejs.org/manual/pages/shadows.html): each shadow
  light adds scene passes; point-light shadows add six views. This supports keeping
  one dominant shadow source and unshadowed local practicals.
- [Three.js fog](https://threejs.org/manual/pages/fog.html): fog is distance fading,
  not volumetric scattering. Use it sparingly; choose background/atmosphere together.
- [SpriteMaterial](https://threejs.org/docs/pages/SpriteMaterial.html) and
  [Material](https://threejs.org/docs/pages/Material.html): source sprites can carry
  transparent colour maps; retain depth testing and explicit resource disposal.
- Existing `RoomEnvironment` + `PMREMGenerator`: reuse the installed Three.js
  environment for material reflections, created only on first colour selection.
  It approximates neutral studio reflections, not ray-traced room bounce.
- Existing room PCSS shader adapted from drei-vanilla: preserve
  `astro/licenses/drei-room-shadows.txt` (MIT) and material-local composition.
  Do not add a second renderer/framework merely for a lighting recipe.

The source intensities and halo dimensions are artistic settings for this room's
scale. They are not measured lux, a physically based exposure calibration or proof
of photorealism. Stage/rim and monochromatic-colour recipes are documented extension
options; this change does not expose them as extra UI modes.
