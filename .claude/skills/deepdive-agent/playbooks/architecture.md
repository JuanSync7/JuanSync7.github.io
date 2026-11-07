# Architectural layout review

Read `astro/docs/deepdive-room-references.md`. The block shows uncut roof footprints;
building and floor views show horizontal cuts from above. Do not mix elevation,
roof and floor-plan conventions in one view.

1. Reserve continuous circulation, exterior entrances and vertical/service cores.
   Allocate viable room frontages along circulation, including the selected wing
   or room, before walls and furniture.
2. Keep physical units explicit. Building/floor detail scales differ by four:
   repeated desks, door leaves, wall faces, panes and stair/lift prototypes retain
   their physical sizes as the camera changes view.
3. Cut both wall faces around openings. Hinges, leaves, sweep arcs, jambs and
   clearances share the same opening. A double door has two real leaves; an arc
   over an uninterrupted wall does not provide access.
4. Place measured stair flights, landings, treads and lift shafts inside their
   bays. Walk lines join landings; lift entrances open toward accessible space.
5. Furnish by programme: homes have living/bed/kitchen/bath space; workplaces have
   desks, meeting rooms, support spaces and WCs. Solid furniture clears swings and
   approaches. Floor rugs may overlap tables, but their non-solid status must be
   explicit rather than an exception that excuses collisions.
6. At the block scale, give each footprint a street frontage and entrance path.
   Open service-lane exits through the kerbs; keep parked cars away from crossings.
7. The terminal room remains furnished. Do not insert a regional map into it as a
   literal nested object; the fresh journey begins through the shared dissolve.
8. Project actual child entrances into the parent window. Join street/service
   approaches and wing doorways through the empty frame margins, clearing the
   child's shell. Open the teal inspection outline at the real source jambs;
   a smaller floating shell with no approach does not establish continuity.

Run `room-check.mjs` on production salts and `room-selftest.mjs`. Inspect emitted
wall gaps, close-up furniture and phone frames; model labels alone do not prove
accessibility. These illustration checks do not constitute construction approval.
