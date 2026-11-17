# LEGO rules

Each rule says what it is held by. A rule held by a check is not a judgment call.

## Pieces

- Everything visible is a catalogue piece, the base included. No smooth slab, no box that is not
  a brick, no "close enough" shape. (Check: the figure draws only `legoModel` output.)
- Every piece sits on whole studs and whole plates; rolling parts (wheels, axles) are placed by
  their axis. (Check: `offGrid`.)
- No two pieces share a cell. Wheels take every cell their cylinder reaches; an axle's path is
  clear apart from its technic holes and hubs. (Check: `clipping`.)
- Every piece joins the root through studs, side studs, a hinge or an axle. A stud joins only
  where a socket meets it head on, whichever way both pieces face; tiles, curves and domes have
  none on top. (Check: `floating`, on world joints from `legojoint.ts`.)
- Underneath, a piece is a real piece: walls, a roof, tubes or pins (`legounder.ts`), from
  LEGO's published sizes. Our own geometry only; the LDraw library is a local reference
  (frontend-kit's reference compare), never shipped.

- Every catalogue shape stands for a real LEGO part (R-VOX-18): it is in `CATALOGUE`, named in
  the part map by `partKey`, and matches that part in the reference compare. A shape LEGO does
  not make is not in the catalogue; build the look from real ones instead (a shark fin is a 45°
  slope centred on jumpers, a halo a ring of plates and tiles). (Check: in frontend-kit,
  `npm run reference -- <ldraw dir>` in `bricks/`; here, `lego:check` fails any model piece that
  is not a catalogue shape.)
- The catalogue's one home is the `bricks` package of `JuanSync7/frontend-kit` (`bricks/src`,
  `bricks/parts/ldraw-parts.json`). This site keeps a byte-for-byte copy in `kit/lego*.ts` and
  `scripts/lego/ldraw-parts.json`, synced by `npm run lego:sync -- <frontend-kit>` and never
  edited here: each copied file says so in its first line. (Check: `lego:sync -- <kit> --check`.)

## Sub-assemblies: sideways and hinged

- What is not studs-up is a sub-assembly (`kind: 'sub'`): shapes on their own grid, studs up as
  usual, fixed to the model by a pose. Build the pose from the piece that holds it, never by
  hand: `onSide(piece(bracket))` puts the sub-assembly's studs-up face out of a bracket's flange,
  its first row of sockets on the flange's studs; `onHinge(piece(hinge), angle)` hangs it on a
  hinge plate's knuckle, its root a hinge plate facing x- at its own (0, 0, 0).
- Brackets and hinges are the real ones. A bracket (99780, 99207) has a studded base and its
  flange half a plate thick just outside the base's front edge, so what hangs on it stands that
  far out. A hinge is a 2 x 1 click hinge with fingers on its side (60471 two fingers, under;
  44567 one finger, the half that turns), its axis half a stud past the plate: two halves leave a
  stud between their plates, and a row of them is an even number of studs long.
- Use one for anything thin and upright (endplates, fences, a vertical fin) or set at an angle
  (flaps, a raked wing): a stack of plates on its edge is thick and stepped; a plate on its side is
  one plate thick and smooth.
- A bracket's flange is as tall as what it holds (`flange`: studs), so the back of a sideways
  plate rests on the flange and never shows its underside.
- Half a stud: a `jumper` (a 1 x 2 plate with one centre stud) lets a sub-assembly sit half a
  stud over (a pose that moves it 0.5). Use it where whole studs leave a visible gap, such as
  wing elements that must reach the endplates between two brackets.
- A flap is a row of one-finger hinges a stud in chord, tiled; the stud between it and what it
  hangs from is its slot. A cascade lays a two-finger row on each element in place of its tiles
  and hangs the next from it: each element is a stud behind and a plate above the one before,
  so plan the wing's length for it.
