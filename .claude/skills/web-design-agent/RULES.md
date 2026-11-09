# Atmosphere rules and proof

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
| VXL-ATM-ROOF | When rain/snow falls, particle centres shall remain above the topmost solid column. | Rain through trees or cave roofs. | topmost field; precipitation/roof sampling |
| VXL-ATM-OFF | When ambient weather is off, it shall disappear without extinguishing local fires/windows. | A weather switch that removes all local light. | CPU weather-off/practical comparison |
| VXL-ATM-MOTION | When time changes, weather shall move; when time repeats, the exact state shall repeat. | Static precipitation, per-frame randomness or streaks tilted against measured drift. | CPU matrices, GPU pixel replay, reduced motion |
| VXL-ATM-GEOMETRY | When atmosphere controls change, generated terrain/props shall stay unchanged. | Changing the scene to make a lighting test pass. | fourteen pinned geometry hashes and unchanged solid buffers |
| VXL-ATM-BUDGET | When a scene is built, shadow resolution, glow sources and point lights shall stay bounded. | Unbounded lights/expensive shadow passes. | `policy.json`; CPU and unchanged frame-budget checks |
| VXL-ATM-PIPELINE | When the controller updates, its actual trace shall match the canonical manifest. | Reversed trace fixture. | `pipeline.json`; CPU check |
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
