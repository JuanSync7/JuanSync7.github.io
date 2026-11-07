# Seeded tabletop rooms

`pixel-still` keeps the existing seed URLs and nine table themes. A seed chooses the table inventory, one of three room finishes, shelf contents, seat position and small furniture variations. The room is a solid three-wall diorama with an open front.

## Camera and framing

The eye-level camera travels on an entrance semicircle. Its world-space center is `(0, room.front)` and its radius is `room.half`. At **0°**, the camera meets the left side wall's front edge; **90°** faces the back wall; **180°** meets the right edge. Zoom changes the lens, not the camera path. Eye height stays fixed during orbit and resizing.

The table remains centered against the middle wall. The front of the room extends 4.4 model units beyond the tabletop, providing a seating zone and an entrance aisle. Perspective framing preserves the table, inventory and back-wall display; the nearby room shell can extend beyond the frame for the closer interior view.

The isometric preset uses a real orthographic camera at 45° yaw and `atan(1 / sqrt(2))` elevation. An off-axis orthographic frustum centers the whole room without changing this angle. All three unit axes have equal projected length at the preset. The angle slider remains 0–180° in both modes.

The near return wall and its attached dressing cut away toward either endpoint. A low wall cap preserves the footprint. Hidden dressing is also removed from hit testing and the fallback drawing.

## Placement rules

- Furniture feet meet the floor. Chairs on a rug are raised by the textile's thickness.
- The table's rear bound meets the middle wall exactly, including any built-in hutch.
- Table items use real model bounds and retain their theme-specific zones and minimum gaps.
- Room fittings stay inside the room envelope and clear the table, its inventory and other fittings. A rug is an explicit supporting surface under the seating.
- Keep the open center of the entrance clear. The return-wall trolley, planter or utilities leave a central circulation route. The door, switch and wall art occupy separate wall zones.
- Dining/bar rooms receive multiple seats; office/computer/workshop rooms receive a wheeled chair; kitchen/lab rooms receive stools. Lab rooms use secured cylinders and a pedal bin, and storage rooms use stacked supply boxes.

## Lighting and materials

The room uses physically lit `MeshStandardMaterial`, a shadow-casting directional key, a weaker bounce light and hemisphere fill. A shaded floor lamp also emits local light in domestic and office rooms. ACES filmic tone mapping retains highlights. Full colour adds themed albedos, surface detail and coloured practical light; Monochrome restores the charcoal and grey treatment with a teal focus indicator. See the material playbook below for the lighting recipes and mode contract.

