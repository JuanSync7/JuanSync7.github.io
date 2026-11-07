# Room craft rules

These are project rules drawn from the user's room-design corrections, not newly
approved global vault guidance. Numeric limits belong in the scoped check config.

| Rule and case | Keep it | Reject when | Held by |
| --- | --- | --- | --- |
| Human scale — 7 Nov: “the desk to room proportion is not correct” | Measure the primary footprint and actual device sizes before decorating; use `ROOM_METRICS` at the boundary from the local tabletop grammar | A table is expanded to fill a room or a monitor is shrunk to make props fit | `room-program-check.mjs` and `room-program-limits.json` |
| Functional room — 7 Nov: “the actual whole room ... fit the theme” | Give each theme defining secondary furnishings and usable circulation | A room is one generic shell with a different table inventory | Required room programs and flood-fill route checks; visual review |
| Clear placement — original request: “Make sure nothing overlaps” | Use post-transform model bounds, actual door span and measured textile bounds including fringe | Two furniture pieces or distinct rugs intersect, or a door approach is blocked | `tabletop-room-check.mjs` and the layout sweep |
| Specific objects — whole-room correction asks for appropriate chairs, cabinets and decoration | Model the parts that make the object recognizable, with semantic finishes | A named object is a plain block, or everything on a shelf inherits wood | `LOOK.md`; finish/tokens checked mechanically |
| Light has a source — lighting and shadow requests | Match the key to a window or ceiling source; give practical light a fixture; retain highlight detail | Light pools have no fixture, shadow direction contradicts the source, or material colour supplies all the ambience | Theme/lighting records, colour image checks and `LOOK.md` |
| Architecture belongs to the use — whole-room correction | Choose window and curtain/blind, door hardware, wall and floor finish together | A clinical room has domestic drapes or every theme has identical chairs and finish | Program checks and `LOOK.md` |
| Appearance reaches every mount — 7 Nov: “The full colour does not work?”; the live main-scene switch worked, while previews stayed monochrome | Own appearance once in the viewer, pass it to the scene and seed previews, and give the gallery an explicit colour preset | The selected mode changes the main canvas while nearby previews keep the engine's night default | `room-colour-browser.mjs`: rendered preview differences, gallery colour and bounded frozen previews |
| Evidence before completion — the earlier audit passed while proportions were wrong | Check layout, then inspect rendered rooms at both camera modes and phone size | Pixel metrics are used as proof that the room is well designed | Ordered verifier, before-case fixture and visual review |

## Catch yourself

| Temptation | Redirect |
| --- | --- |
| “More objects will make it complete.” | Name the activity missing from the room, then furnish that zone. |
| “The table needs to fill the image.” | Fit the room; measure the table against human furniture and floor area. |
| “Shrink every prop by the same number.” | Check device sizes independently; monitors and towers need their own scale. |
| “Rugs can overlap because they are supports.” | Permit furniture contact with a support, but test separate textiles against each other. |
| “Move the lamp; its light can stay there.” | Use the shared `roomPlan` anchor for the fixture and its light. |
| “An extractor makes it a kitchen.” | Model the cooking surface and align its hood and light; check their actual footprints and clearance. |
| “The audit is green, so the design is done.” | Read all themed captures and answer the craft questions. |
| “Change the threshold to pass.” | Fix geometry, composition, materials or lighting. |
