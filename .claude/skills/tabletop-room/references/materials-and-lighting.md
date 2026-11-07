# Materials and light

## Theme intent

| Theme | Table/material | Room tones | Lighting |
| --- | --- | --- | --- |
| Dining | Oiled oak with visible grain | Walnut, linen, sage, brass | Daylight key and warm practical lamps |
| Work | Oak or laminate work surface | Plaster, blue, teal, steel | Neutral daylight with a warm desk lamp |
| Computer | Dark walnut and graphite hardware | Navy, teal, steel | Cool ambient light, screen spill and warm task light |
| Storage | Utility oak, labelled containers | Concrete/steel, olive, kraft | Broad neutral working light |
| Workshop | Worn oak | Plaster, exposed brick, clay | Strong daylight with warmer local light |
| Study | Walnut and paper | Linen, navy, sage, brass | Warm reading light balanced by daylight |
| Kitchen | Quartz/stone and stainless fittings | Sage cabinetry, ivory, blue-grey floor | Clean daylight and under-cabinet light |
| Bar | Dark walnut and brass | Burgundy, bottle green, charcoal | Lower amber light with shelf/candle pools |
| Lab | Epoxy/porcelain and stainless steel | Cool pale walls, blue-grey, aqua glass | Clear neutral light and cool task illumination |

Use `roomstyles.ts` for palette roles and `roomlightmoods.ts` for the physical
light settings. Keep a material's albedo separate from the light that illuminates
it. A dark bar and a bright lab need different key/fill balance; changing all
materials to a darker colour does not establish night lighting.

## Surface rules

- Wood: consistent long grain, subdued plank variation and sparse knots. Table
  grain runs along the long axis; floor grain follows the modeled boards.
- Stone: low-contrast mineral variation and sparse veins. Avoid high-frequency
  salt-and-pepper noise that becomes static at thumbnail sizes.
- Metal: brushed anisotropic-looking detail through fine, filtered striations,
  restrained roughness and real environment reflections. Keep the base colour muted.
- Fabric: matte material and fine weave that fades when too small to resolve.
- Plaster/brick: broad roughness and tonal variation, with modeled joints or trim.
- Ceramic/glass: smooth surfaces and controlled highlights. Avoid making every
  object emissive or every reflective object pure white.
- Emission: only screens, bulbs, flames and window light. Practical lights must
  follow their actual fixture positions. Do not add autonomous flicker.

The GLSL texture uses screen derivatives to filter fine lines. No texture moves
with time. The software renderer clips coarse grain/veins to the physical faces.

## Appearance modes

The product viewer starts in **Full colour**; **Monochrome** restores the existing
night palette with its teal focus indicator. The generic figure bench defaults to
monochrome so the original site-wide palette audit remains meaningful. Full colour
is checked separately against its declared material tokens, contrast, highlights,
mode differences and still-frame stability. Do not silently skip colour coverage.

Changing modes updates albedo, roughness, metalness, emission and lighting together.
Keep shadow casting and geometry unchanged. Each mode must be reversible without
leaving coloured emission or reflection intensity behind in monochrome mode.

## Sources and ownership

- [Three.js MeshStandardMaterial](https://threejs.org/docs/pages/MeshStandardMaterial.html): metallic/roughness materials, bump detail and environment reflections.
- [Three.js colour management](https://threejs.org/manual/pages/color-management.html): linear lighting and sRGB display output.
- [Three.js shadow guide](https://threejs.org/manual/pages/shadows.html): single-key shadow mapping with supporting lights.
- [Three.js rendering on demand](https://threejs.org/manual/pages/rendering-on-demand.html): static scenes redraw in response to input and size changes.
- [Three.js RoomEnvironment](https://threejs.org/docs/pages/RoomEnvironment.html): the neutral studio environment used for prefiltered reflections.
- [drei-vanilla PCSS](https://github.com/pmndrs/drei-vanilla/blob/main/src/core/pcss.ts): the existing local shadow adaptation; preserve `astro/licenses/drei-room-shadows.txt`.

Do not import an external rendering framework just to add material detail. The
existing Three.js runtime owns rendering and cleanup. External assets or helper
code require a source/license record and deterministic loading behavior.
