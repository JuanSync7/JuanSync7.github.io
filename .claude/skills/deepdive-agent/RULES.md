# Layout contracts

These IDs classify observed failures. The owning check family is a place to prove
the contract, not an assertion that every visual judgement is automated. A new
measured contract needs a negative fixture before it can be called enforced.

| Rule | Reject or investigate | Proof family |
| --- | --- | --- |
| DD-SEED | Identical source and inputs produce different plans; invalid seeds silently coerce to unrelated scenes. | deterministic replay and input cases |
| DD-VARIETY | A family changes only unused metadata or repeats the same drawing across seeds. | geometry-only signatures across the seed sweep and visual comparison |
| DD-BOUNDS | Geometry is nonfinite, inverted, degenerate or outside its declared physical boundary. | geometry predicates and generated seed sweep |
| DD-SELECT | The zoom window cuts an arbitrary component/space instead of selecting a complete part. | selected bounds/model checks and close-up review |
| DD-CONNECT | A wire, road, path or door lacks a real endpoint, junction or declared continuation. | endpoint/reachability checks against emitted geometry |
| DD-MATERIAL | A bond wire is drawn as an orthogonal metal trace, has a layer-change via or crosses another bond in the projected fanout. | conductor-material, ordered fanout and false-via fixtures |
| DD-CLEARANCE | Routes cross unrelated component interiors, parcels occupy roads/water, or furniture blocks a door swing. | segment/box intersection and domain clearance checks |
| DD-REPEAT | Repeated units lose pitch, containment, matching or their common routing relationship. | family-specific model checks and inspection |
| DD-ACCESS | A room or building has no usable entrance and route to shared circulation. | room/urban access graph and wall-opening checks |
| DD-HYDROLOGY | A river climbs its own terrain, stops on land without a modeled sink, or a crossing lacks a bridge. | field/river and road/water intersection checks |
| DD-CONTOUR | Contours cross each other or fail to describe the same scalar elevation field. | contour intersection/field checks and topographic review |
| DD-HANDOFF | The camera jumps at a level boundary, child detail escapes its window or level borders flash. | boundary projection, browser frame comparison and motion review |
| DD-REGISTER | A wire-bond package invents a different child pinout, misses the child's actual pad coordinates or loses its inside landing span at the portal. | actual child-pad registration, containment and retained-interface fixtures |
| DD-BUDGET | A layout or draw exceeds its measured geometry/frame budget, or repeated navigation leaks resources. | generated counts and browser/figure performance checks |
| DD-EVIDENCE | A pass cites stale source, missing artifacts, zero inspected cases or an unperformed visual review. | source fingerprint, artifact checks and review record |

## Catch the wrong fix

- A wire ending at the nearest rectangle is not a terminal connection.
- A doorway drawn over a solid wall is not an opening.
- A road drawn through a building is not access to that building.
- Independently randomized nested loops are not topographic contours.
- More detail does not repair wrong topology; repair topology before density.
- A screenshot hash change proves difference, not quality or useful diversity.
- A different threshold is not a layout repair. Explain a policy change separately.
