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
| Real supports — 7 Nov: “shelves ... buggy and floating” | Build shelves as wall-backed cases, place contents from actual board tops and prop bases, and connect projecting lights through visible mounts against actual wall faces | Books hover or clip into boards, a display stack has no support, or a wall/ceiling fitting has no attachment path | `room-support-check.mjs` measures output faces and mount contacts; `room-support-regression.mjs` rejects six mutated real-room failures |
| Fallback occlusion — shelf correction: geometry can be supported while a tall panel still paints over its contents | Split compound furniture along its face planes and traverse back to front; keep texture and line clips on those fragments | Mean face depth makes books appear outside a case or hides shelf boards | `room-depth-check.mjs` compares painted pixel centres with independent 3D rays across themes, variants and camera poses; the legacy painter must fail |
| Stable eye camera — 8 Nov: “0 and 180 ... eye level view is very different” | Keep one bounded lens, a horizontal sightline, human eye height measured from the floor and mirrored entrance endpoints; zoom changes only the lens | Nearby furniture widens one view, changes eye height or pulls the aim downward | `room-camera-check.mjs`: 8,991 poses, output mutations and captured pre-fix regression |
| Floor at the camera boundary — endpoint review found an opaque black WebGL patch | Keep a tessellated upward grout bed over the structural floor; check actual endpoint pixels, including rugs | A room-wide underlay face writes through the boards at the near-plane corner | `room-eye-image.mjs` rejects the captured defect and mutated real images; all nine colour themes exercise 0°/90°/180° in both renderers |
| View-specific framing — ceiling/eye review found a correct interior at 96.5% coverage | Eye interiors may fill the frame and must retain the primary activity, a natural lens and readable floor/ceiling; overview keeps its sparse framing guard | A correct human view is widened or moved to manufacture background margin, or general site thresholds are relaxed | Separate eye occupancy in `room-camera-limits.json`, shared colour/contrast/highlight checks, geometric projection checks; overview/global limits unchanged |
| Finished ceiling — 8 Nov: “at eye level, put a proper ceiling ... based on the room” | Close the wall tops with a continuous themed roof; vary real interior construction by seed; cut it away only in overview | A lid floats above walls, fixtures have no visible attachment, or the shadow key is above an opaque roof | Camera/ceiling geometry and visibility checks; clinical/bar source checks; native/fallback visual review |
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
| “Fit every near lamp into the eye view.” | Let peripheral furniture crop naturally; preserve the lens and frame the primary activity. The overview fits the entire room. |
| “A ceiling is only a plane.” | Close wall joints, model its interior finish and check that fixtures and light sources sit below it. |
| “Change the threshold to pass.” | Fix geometry, composition, materials or lighting. |
