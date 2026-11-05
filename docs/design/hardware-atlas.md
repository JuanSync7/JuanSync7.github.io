# Hardware atlas

`/lab/icon-kit/` is a collection of twelve illustrative physical assemblies. Each has
isometric and wireframe SVGs, three camera presets, an exploded pose, and named parts.
`/lab/hardware-atlas/` exposes the same objects as a seeded figure template.

The interface follows the site's night tokens and existing figure clock. Hairline's
opaque faces and quiet local responses, and Anatomy's named physical subassemblies,
are the references for the treatment. No third-party drawing code is copied and no
new runtime dependency is added.

## Reference card

The references were checked against the simple diagrams and descriptions of the real
assemblies. These are schematic icons, not manufacturer models or dimensional drawings.

| Reference | Visual rules carried into the collection |
| --- | --- |
| [Intel package guide](https://www.intel.com/content/www/us/en/support/articles/000005670/processors.html) | Contacts beneath substrate; die above substrate; metal spreader above die. |
| [Micron HBM](https://www.micron.com/products/memory/hbm) and the site's existing chip-package/HBM figures | Repeated memory dies, base logic, vertical connections; neighbouring compute and memory on an interposer. |
| [Raspberry Pi hardware guide](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html) | One populated board, separate processor/memory packages, mounting holes and edge ports. |
| [Seagate drive manual, exploded assembly](https://www.seagate.com/support/disc/manuals/ata/1621pma.pdf) | Concentric platters sharing a spindle, offset actuator pivot, shaped head arm, protective cover. |
| [Cisco switch hardware guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/hardware/installation/guide_stack/2960SHIG/HIGOVERV.html) | Repeated front ports and status marks, low enclosure, modular optical connections. |
| [Hairline](https://github.com/lucasmarkes/hairline), [Anatomy](https://github.com/wheresryan22/anatomy) | Hairline edges, opaque solids, repeated physical details, a single signal, and parts that can separate. |

The rack, power supply, cooler, camera and optical module use simplified conventional
arrangements. Component counts and exaggerated layer heights explain structure; they
are not specifications. The interface states this explicitly. Memory vias are exposed
only by the exploded or wireframe treatment. Covers obscure their internals in the
assembled solid treatment.

## One geometry source

`astro/src/figures/kit/hardware/` owns model-space parts, solid faces, detail strokes,
projection, depth ordering, canvas painting and SVG serialization. The flat `kit/hardware.ts`
entry point keeps the figure audit's import boundary intact. `HardwareIcon` only renders
the projected paths; the figure paints those same points through `FigureCanvas`.

Solids are ordered inside each physical subassembly; overlapping footprints are ordered
by vertical separation before projected depth. Faces paint before their own surface
markings. A single visible face outlines the selected part in teal. Wireframes intentionally
show the internal and rear edges at lower opacity.

Camera presets interpolate through the existing clock's `follow`; they never spin with
time. Reduced motion snaps to the requested pose. Each camera fits every point of the
whole assembly, including all lifted parts. Canvas avoids SVG path-string formatting in
its frame loop. Changing data does not remount the clock.

## Reuse and exports

Use `<HardwareIcon kind="processor" mode="wireframe" />`. Optional `view`, `open` (0–1),
`pick` (part index) and `decorative` props select the composition and accessible treatment.
The component is demonstrated in `/design-system/`.

`npm run hardware:export` creates 24 standalone SVGs, a sprite with stable IDs such as
`processor-isometric`, and numbered contact sheets in the ignored `astro/hardware-out/`.
SVGs use separate paint and opacity attributes for SVG 1.1 consumers; there are no scripts,
external fonts, bitmap assets or network references. Their outer background is transparent;
solid faces retain the night palette so they can hide the geometry behind them.

Reference a sprite symbol with `<svg viewBox="0 0 256 256" aria-label="Processor"><use
href="/hardware-atlas-24.svg#processor-isometric" /></svg>`, after placing the downloaded
sprite in the hosting application's public assets. The workbench can download the current
pose individually; its pack always contains all 24 assembled three-quarter symbols.

## Verification

`npm run hardware:check` exercises 1,944 combinations of object, detail, look, view,
opening and viewport; checks the frame margins and equal SVG/canvas points; samples
1,000 deterministic seeds; and checks the 24 unique symbol names.

`npm run hardware:browser` checks the built page's selection, filters, SVG/XML downloads,
clipboard, sprite, URL restoration, reduced motion, phone/tablet overflow and server-rendered
SVG collection without JavaScript. It writes screenshots to `hardware-out/`.
The existing figure source/look audits apply to `hardware-atlas`, including the three
audit seeds and their pointer responses. No thresholds or audit rules were loosened.
