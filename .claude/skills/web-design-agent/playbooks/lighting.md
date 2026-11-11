# Lighting a small interactive room

Scope: Three.js interiors, plus a deterministic Canvas fallback. These are project
rules from the 9 November 2026 request about flat light and tonal depth. Numerical
settings are calibrated for this scene's 2.2 units/metre and ACES exposure 1, not
portable physical measurements.

## Steps

1. **Choose an activity and mood.** Name the focal surface, time of day and visible
   sources. Keep task areas legible in evening scenes. Fill out the brief template.
2. **Lock geometry and camera.** Check real dimensions, floor contacts, wall openings,
   closed ceiling and the full entrance arc before judging exposure. Fix normals;
   opposite faces cannot both use an absolute-dot diffuse term.
3. **Neutral pass.** Disable colour, fog and glow. Start with one key. Put daylight
   outside the actual window, with its ray crossing the measured aperture toward the table; place a clinical or pendant source below the ceiling
   at the fixture. Aim it toward the primary activity. Check the direction of a
   chair/table shadow at 0°, 90° and 180°.
4. **Add bounded fill.** Hemisphere light supplies broad sky/ground response; a weak
   opposite directional light approximates room bounce. Increase fill only until
   shadow detail is readable. At this scene's settings, key intensity must exceed
   twice the sum of sky and bounce intensities. This is an artistic budget, not a
   radiometric comparison between different light types.
5. **Shape shadow depth.** Use one shadow-casting key, a fitted frustum and a 2048 map.
   Tune normal bias against acne and detached contact shadows. Keep the existing
   material-local PCSS hook, its MIT attribution and static shadow invalidation.
   Keep structural walls/ceilings as shadow-only blockers when cut away for the camera;
   an orbit must not open the room to a different sun.
   Avoid shadow-casting point lights: each adds six shadow views.
6. **Add actual practicals.** A glowing bulb is an emissive surface. Nearby light
   comes from a matched point/spot source; a task lamp needs its target. Sources,
   fittings and mirrored layouts share anchors. Most practicals do not cast shadows.
   Check for light leakage around walls and under shelves; restrict range/intensity
   before adding more shadow passes.
7. **Set material and colour hierarchy.** Work in linear light, use the renderer's
   sRGB output and one tone-mapping pass. Choose coordinated wall, floor, timber,
   top, accent, textile and metal roles. Keep broad surfaces quieter than the table.
   Preserve light material detail; do not fix a dark room with emissive walls.
8. **Add effects only if the mood needs them.** Small depth-tested emitter halos can
   make bright lamps read. They do not illuminate a room. This implementation uses
   at most six 0.4-unit additive sprites, opacity ≤0.3, with depth test on and depth
   write off. True HDR bloom requires an HDR compositor, threshold/exposure tuning,
   output colour management, mobile measurement and explicit resource disposal.
   Neither technique creates volumetric light shafts.
9. **Atmosphere last.** Optional exponential haze fades distant geometry; it is not
   volumetric scattering. Here density ≤0.014 appears only in atmospheric computer
   or bar variants, halved in monochrome. Day/task rooms stay clear. Never use fog
   to hide unfinished surfaces or blocked doors. Keep background/fog colour choices
   deliberate, and retain table contrast over the full orbit.
10. **Verify and look.** Run the focused lighting check, full room verifier and
    same-theme variation browser check. Review all themes, both renderers, both
    appearances, endpoints and phone. Capture a before/after under the same seed,
    camera, appearance and size. Fix causes; do not relax the global audit.

## Recipes to choose, not stack

| Recipe | Source and fill | Mood, effect and rejection |
| --- | --- | --- |
| Natural daylight | Window key, cool sky, weak warm bounce | Clear atmosphere; visible shadow direction. Reject uniform ambient wash. |
| Overcast | Slightly weaker daylight key, retained fill | Quiet contrast and readable textures. A directional source remains an approximation of a broad sky. |
| Evening glow | Warm window key, reduced sky, warmer practicals | Preserve neutral/light material detail; reject a room-wide orange filter. |
| Clinical/task | Ceiling key inside the shell, cool practicals and task spots | Read instruments and worktops; no decorative haze. |
| Low light | Modest key, weak fill and local pools | Keep the table and walking route readable; darkness is not missing geometry. |
| Multi-direction | One dominant key plus weaker unshadowed bounce/practicals | Distinct roles and bounded cost; reject equally strong conflicting suns. |
| Stage / rim | A motivated spotlight, weak fill, optional restrained rear rim | A reusable recipe, **not currently a generated room preset**. Rim needs a plausible fixture and no silhouette clipping. |
| Monochromatic colour | One dominant hue with neutral value separation and a small accent | Also a recipe, not an added UI mode. Saturation cannot replace luminance contrast. |
| Neutral monochrome | Neutral sources, differentiated material values, texture, local lamp pools | Preserve the night token band; reject crushed walls and glowing paper-white floors. |
| Glow + fog | Visible practicals, small source halos, a little distance haze | Only selected atmospheric variants. No glow through occluders or claim of true volumetrics. |

Rules and failure probes: `../RULES.md`. Visual questions: `../LOOK.md`.

References and dependency/version notes: `../references/lighting.md`.
