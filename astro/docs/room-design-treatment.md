# Room-design treatment

| | |
| --- | --- |
| What | A whole-room revision of the seeded `pixel-still` scene |
| Why | The user rejected the desk-to-room proportions and asked for complete game/designer room composition |
| Who | The room implementer and whoever reviews its rendered output |
| When | Use while building and judging this scene; revise when its purpose changes |
| Where | Geometry in `src/figures/kit/`; independent checks in `scripts/figures/`; reusable guidance under `.claude/skills/tabletop-room/` |

## Brief and acceptance

The user's correction on 7 November 2026: “the desk to room proportion is not correct.”
The subject is the complete room: arrangement, appropriate furniture, windows and
coverings, wall/floor treatment, cabinets, textiles, light/shadow, atmosphere and
objects that make its use recognizable. The existing colour/monochrome switch and
both camera modes remain part of the scene.

Before surface polish, measure the room's primary footprint and human-scale furniture.
Give each theme primary use, secondary use, storage and circulation. Check the actual
geometry and routes, then read all nine themed rooms. This revision is a candidate
until the user has judged the result; agent review is not human acceptance.

## Reference card

| Source inspected | Shared visual / construction rule |
| --- | --- |
| Existing metre-scale `src/figures/kit/furniture.ts` and the vault's floor-plan furniture example | Furniture has human dimensions; seats relate to tables; sink/cooking runs and storage define a room; doors need usable clearance. The plain plan is the scale reference. |
| The earlier room gallery and source revision `5baabe9` | The rejected case: table inventories and colour variation did not compensate for a primary table occupying about 43% of a room floor. |
| [Kenney Furniture Kit catalogue](https://kenney.nl/assets/furniture-kit) | A game-room vocabulary is assembled from recognizable furniture types and parts. Catalogue consulted; its preview image was blocked, so no image-comparison claim is made. No asset or model was copied. |
| [Three.js shadow guide](https://threejs.org/manual/pages/shadows.html) and installed `RoomEnvironment` | Separate a single shadow key from fill/practicals; place light sources coherently; use prefiltered reflections and dispose resources. |

The earlier floor-plan example's door-overlap criticism is preserved in the vault.
The current room checks use measured door span and separate furniture/textile bounds.
Failed IKEA and Dimensions reference requests were not used as evidence.

## Rulings

| What | Why | Cost if wrong |
| --- | --- | --- |
| Use approximately 2.2 world units per metre, with one conversion boundary from the old tabletop grammar | Keep existing seeded functional layouts while correcting the furniture's relation to chairs, doors and room | A different desired style may need the metric table retuned; the independent scale/program checks show the effect |
| Give monitors and towers independent size factors | Uniform accessory scaling produced an undersized computer | The desired device may be smaller; adjust the device factor and retain physical bounds checks |
| Dining is free-standing with six seats; task surfaces retain back-wall contact | Two-sided dining seating needs rear access, while desk/bench functions benefit from a wall | This supersedes the earlier all-tables-flush arrangement for dining; keeping that constraint would require a banquette design instead |
| Open the product viewer in isometric; preserve Eye level | The whole room and its functional zones are legible immediately | A preferred eye-level default can be restored without changing geometry or camera contracts |
| Use purpose-specific secondary zones rather than more primary-table clutter | A room is complete through activities and storage, not just object count | The user may prefer another secondary activity; room programs keep that choice explicit |
| Keep one shadow key and non-shadow practical fill | Maintain deterministic soft shadows and rendering cost while matching visible sources | This is a stylized physical-lighting approximation, not full global illumination |
| Archive feedback and supporting files in the private vault's intake area | The user explicitly asked to return rules, playbook, kernel and checks | Intake does not establish guidance adoption or independent approval |

## Correction record

| Observed defect | Resulting change / regression evidence |
| --- | --- |
| The prior pixel audit passed an oversized primary table | Captured old world measurements; new floor-share check intentionally fails that fixture |
| The computer's screen became too small after room scaling | Device-specific sizing plus independent monitor/tower world-size checks |
| Separate work and lounge rugs crossed at their fringes | Measure textile bounds against other textiles; move the nook using a shared plan anchor |
| A cabinet faced away from the room and a clock approached the window | Reorient storage to the room and separate wall zones; use geometry checks and visual review |
| A trolley narrowed the route to dining storage | Move it toward the entry side and check connected walking routes with clearance |
| Architectural daylight had no actual opening | Build casement wall sections around an opening; preserve its space in tile/pattern geometry |

## Declined to judge / not claimed

- Human acceptance of this candidate is not yet known.
- These are stylized game/designer rooms, not construction, accessibility or laboratory compliance plans.
- No claim is made that every possible seed has been exhaustively rendered; the deterministic placement
  guards run for each build, and verification sweeps the recorded sample and all room variants.
- The new playbook has not been evaluated as a transferable global policy over later projects.
- No public site push or deployment is authorized by the vault feedback request.
