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

The room uses physically lit `MeshStandardMaterial`, a shadow-casting directional key, a weaker bounce light and hemisphere fill. A shaded floor lamp also emits local light in domestic and office rooms. ACES filmic tone mapping retains highlights. Palette-derived charcoal and grey albedos keep the monochrome style; the seeded tabletop focal object retains the teal signal.

The shadow helper adapts the PCSS blocker-search and Vogel-disk filtering pattern from [pmndrs/drei-vanilla](https://github.com/pmndrs/drei-vanilla/blob/main/src/core/pcss.ts). Its MIT notice is preserved in `licenses/drei-room-shadows.txt`. The shader is patched per material, never globally. The shadow map is rendered once and invalidated when cutaway visibility changes; there is no temporal noise or accumulation animation.

The lighting structure follows the [Three.js shadow guide](https://threejs.org/manual/pages/shadows.html): one light casts shadows, other lights provide fill. Geometry uses outward normals and a small shadow bias to avoid self-shadow artifacts. Shadow maps, materials and geometries are disposed with the scene.

## Verification

- `npm run tabletop:check`: 1,391 layouts, 36,976 table objects, 61 prop models and all 27 theme/room variants. Checks deterministic choices, actual geometry bounds, table/fixture clearance, entrance-arc endpoints, fixed eye height, full tabletop framing, native/fallback projection agreement and equal isometric axes.
- `npm run tabletop:browser`: all nine themes; real WebGL and forced fallback; full orbit, preset, keyboard, mouse, touch, zoom, seed controls and mobile overflow checks.
- `npm run check`, `npm run build`, `npm run figures:audit` and a read of the room's seed/camera sheets complete the site-wide checks.
