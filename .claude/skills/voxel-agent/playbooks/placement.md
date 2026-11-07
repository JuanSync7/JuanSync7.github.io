# Placement and access

**Use when:** anything clips, floats, blocks a door, fails to fit or repeatedly lands
at the same coordinates.

**Inputs:** complete models, terrain and liquid maps, local habitats, occupied cells.
**Outputs:** accepted placements, supported paths and an accounted omission list.

1. Sample a bounded set of seeded candidates in the recipe's habitat. Score usable
   candidates by foundation cost and layout context; do not place from a fixed anchor.
2. Test the complete footprint plus clearance against terrain bounds, liquid,
   protected building lots, canopy-to-canopy/focal envelopes and reserved access cells. Use real 3D solid clearance for layered dressing. Test actual voxel bottoms against
   terrain and cave headroom as a second, narrower check. Only declared loose groundcover may conform to slopes; verify every resulting column and fragment against actual supporting ground.
3. Buildings can grade only within the configured foundation budget. Prepare the
   change, validate it and the entrance, then commit it atomically. A rejected site
   cannot leave an edited terrace behind.
4. Reserve the entrance as soon as the shelter is accepted. This reservation exists
   before later buildings, trees and props. Route supported paths between reachable
   settlement entries using bounded graph search.
5. Run boat placement separately on a common liquid level. Hulls and sails include
   the bob/roll clearance. Ice and narrow channels are not navigable water.
6. Record every omitted recipe and rejection reason. If search cannot fit an object,
   omit it within the plan's rules rather than forcing an overlap or a default scene.

**Reject:** a failed support/clearance/access check, infinite retries or silently
missing planned objects. Do not claim every island has a connected road network:
water and steep cuts can separate reachable settlement groups.
**Check:** `validate.mjs`, placement selftests and camera-independent geometry tests.
**Tools:** `Placement`, `connectSettlements`, `populateHarbour`; policy inputs.
