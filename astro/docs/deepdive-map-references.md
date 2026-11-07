# Deep-dive maps: references, grammar and review

The map generator emulates the spatial rules of references. It does not copy their artwork,
annotations or map data. All geometry is generated from a reproducible seed.

## References consulted on 7 November 2026

- [USGS, Topographic Map Symbols](https://pubs.usgs.gov/gip/TopographicMapSymbols/topomapsymbols.pdf):
  equal-elevation contours, index/intermediate hierarchy, hydrology and bridge conventions.
  The USGS symbol guide was available through search; direct PDF retrieval returned 403.
- [USGS, US Topo cartographic specifications](https://www.usgs.gov/ngp-standards-and-specifications/us-topo-cartographic-specifications-map-symbol-guide):
  scale-dependent representation of buildings and transport networks.
- [1951 USGS Taku River A-4 quadrangle preview](https://store.avenza.com/products/taku-river-a-4-ak-1951-63360-scale-united-states-geological-survey-map):
  visual reference for contours meeting drainage valleys and hierarchical linework.
- [Seattle Streets Illustrated, street concept plan template](https://streetsillustrated.seattle.gov/urban-design/street-concept-plans/design-template/):
  actual top-down drawing reference for distinct carriageway, kerb, pedestrian and frontage bands.
- [Seattle Department of Transportation, Thomas Street protected intersection](https://www.seattle.gov/transportation/projects-and-programs/programs/greenways-program/thomas-st-5th-ave-n-to-dexter-ave-n):
  actual plan image showing deliberate intersections and the placement of planted/pedestrian areas.
- [Global Designing Cities Initiative, Global Street Design Guide](https://globaldesigningcities.org/publication/global-street-design-guide/):
  street network and pedestrian space treated as infrastructure reserved before buildings.

## What is emulated

A region is one continuous coastal valley. One triangulated elevation grid generates every
contour and its zero-elevation shoreline. A river follows the valley floor, and its centreline
strictly loses elevation until it meets the coast. Town access branches meet a connected
trunk road at exact junction coordinates; water crossings carry visible bridge decks.
Topographic strokes are masked under settlement glyphs so the town plan remains legible.
A rail halt has a platform and an access path into the city, rather than detached track marks.

A city starts with street-centre coordinates, then reserves their full widths. The remaining
polygons become blocks; the selected district is exactly one of these blocks. A river occupies
an explicit corridor before parcels are generated. Only declared bridges cross the channel,
and riverbank strokes stop at the bridge deck. Buildings are inset from their parcel's kerb.

A district resolves the same grammar into larger visible kerbs, sidewalk bands, roof outlines,
ridges, courtyard blocks, civic buildings and parks. Every building entrance has a path ending
on an actual street frontage; paired building rows face their nearest street. Parks have paths
through their centres and trees outside those paths. Buildings are never scattered without
an access relationship.

## Randomization that preserves structure

The seed selects grid pitch, local block rhythm, selected block offset, river side, parcels,
building use and terrain phase. It does not move a building independently into a road or water.
Contour points on a shared triangle edge use the same ordered vertex pair, giving bit-identical
intersections. This avoids tiny contour branches caused by rounding almost-equal endpoints.

The region and urban models are exported from `map-region.ts` and `map-layout.ts`, attached to
`Sketch.model`, and rendered from their exact coordinates by the map painters. The independent
checks work on those models and the emitted linework.

## Checks and regression loop

Run `node scripts/deepdive/map-check.mjs --seeds=96` and
`node scripts/deepdive/map-selftest.mjs` from `astro/`. Checks cover bounds, exact selected-block
containment, connected streets, actual bridge intersections with both banks, water/building
separation, frontage access, parcel overlap, equal-elevation contour residuals, contour crossings,
closed/boundary-ended contours, downhill drainage, estuary connection and deterministic replay.

The adversarial selftest deliberately disconnects streets, removes bridge declarations, overlaps
buildings, detaches entrances, occupies water, removes selected blocks, reverses river flow,
truncates the estuary, removes town access and inserts crossing/hanging contours. Each must fail.

Visual review uses the shared deep-dive gallery. Inspect region, city and district at full scale
and as nested children. A passing geometry check does not establish that an image is legible.

## Detail regressions found during review

- Independent contour blobs were replaced with one elevation field. A later independent audit
  found a microscopic spur caused by rounded stitch keys; canonical grid-edge interpolation
  removed it. Tests now reject both crossing contours and hanging interior endpoints.
- Contours running through town outlines were visually noisy. Town footprints now mask the
  contour layer before their streets and buildings are drawn.
- A three-column town glyph let its centre street cut through the middle roof. Towns now carry
  explicit corner building footprints and internal street coordinates; the checker measures their
  intersections, and an adversarial fixture restores the bad overlap to prove detection.
- The first rail platform lay on the far side of the track, so its approach path crossed the rail
  without a crossing. The platform now faces the settlement. Its access path must join the
  platform and an actual road, and must not intersect the track. A detached-path fixture fails.
