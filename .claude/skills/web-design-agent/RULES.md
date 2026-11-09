# Lighting craft rules

Case: 9 November 2026 request about flat lighting, monochrome depth and seeded room variety.
These extend the [existing room rules](../tabletop-room/RULES.md).


- **L1 Source before effect:** a key must belong to a window or real fixture; mirror
  the source with architecture. Review source/shadow alignment, not only albedo.
- **L2 Separate roles:** key models form, fill opens shadows, practicals support
  activities, reflections reveal material. A single flat ambient cannot do all four.
- **L3 Protect values:** inspect monochrome first, midtones second and highlights last.
  Keep large walls quieter than small paper/ceramic highlights. A lighting switch
  must restore material, emission, environment and fog state.
- **L4 Bound cost and leaks:** one shadow source, six small halos, no global shader
  patches. Release halo textures/materials and lazy reflection targets on teardown.
- **L5 Deterministic mood:** no time-of-day clock or per-frame random changes; a seed
  replays the same palette, furniture, arrangement and light variant.
- **L6 Prove failures still fail:** actual emitted-state mutations must reject excess
  fill, a second shadow caster, dense fog, disabled glow depth test and detached halos.
- **L7 State approximation honestly:** the Canvas path shares signed directional
  shading and material roles, with correct occlusion. It does not simulate WebGL
  shadow maps, PBR reflections, halos or atmospheric scattering.

