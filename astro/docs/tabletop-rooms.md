# Complete themed rooms

`pixel-still` generates a complete furnished room from a seed. The product viewer
opens in full-colour isometric view; Eye level and Monochrome remain available.
The room, rather than an enlarged tabletop, is the composition's subject.

## Scale and arrangement

`roommetrics.ts` converts the legacy tabletop grammar into world furniture scale.
The scene uses approximately 2.2 units per metre. Tabletop intent coordinates remain
local to the grammar; `arrange` scales those coordinates and actual prop geometry
before collision checks. `tabletop(p)` and `itemModel(it)` expose world geometry.
Do not use the legacy theme width/depth directly to place room furniture.

Task desks are roughly two metres wide and about one metre deep. A monitor and
computer tower have independent size factors rather than inheriting the size of a
small desk accessory. `room-program-limits.json` holds the scoped scale and floor
occupancy criteria; the check measures the resulting geometry, not those intentions.

Task surfaces meet the back wall. The dining table is free-standing, with rear
clearance and six chairs facing their place settings. `roomPlan` owns the envelope,
ceiling height and shared nook, service, window and lamp anchors. These anchors
keep moved fixtures and their practical lights together.

The seed chooses a theme, tabletop arrangement and one of three architectural room
variants, then independent palette (four), layout (three), furniture design (three)
and lighting (three) choices. Palettes coordinate material roles within each theme.
Layouts keep the table fixed while mirroring the whole room or deepening secondary
zones. Chairs, sofa cushions, side-table shapes, drawer fronts and table supports
also vary. Geometry caches include theme, architecture, layout and furniture design;
paint and light choices do not change cached geometry. The full inventory is seeded
once, never per frame. These are curated arrangements, not arbitrary continuous placement.

## Room programs

| Theme | Secondary use and storage | Architecture and ambience |
| --- | --- | --- |
| Dining | Six dining chairs, serving sideboard, china display | Casement with drapes, moulding, patterned wallpaper, timber floor, bordered rug and pendant cluster |
| Home office | Visitor armchair, reading table, filing drawers | Venetian blind, framed prints, oak floor, separate work and lounge rugs, task/ceiling light |
| Computer | High-back ergonomic chair, media sofa, game cabinet and controller display | Blackout roller, acoustic slats, dark floor, cool screen spill and warm local lamps |
| Stock/packing | Packing stool, steel supply rack, labelled filing drawers and supply boxes | High clerestory, utility surfaces, ribbed mat and broad working light |
| Creative workshop | Craft bench with vice, tool pegboard and parts cabinet | Blind, exposed brick, timber floor, swivel task chair and practical work light |
| Study | Timber desk chair, wingback reading chair, side table and library bookcase | Drapes, botanical prints, patterned wall finish, timber floor, separate rugs and warm reading light |
| Kitchen | Sink/preparation run, refrigerator/freezer and extractor hood | Cafe curtain, tiled dado, checkerboard floor, cupboard task lights and counter stool |
| Cocktail lounge | Leather footrest stools, velvet booth, cocktail table and bottle display | Arched window, panelled/patterned finish, dark floor, runner and warm pendants |
| Laboratory | Adjustable lab stool, wash-up station, chemical cabinet, cylinders and instrument trolley | Frosted clerestory, washable tile, quiet resin floor, utility mat and neutral/cool task light |

Every room also has an entry door, switch/outlet, appropriate wall artwork and a
clear entrance. Commercial doors have a vision panel, push rail and kickplate;
domestic doors use raised timber panels. Window, door and cabinet geometry includes
its frames, recesses, handles, hinges, shelves or louvers as appropriate.

## Placement and circulation

Room objects are built in their local frame, transformed once by `placedRoomPart`,
then measured. Distinct furniture must have disjoint physical bounds. Thin rugs
are declared supports for furniture contact; that declaration does not permit two
separate textiles to overlap. Textile bounds include borders and fringe.

Wall shelves have solid rear panels, side stiles and board tops shared with their content placement. Books and boxes use measured prop bases; upper rows do not use approximate vertical increments. Under-shelf fixtures share cabinet anchors with their light sources. Ceiling lights contact visible mounting rails that reach the back wall. Cupboard fixing cleats bridge the recessed kitchen plaster surface. The support check inspects actual inward wall faces, content support faces and attachment contacts; it rejects lifted, buried, detached, missing-support and removed-cleat mutations.

Feet meet the floor or a declared thin support. The door approach is checked using
the actual modelled door span, not a smaller placeholder rectangle. A grid search
checks a connected entrance route to the primary work/seating zone and storage.
The central aisle remains open; secondary furniture belongs to purposeful side zones.

The tabletop inventory retains its own real-footprint gap and functional layout
checks. Six dining place settings match both seating rows. Device, paper, glass,
ceramic and storage-object finishes remain distinct when inserted into room furniture.

## Camera

The entrance semicircle has center `(0, room.front)` and radius `room.half`.
At 0° and 180° the camera meets the side-wall starts; 90° faces into the room.
Eye height is 3.7 world units above the floor (about 1.68 m), fixed during orbit and resizing. Zoom changes the lens, not the path.
Eye level has a horizontal sightline and a 55° base vertical field of view. Its lens
does not change with angle, theme furniture or cutaway visibility. Mirrored endpoint
positions have matching projection and magnification. The primary activity remains
in view; nearby peripheral furniture can crop naturally. The isometric overview
frames the complete room instead of distorting the human view to fit every lamp.
Eye interiors may fill the canvas: their colour check requires substantial interior
coverage plus the same contrast/highlight guards, camera and subject projection,
and floor/ceiling image checks. The overview retains its original coverage margin.
The global sparse night-figure thresholds remain unchanged.
The floor has a continuous tessellated grout bed over its structural plinth. A redundant
closed underlay caused opaque WebGL patches at the near-plane endpoint corner;
colour browser checks now inspect actual floor pixels at both ends in every theme.