- Sub-assemblies may not overlap each other or the model: each cell is a box turned with its
  sub-assembly, tested by separating axes, faces that touch allowed; hinge partners are let off
  at the knuckle; a bracket's flange counts as the half plate it is, a knuckle as the square
  inside its round finger. (Check:
  `clipping`, `kit/legoclash.ts`.) Do not tile over a hinge's studs where
  the flap swings past them: the check will say so.

## Shapes

- Draw the plan with the angles the catalogue has: 45° and 33° slopes, the inverted 45° for
  undersides, the 1 × 1 slope (`cheese`, also a rounded edge along a top), the 2-, 3- and 4-long
  curves, tapered plates (`wedge`, 2 x 4 and 2 x 2), quarter and round tiles, rounds, domes,
  cones, bars, wheels. A ramp is one piece deep; a longer fall is several ramps stepped down.
- Detail is shape, not count: rounded edges (a row of `cheese` along a top edge), undercuts
  (`inv45`), tapers in plan (`wedge`), smooth tops where a builder would tile, small parts that
  name the object (fins, winglets, a T-camera). More pieces follow from that.
- A block is laid in a bond: courses alternate direction and a course is re-laid until its seams
  are bridged by the next. A single course of plates holds together only where something above
  bridges it, so a wing is two plates thick or hangs from one piece. (Check: `floating`.)
- A part that reaches out from what holds it (a wishbone, a beam wing) is one piece laid toward
  its holder (`lay: 'z'`), or two courses, so it is held; a single course of small plates is not.
- Smooth tops are a tile course (`top: 'tiles'`), vents a grille course; studs stay where
  something will attach or where the studded look is wanted.
- Structure as a builder would: a root (a floor plate, a baseplate); axles through technic bricks
  on stacks from the root; parts that hang (wings, endplates) hang from pillars or pylons.
- The base is LEGO too, and smooth where wheels or feet stand on it, so nothing rests on studs.

## Animation

- The standard animation: the base is there from the first frame and never moves; each piece
  drops onto the studs below it in its turn, course by course from the bottom, rolling parts
  last; the finished model holds; then pieces lift off, last on first off, and the base stays.
- A figure that turns its model frames the circle the base sweeps, so nothing leaves the frame.
- Reduced motion rests on the finished model. The rest time is reached in steps, so compare it
  with a tolerance (`Math.abs(f.t - REST) < 1e-3`), never `===`.

## Catch yourself

| The tempting move | Do instead | Rule |
| --- | --- | --- |
| "The curve looks fine, I'll draw it as a smooth surface." | Use the curve piece, or add one to the catalogue. | Pieces |
| "This plate floats; I'll mark it as a root." | Bridge it with a course above, or hang it from a piece that connects. | `floating` |
| "Two pieces overlap a little; nobody will see it." | Move one; the 360° sheet shows it from somewhere. | `clipping` |
| "The check is too strict for this model." | Fix the design. Change a check only with a selftest fixture. | Checks |
| "I'll skip the wire and solid sheets and go straight to LEGO." | Plan first: proportions are cheap in shapes, dear in pieces. | Workflow |
| "The base is just a stand; a box is fine." | Build it from plates and tiles. | Pieces |
| "No piece has this shape; I'll add a kind that looks right." | Find the real part, add it in frontend-kit's `bricks` and match it in its reference compare, or build the shape from real parts. | Pieces |
| "It's a one-line fix; I'll edit `kit/legoset.ts` here." | That file is a synced copy: change `bricks/src` in frontend-kit, check it there, then `lego:sync`. | Pieces |
| "I'll stack plates on edge for the endplate." | A bracket and a plate on its side: thinner and smooth. | Sub-assemblies |
| "I'll work out this pose by hand." | `onSide` / `onHinge` from the holding piece; the joint checks then agree with the drawing. | Sub-assemblies |
| "More pieces will make it more detailed." | Detail comes from the joints and shapes; the count follows. | Shapes |
