# Room kernel index

The deterministic implementation lives in `astro/src/figures/kit/`. Start with this
index; open implementation only for the part being changed. The check scripts live
separately in `astro/scripts/figures/` and judge the output, not the builder's intent.

| API / module | Contract and gotcha |
| --- | --- |
| `ROOM_METRICS`, `ROOM_NAMES` / `roommetrics.ts` | Converts the legacy tabletop grammar into human-scale furniture and chooses room dimensions. Original `TableTheme.w/d` are local grammar dimensions, not world placement bounds. |
| `arrange(rng, theme?)` / `tabletop.ts` | Seeded world-space table inventory. Scales intents before placement; monitors/towers have independent device sizing. Never randomize a frame. |
| `tabletop(p)`, `itemModel(it)` | Actual transformed geometry and bounds. Use these for room furniture placement, framing and collision checks. |
| `roomPlan(p)` / `roomplan.ts` | Room envelope, floor/ceiling and shared `nookZ`, `serviceZ`, `cookZ`, `lampZ`, `windowZ` anchors. Dining keeps rear seating clearance; task surfaces meet the back wall. |
| `placedRoomPart(...)` / `roomcompose.ts` | Build one owned draft, transform once, then measure bounds. `support` is for thin textiles, not a collision exemption for arbitrary furniture. |
| `roomModels(p)` / `tableroom.ts` | Three walls and floor, architectural fixtures and furnished zones. Cached by theme/room variant: builders must not depend on unkeyed inventory randomness. |
| `roomZones`, `roomDressing` | Functional secondary zone, storage, chairs, textiles, trolley, lamps and wall art. Clinical utility and domestic lounge pieces have different programs. |
| `chair`, `loungeSeat`, `sideboard`, `tallCabinet`, `sinkCounter`, `refrigerator`, `craftBench` | Specific geometry builders in `roomseats`, `roomlounge`, `roomstorage`, `roomkitchen`, `roomworkshop`. Their local back is −z; turn the whole model toward the room. |
| `themedWindow`, `roomDoor`, `roomWallShell`, `wallFinish` | Window treatment, door hardware and architectural surfaces. Casements have real shell openings; avoid tiles/patterns covering those openings. |
| `accessory` / `roomdecor.ts` | Inserts a scaled prop and preserves its material semantics: paper, cover, glass, ceramic, metal or equipment. |
| `roomPaint`, `propPaint`, `decorPaint` | Typed material recipes. Colour values enter through `ink.ts` and the separate mirrored room token family. |
| `roomLighting`, `setRoomLighting`, `roomPracticals` | Single shadow key, theme fill and fixture-based practicals. Reflection targets are lazy and disposed through the runtime hook. Match shared anchors when moving a fixture. |
| `roomTexture`, `roomShadows` | Material-local procedural detail and PCSS composition. Do not patch global Three.js shader chunks or displace collision geometry. |
| `roomView`, `roomProject`, `roomVisible`, `roomClip` | Native/fallback camera agreement, fixed eye height, entrance arc, orthographic preset, cutaways and near-plane clipping. Zoom changes the lens, not the camera path. |
| `buildRoom`, `updateRoom`, `flatRoom` | Geometry/material/view rendering and selection. A static room caches its input stamp and calls `ThreeFrame.renderWhen`; other figures retain their normal runtime. |
