# Architectural plans in the zoom dive

The block, building and floor levels use the drawing conventions of a **horizontal
cut through a building**, viewed from above. Wall faces are cut edges, furniture
is projected from above, and windows occupy openings in the exterior wall. Roof
ridges and rooftop plant belong only to the preceding block's uncut footprints.
An architectural cut is not an elevation, and an elevation is not a top-down map.

## References examined

- [GSA, *Circulation: Defining and Planning* (2012), pp. 2 and 8–12](https://www.wbdg.org/FFC/DOD/UFC/600SERIES/RESOURCES/Circulation_-_Defining_and_Planning.pdf).
  Inspected the plan on PDF page 10 visually. Its perimeter office rooms,
  shared support spaces, cores and continuous circulation informed the grammar.
  The generated plans emulate these relationships; they do not copy its geometry.
- [Harvard GSD, *Housing with a long corridor*](https://www.gsd.harvard.edu/project/housing-with-a-long-corridor/).
  A reference for treating circulation as the building's organizing element
  rather than the leftover gaps between independently generated rooms.
- [New Zealand MBIE, *Planning for internal circulation*](https://www.building.govt.nz/building-code-compliance/d-access/accessible-buildings/internal-circulation/planning).
  The guidance's emphasis on understandable horizontal and vertical circulation
  supports the direct room → corridor → exterior/vertical-core topology.
- [WBDG, *Office Building*](https://legacy.wbdg.org/building-types/office-building).
  Office workstations, support spaces and accessible passage informed the
  workstation pitch. Desks now use a 2.25 m × 2.4 m module, including chairs and
  an aisle, instead of the former 1.6 m module.

These are visual and organizational references for an illustration. The drawings
are not construction documents or a building-code certification.

## Grammar and variation

`architecture-plan.ts` first reserves one continuous corridor, then allocates two
bands of rooms on it. All room doors meet that corridor. Both corridor ends have
openings through both faces of the exterior wall. Stairs, lift shafts and wet
cores occupy deliberate bays; they are not added over arbitrary rooms afterward.

Every seed varies the selected bay's horizontal location and side, the widths of
the other bays, the corridor width, the floor's home/workplace programme and its
furniture. The selected bay is always exactly the portal's 1 × 0.5 drawing units.
It is chosen before any wall or piece of furniture is drawn. Thus the zoom never
cuts through an arbitrary group of unrelated rooms.

The support bays use smaller widths than habitable rooms instead of putting a
single bath in a large office-size bay. A workplace has WCs, not a domestic bath;
a home has bedrooms, a living room, kitchen and bathroom. WC cubicles include
partitions, actual door openings, hinged leaves and sweep arcs. Larger bathrooms
can include a shower and linen storage. Terrace pergola slats terminate at their
frame instead of floating over the roof.

Furniture uses 0.095 drawing units per metre in a floor plan and 0.02375 in a
building overview. Their ratio follows the portal's 4× magnification, so the same
desk retains its physical size when seen inside a selected wing. Building bays
are open-plan wings rather than individual small offices. The terminal selected
room is furnished too: its actual linework is retained as the journey's final
detail before the next journey begins. Rugs are recorded separately from solid
furniture so a table can stand on one without masking an actual collision.

Partitions, facade thickness, jamb margins, furniture setbacks and door clearances
use that same unit convention. A floor room has one approximately 1.05 m leaf;
a building wing has two leaves of that size, with separate hinges and sweeps.
Exterior entrances use approximately 0.9 m leaves, one on a floor and two in the
building overview. Facade mullions repeat at roughly 1.5 m, rather than turning
into oversized glass panels at the coarser level.

Vertical circulation uses measured fixtures from `architecture-cores.ts`: a
2.4 × 3.8 m U-stair with two 1.05 m flights, ten 0.28 m treads per flight, a
1 m return landing and a connected out-and-back direction mark. Lift shafts
are 2.2 m square with a 1.8 m car and a clear 0.9 m entrance. A large building
core zone can contain a bank of up to three shafts, separated by access space.
Fixtures are placed only when they fit the support bay; a large bay never
enlarges a staircase, tread or shaft. The checker measures these dimensions and
the emitted horizontal tread strokes independently of the direction mark.

At building scale, small furniture circles use six segments instead of ten;
workstation extents and every placement are retained. This detail reduction
addresses the measured upper-tail salt `2858099656`, which originally exceeded
the 12,000-segment drawing budget. The regression checks that the detailed and
overview workstation footprints are identical. A repeat across 4,096 mixed
32-bit salts stayed below the unchanged limit; the largest was 9,017 segments.

`architecture-draw.ts` draws each wall in pieces around openings. Door hinges,
leaves, sweep arcs and door clearances share the same coordinates. Exterior panes
and mullions are drawn inside matching gaps in both exterior wall faces. Furniture
must clear the sweep and a passage from the doorway into the room.

The block level uses a separate cadastral grammar in `urban-block.ts`: two rows
of street-facing parcels with setbacks, front-door paths to the public pavement,
and rear paths to a shared service lane. The lane has real openings in both kerbs
at each short side. Parking is placed in road bands, clear of the corner crossings.
Only this level shows roofs, terraces and rooftop plant.

`dive-connections.ts` joins the two levels at their actual openings. Both the
street approach and rear service path continue through the selected footprint
to the child's left/right corridor entrances. A selected wing's doorway tapers
into the narrow side margin and turns into the child floor's entrance. These
are paired curbs with mitred turns, rather than a line drawn through a room.
Their endpoints match the doorway endpoints exactly, and the teal inspection
outline is interrupted only at the real approaches. Nothing is routed across
the child's shell or an unrelated room.

## Checks and feedback loop

Run from `astro/`:

```sh
node scripts/deepdive/room-check.mjs --seeds=128
node scripts/deepdive/room-selftest.mjs
node scripts/deepdive/connection-check.mjs --seeds=256
node scripts/deepdive/connection-selftest.mjs
```

The checker inspects the typed plan **and** the emitted strokes. It checks selected
bay identity, room and parcel separation, doors facing the corridor, actual gaps
through both wall faces, jambs and leaves, exterior entrances, furnishings clear
of the opening and passage, vertical/wet cores, frontage connections, rear-lane
exits, finite/bounded geometry and a clean selected aperture after clipping.

The selftest corrupts otherwise valid plans. It seals a door with a wall, seals
only the inner wall face, blocks the door's swing, detaches a doorway from the
corridor, shears the selected room, closes an exterior entrance, removes stairs,
removes all room evidence, closes a service-lane exit and draws through the selected
aperture. Programme fixtures also remove the kitchen and furnishings and put a
domestic bath into a workplace. Scale and terminal-detail fixtures also change
the unit convention, empty the selected room, discard its final detail and draw
outside its boundary. Door and wall fixtures enlarge a partition, create an
oversized leaf and remove the second leaf of a wing entrance. Each must fail
the corresponding check. Core fixtures also corrupt the tread pitch, remove
treads or all core evidence, and omit the exposed exterior jamb of a single-leaf
entrance. The 24 negative cases must continue to fail.

A numeric pass still requires reading the browser gallery at full size and phone
size. If a bad seed is found, retain its seed and failure, fix the grammar, add a
targeted fixture when the failure can be measured, then repeat the gallery. Do not
reduce wall or door checks to make a drawing pass.

Connection checks replay the production parent/child dispatcher across both
journeys, compare exact source and target openings, test both ribbon curbs for
self-intersection and shell intrusion, prove every emitted curb segment is
present, and prove the inspection perimeter is complete apart from its declared
doorways. Eleven adverse fixtures sever a curb, detach endpoints, pass through
an interior, reseal the frame or wall, omit an approach, collapse the ribbon or
cut an unrelated hole in the inspection frame.