The shadow helper adapts the PCSS blocker-search and Vogel-disk filtering pattern from [pmndrs/drei-vanilla](https://github.com/pmndrs/drei-vanilla/blob/main/src/core/pcss.ts). Its MIT notice is preserved in `licenses/drei-room-shadows.txt`. The shader is patched per material, never globally. The shadow map is rendered once and invalidated when cutaway visibility changes; there is no temporal noise or accumulation animation.

The lighting structure follows the [Three.js shadow guide](https://threejs.org/manual/pages/shadows.html): one light casts shadows, other lights provide fill. Geometry uses outward normals and a small shadow bias to avoid self-shadow artifacts. Shadow maps, materials and geometries are disposed with the scene.

## Verification

- `npm run tabletop:check`: 1,391 layouts, 36,976 table objects, 61 prop models and all 27 theme/room variants. Checks deterministic choices, actual geometry bounds, table/fixture clearance, entrance-arc endpoints, fixed eye height, full tabletop framing, native/fallback projection agreement and equal isometric axes.
- `npm run tabletop:browser`: all nine themes; real WebGL and forced fallback; full orbit, preset, keyboard, mouse, touch, zoom, seed controls and mobile overflow checks.
- `npm run check`, `npm run build`, `npm run figures:audit` and a read of the room's seed/camera sheets complete the site-wide checks.

## Full colour and material detail (7 November 2026)

The lab viewer now starts in **Full colour** and offers **Monochrome** beside the
camera controls. The choice persists across seed and projection changes in the
mounted viewer. Appearance never changes object placement, camera coordinates or
zoom. Monochrome restores the existing night treatment and teal focus indicator;
full colour applies the theme's material colours, physical light tones, surface
roughness, metalness and emission together.

The new room palette is deliberately separate from `night`. All 22 material/light
colours are mirrored between `roomTones` in `palette.ts`, `--nt-room-*` tokens in
`colors.css` and the design-system ledger. Geometry and materials access them
through `roomHexOf`/`roomTone` in `kit/ink.ts`. This room-only colour extension was
explicitly requested by the user; other figures keep the original palette rules.

### Material playbook

| Material | Detail and response | Implementation |
| --- | --- | --- |
| Oak/walnut | Long grain, sparse knots, plank variation and soft sheen | World-space wood pattern; table grain along x and floor grain along its modeled boards |
| Quartz/stone | Restrained veins and mineral variation | Continuous low-frequency pattern and moderate roughness |
| Brushed metal | Fine directional striations and reflected highlights | Filtered detail, lower roughness, metallic response and a neutral PMREM environment |
| Fabric | Matte seats, curtains and rugs | Fine weave fades below screen resolution |
| Plaster/brick | Broad tonal variation with modeled joints | Rough surface plus the room's directional and practical lights |
| Ceramic/glass | Controlled, smooth highlights | Material-specific roughness with subdued colour and environment reflections |
| Paper/books | Cream pages, coloured covers and binders | Semantic surface finishes keep pages separate from covers |

`roomstyles.ts` assigns palette roles to each theme; `roomlightmoods.ts` holds five
lighting moods. Warm dining/study/workshop rooms balance daylight with amber
practicals. Computer rooms use a cool blue environment with warmer local lamps.
Bar rooms use lower amber light; kitchens and labs use cleaner neutral/cool task
light. A room's material colour is distinct from the colour illuminating it.

Task lights, monitor spill and candle light follow seeded object positions.
Under-shelf light sources match the modeled strips. The gallery wall light has a
modeled fixture. These are static lighting choices; the scene does not flicker or
animate merely to look alive. The single directional key still owns shadow casting.

`roomtexture.ts` composes world-space diffuse, roughness and bump detail with the
existing local PCSS shadow hook. Screen derivatives filter small features to avoid
moire. Bump detail does not displace geometry or invalidate collision bounds.
`roommaterial.ts` stores reversible material looks in a `WeakMap`; colour and
monochrome restore their complete material state. The prefiltered environment is
built per renderer and disposed through the Three.js runtime's `onDispose` hook.
No global shader chunks are patched.

The static room renders on demand through `ThreeFrame.renderWhen`: camera,
appearance, selection and size changes draw a fresh frame. Idle frames retain the
last image. The shared clock still owns input and reduced-motion behavior. Colour
reflection maps are created lazily; monochrome seed previews never build unused
environments. Preview canvases remount by seed so a released WebGL context is not
reused, while their outer buttons retain keyboard focus.

The fallback uses the same palette, geometry, camera and cutaways, with clipped
coarse wood grain/stone detail and simpler face lighting. Appearance controls work
in both renderers. The generic figure bench remains monochrome; the room's full
colour is exercised separately rather than weakening the whole site's palette.

### Stored rules and checks

The reusable skill is [tabletop-room](../../.claude/skills/tabletop-room/SKILL.md).
Its [material and lighting rules](../../.claude/skills/tabletop-room/references/materials-and-lighting.md)
record the theme matrix, texture conventions, mode behavior, cleanup rules and sources.

| Command | What it verifies |
| --- | --- |
| `npm run tabletop:check` | Seed determinism, true geometry, contacts, clearance, circulation, normals and camera projection |
| `npm run rooms:materials` | Every prop/room material recipe, all token mirrors, theme lighting coverage, exact mode restoration and local shader composition |
| `npm run tabletop:browser -- --url=…` | The strict existing monochrome palette plus camera, seed, touch, mobile and fallback behavior |
| `npm run rooms:colour -- --url=…` | All nine themes in WebGL/fallback and eye/isometric views, reversible mode changes, texture stability, colour response, contrast and highlight clipping |
| `node scripts/figures/room-colour-performance.mjs --url=…` | Full-colour computer and lab rooms against the existing 14 ms Three.js frame budget |
| `npm run rooms:gallery` | Compact actual-render colour/monochrome galleries and full-resolution hero images |
| `npm run rooms:verify -- --url=…` | The full ordered verification, including production build, seed sheets and the 44-figure site audit |

Colour-specific image limits live in `scripts/figures/room-colour-checks.json`.
Visible chroma, tonal contrast and colour/monochrome differences verify that colour
is present. The original off-palette limit is enforced after returning to monochrome.
Rendered colours are continuous mixtures of materials, light and tone mapping;
they are not expected to equal an unlit palette swatch. Keep all global figure
thresholds unchanged. Run `figures:selftest` after changing shared audit behavior.

The verification command stops at its first failure and writes
`figures-out/room-validation.json`. Read the generated sheets and fix visible
problems before handing over, even when numerical checks pass. The scripts do not
publish, push or deploy the site.