A continuous solid ceiling closes the wall tops in eye view. Domestic coffers,
workshop/bar beams, clinical/office panel grids and studio acoustic slats follow
the theme, with three seeded construction variants. The overview cuts away this
roof in both renderers; wall-connected rails retain support for exposed fixtures.

Isometric uses a true orthographic camera at 45° yaw and `atan(1/sqrt(2))`
elevation. An off-axis frustum fits the whole room without changing equal axis scale.
The near wall and its attached fittings cut away; a low cap retains the footprint.
Native and fallback projections share the same camera, clipping and visibility rules. Compound fallback furniture uses cached BSP plane splitting and back-to-front traversal; the split fragments also bound texture clipping. Independent pixel-centre rays check that case panels cannot hide their contents.

## Materials and light

All colours enter through `kit/ink.ts`. The separate `roomTones` palette is mirrored
in CSS tokens and the design-system ledger. Other figures retain the original night
palette and thresholds. Monochrome restores material albedo, roughness, metalness,
emission and neutral light together; switching appearance never changes geometry.

World-space procedural materials add wood grain, knots/plank variation, stone veins,
brushed metal, fabric weave and quiet plaster/ceramic variation. Derivatives filter
fine detail. Bump changes surface lighting, never physical bounds. Table grain follows
its long axis; timber floor grain follows the boards. Shelved accessories preserve
paper, book, glass, ceramic, equipment and metal semantics.

Daylit rooms use their casement as the key direction; the window wall has a real
opening behind the frame and follows the mirrored architectural layout. Clinical keys sit below the ceiling diffusers and bar keys align with
pendant openings, inside the closed room. The roof casts and receives shadows. Ambient fill, neutral prefiltered reflections and actual task/practical
lights support the single shadow key. Screen spill, candles, pendants, under-shelf
strips, floor lamps and the kitchen hood have corresponding modelled sources.
Thin textiles receive shadows without casting noisy self-shadow patterns.

Camera cutaways retain independent shadow-only structural walls and ceiling. Their
main-pass materials write neither colour nor depth, so the interior stays visible
while the window aperture and roof keep shaping the same light throughout the orbit.

The PCSS helper adapts the blocker-search/Vogel-disk approach from drei-vanilla;
its MIT notice is in `licenses/drei-room-shadows.txt`. Texture and shadow shader
hooks compose per material and never mutate global Three.js chunks. Reflection
maps are created only when colour is first used. All geometry, materials, shadow
maps and reflection targets are disposed on unmount.

The 9 November lighting pass lowers broad fill relative to the key, separates
monochrome wall/floor/material values, retains texture, and adds neutral practical
pools. Seeded daylight, evening, overcast, clinical and low-light variations share
physical source anchors. Small depth-tested source halos support lamps; selected
atmospheric computer/bar variants add light distance haze. These are emitter
sprites and fog, not fullscreen HDR bloom or volumetric shafts. Both effects have
bounded budgets and cleanup. The Canvas renderer shares palette and signed
directional shading but does not reproduce GPU shadows, reflections, halos or haze.

The static room renders on demand through `ThreeFrame.renderWhen`; camera,
appearance, selection and size changes draw a new image. Idle frames retain the
last one. The shared figure clock still owns input and reduced motion. Seed preview
canvases remount by seed, while their outer buttons retain keyboard focus.

The software fallback shares geometry, placement, palette, view and cutaways. It
uses simpler face lighting and clipped coarse surface detail. Back faces are culled;
under-table supports paint before the work surface, and raised fittings after it.

## Verification and saved guidance

Run from `astro/` with a production preview running:

```bash
npm run rooms:verify -- --url=http://127.0.0.1:4410
```

The ordered verifier runs types/lint/site rules, physical layouts, room programs,
materials, production build, targeted visual audit, camera/input browser checks,
colour/fallback checks, 36 within-theme public palette seeds in both renderers,
performance, twelve seeds, galleries and the whole-site audit.
It writes `figures-out/room-validation.json`, starting incomplete and marking passed
only after all stages succeed. A failed stage stops the run.

The room program's measured pre-redesign fixture is
`scripts/figures/room-proportion-before.json`. Running the program check with
`--baseline` intentionally rejects that old oversized furniture. New scoped criteria
live in `room-program-limits.json`; global audit limits remain unchanged.

The lighting and variation workflow is filed under the requested
[web design agent](../../.claude/skills/web-design-agent/SKILL.md), including separate
lighting/seed playbooks, rules, kernel index, check map, brief template and references.
Its lighting check rejects seven broken output cases; geometry, support and
functional checks cover all 243 architectural/layout/furniture combinations.
The existing reusable room playbook is [tabletop-room](../../.claude/skills/tabletop-room/SKILL.md).
Its separate [rules](../../.claude/skills/tabletop-room/RULES.md),
[look questions](../../.claude/skills/tabletop-room/LOOK.md),
[kernel index](../../.claude/skills/tabletop-room/kernel/INDEX.md) and
[check map](../../.claude/skills/tabletop-room/checks/README.md) distinguish deterministic
acceptance from visual judgment. [The treatment](room-design-treatment.md) records
references, design choices, rejected cases and limits. The changelog lives in
`docs/internals/CHANGELOG.md`.

Read the actual room, seed, mode and camera captures before handoff. A passing pixel
audit does not establish good room proportions. Vault feedback archives exact evidence
and remains a report for review; it does not adopt global guidance or publish the site.
