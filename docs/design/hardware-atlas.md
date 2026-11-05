# Hardware atlas

`/lab/icon-kit/` is a collection of twelve illustrative physical assemblies. Each has
isometric and wireframe SVGs, three camera presets, an exploded pose, and named parts. Engineering detail reveals the manufacturing features; isolation fits one selected assembly to the viewer and exports it separately.
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
| [Dell PowerEdge service manual](https://www.dell.com/support/manuals/en-dm/poweredge-r750/per750_ism_pub/inside-the-system?guid=guid-86215914-c63d-48ee-9978-9eb22ee2149c&lang=en-us) | Independent drive carriers, a fan wall, DIMMs, dual processors, redundant rear power modules and a removable service cover. |
| [Raspberry Pi camera reference](https://www.raspberrypi.com/documentation/accessories/camera-module-3.html) | Sensor carrier, flat-flex connection, voice-coil alignment and retained optical elements; no invented variable iris. |
| [Corsair PSU components](https://help.corsair.com/hc/en-us/articles/19653486491789-PSU-Corsair-PSU-FAQ) | Conversion components, filtering capacitors and heatsinks occupy distinct board areas. |
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

Solids across all assemblies form a dependency order: a lower overlapping solid paints before the one above it, with projected depth as the tie-breaker. A comparator alone cannot preserve these constraints. Surface markings are attached to the surface they occupy, even when the builder added another solid first. Internal mesh seams of the vented panel are not stroked. A single visible face outlines the selected part in teal. Wireframes intentionally
show the internal and rear edges at lower opacity.

Pointer inspection hits the frontmost projected face, then lifts only that part using its unlifted position for picking. Individual explosion vectors keep peer components together. Isolation hides other assemblies and eases the selected part into view; returning to the whole assembly reveals it after the view fits.
Camera presets interpolate through the existing clock's `follow`; they never spin with
time. Reduced motion snaps to the requested pose. Each camera fits every point of the
whole assembly, including all lifted parts. Canvas avoids SVG path-string formatting in
its frame loop. Changing data does not remount the clock. Immutable model geometry, prepared solid bounds and a bounded projection cache avoid recalculating static rest frames.

## Reuse and exports

Use `<HardwareIcon kind="processor" mode="wireframe" />`. Optional `view`, `open` (0–1),
`pick` (part index), `detail` and `decorative` props select the composition and accessible treatment.
The component is demonstrated in `/design-system/`.

`npm run hardware:export` creates 24 standalone SVGs, twelve additional exploded poses, a sprite with stable IDs such as
`processor-isometric`, and numbered contact sheets in the ignored `astro/hardware-out/`.
SVGs use separate paint and opacity attributes for SVG 1.1 consumers; there are no scripts,
external fonts, bitmap assets or network references. Their outer background is transparent;
solid faces retain the night palette so they can hide the geometry behind them.

Reference a sprite symbol with `<svg viewBox="0 0 256 256" aria-label="Processor"><use
href="/hardware-atlas-24.svg#processor-isometric" /></svg>`, after placing the downloaded
sprite in the hosting application's public assets. The workbench can download the current
pose individually; its pack always contains all 24 assembled three-quarter symbols.

## Verification

`npm run hardware:check` exercises 3,888 combinations of object, detail, look, view,
opening and viewport; checks the frame margins and equal SVG/canvas points; samples
1,000 deterministic seeds; checks every isolated part in each camera view; validates trace endpoints against named source and destination footprints; tests depth dependencies across 100 seeded layouts; and checks the 24 unique symbol names.

`npm run hardware:browser` checks the built page's selection, filters, SVG/XML downloads,
clipboard, sprite, isolation, detail levels, URL restoration, reduced motion, phone/tablet overflow and server-rendered
SVG collection without JavaScript. It writes screenshots of all twelve engineering models and exact browser-rendered seed and six-state audit sheets to `hardware-out/`.
The existing figure source/look audits apply to `hardware-atlas`, including the three
audit seeds and their pointer responses. No thresholds or audit rules were loosened.
