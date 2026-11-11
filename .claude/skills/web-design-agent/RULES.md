# Web design craft rules

Apply each scene family’s rules and evidence requirements within its own playbook.

## Room lighting and seeded interiors

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
  fill, a second shadow caster, dense fog, disabled glow depth test, detached halos and a key blocked by the window wall.
- **L7 State approximation honestly:** the Canvas path shares signed directional
  shading and material roles, with correct occlusion. It does not simulate WebGL
  shadow maps, PBR reflections, halos or atmospheric scattering.

- **L8 Cutaways preserve lighting:** hiding a structural wall or ceiling for the camera
  must retain its shadow occlusion. The emitted scene check holds blockers across
  both camera modes and rejects a removed blocker.

- **L9 Test material roles separately:** the 11 November correction found nearly black
  furniture despite a passing scene-wide histogram. Keep readable wall, furniture
  and table midtones; reserve the darkest values for recesses/contact. Use eroded
  entity-ID masks to measure actual surfaces. Reject crushed furniture and flattened
  walls in real-image mutations; retain captured old-render metrics as failed cases.
- **L10 Anchor gradients to the world:** height/front tonal ramps and analytic
  wall/floor contact shading must compose with texture and mapped shadows, stay fixed
  through orbit, and restore through appearance switches. Apply a restrained gain
  in colour. This contact approximation is not SSAO or global illumination.

## Voxel atmosphere

These rules address the user's 2026-11-09 correction: flat illumination and invisible
weather survived the earlier light-colour-only check. Limits live in `policy.json`;
visual claims require images. Authored guidance is unreviewed.

| ID | Requirement / rationale | Failure case | Implementation / proof |
|---|---|---|---|
| VXL-ATM-KEY | When lighting is built, a directional key shall dominate ambient fill, so form remains readable. | Old island ambient intensity 1.8 washed out the composition; excessive-fill fixture. | `scene.ts`; `atmosphere-check.mjs` |
| VXL-ATM-SHADOW | When the GPU scene renders, static solids shall cast/receive a bounded key shadow. | Old renderers had no mapped shadows; missing-caster fixture and shadow ablation. | `scene.ts`, both mesh adapters; GPU pixel difference |
| VXL-ATM-COUPLING | When weather changes, key/fill and haze shall use the same resolved state as precipitation. | A rain label with sunny lighting; clear/rain comparison. | `profile.ts`; CPU and GPU checks |
| VXL-ATM-FOG | When fog is used, its near/far range shall be finite, ordered and camera-relative. | Invalid fog range fixture; far geometry must remain distinguishable. | `scene.ts`; CPU fixture and GPU fog/mist ablation |
| VXL-ATM-WEATHER | When weather is enabled, its declared family shall produce visible particles or mist. | Tiny/absent old weather; hidden-mesh fixture; independent particle ablation. | `weather.ts`, `mist.ts`; CPU and GPU checks |
| VXL-ATM-SNOW-SIZE | Island snow shall stay below 0.12 terrain-voxel units per edge and remain visible without hiding roofs or trees at overview and close zoom. | 2026-11-11 user correction: falling cubes were too large despite the visibility check passing. | Scene-specific `policy.json` size; actual instance-matrix bound, oversized-flake rejection and before/after browser views. |
| VXL-ATM-ROOF | When rain/snow falls, particle centres shall remain above the topmost solid column. | Rain through trees or cave roofs. | topmost field; precipitation/roof sampling |
| VXL-ATM-OFF | When ambient weather is off, it shall disappear without extinguishing local fires/windows. | A weather switch that removes all local light. | CPU weather-off/practical comparison |
| VXL-ATM-MOTION | When time changes, weather shall move; when time repeats, the exact state shall repeat. | Static precipitation, per-frame randomness or streaks tilted against measured drift. | CPU matrices, GPU pixel replay, reduced motion |
| VXL-ATM-GEOMETRY | When atmosphere controls change, generated terrain/props shall stay unchanged. | Changing the scene to make a lighting test pass. | fourteen pinned geometry hashes and unchanged solid buffers |
| VXL-ATM-BUDGET | When a scene is built, shadow resolution, glow sources and point lights shall stay bounded. | Unbounded lights/expensive shadow passes. | `policy.json`; CPU and unchanged frame-budget checks |
| VXL-ATM-PIPELINE | When the controller updates, its actual trace shall match the canonical manifest. | Reversed trace fixture. | `pipeline.json`; CPU check |
| VXL-ATM-PALETTE | When coloured light mixes with materials, the displayed gamut shall stay muted while retaining light/shadow value. | The first actual palette sweep rejected 3.93–6.51% of island pixels under mixed lights. | Material colour response; unchanged generic palette audit. |
| VXL-ATM-PIXELS | When an effect is claimed, removing that effect shall change actual pixels. | Counters pass while no effect is visible; identical-image fixture. | real GPU shadow/glow/fog/particle ablations |
| VXL-ATM-REDUCED | When reduced motion is requested, the scene shall remain frozen until input changes. | Animated precipitation despite reduced motion. | production browser image equality |
| VXL-ATM-PHONE | When the viewport narrows, controls shall fit and the scene shall remain identifiable. | Overflow or unreadably dense weather. | browser layout check plus visual review |
| VXL-ATM-FALLBACK | When WebGL is absent, light/weather controls shall still change the rendered mood. | Flat fallback ignores controls. | forced non-WebGL browser case; mapped shadows explicitly unavailable |

| Catch yourself | Do instead |
|---|---|
| “The light colour changed, so the lighting works.” | Compare actual shadows, lit/unlit faces and night readability. |
| “There are particles in the scene graph.” | Remove only precipitation and measure/inspect the pixel difference. |
| “Glow means bloom on everything.” | Attach emission and falloff to actual windows, fires, cauldrons and lava. |
| “Rain can ignore roofs because it is decorative.” | Use the actual topmost solid field. |
| “A bright ambient term fixes a dark scene.” | Balance key/fill and practical sources; inspect the phone image. |
| “The screenshot passed, so the playbook is approved.” | Keep mechanical evidence and unreviewed visual judgment distinct. |
