# LEGO rules

Each rule says what it is held by. A rule held by a check is not a judgment call.

## Pieces

- Everything visible is a catalogue piece, the base included. No smooth slab, no box that is not
  a brick, no "close enough" shape. (Check: the figure draws only `legoModel` output.)
- Every piece sits on whole studs and whole plates; rolling parts (wheels, axles) are placed by
  their axis. (Check: `offGrid`.)
- No two pieces share a cell. Wheels take every cell their cylinder reaches; an axle's path is
  clear apart from its technic holes and hubs. (Check: `clipping`.)
- Every piece joins the root through studs or an axle. A stud joins only where a piece sits
  directly on a studded top; tiles, curves and domes have none. (Check: `floating`.)

## Shapes

- Draw the plan with the angles the catalogue has: straight 45° (`slope45`), the 1 × 1 slope
  (`cheese`), the 2-long and 4-long curves (`curve2`, `curve4`), tapered plates (`wedge`), rounds
  and domes, wheels. A ramp is one piece deep; a longer fall is several ramps stepped down.
- A block is laid in a bond: courses alternate direction and a course is re-laid until its seams
  are bridged by the next. A single course of plates holds together only where something above
  bridges it, so a wing is two plates thick or hangs from one piece. (Check: `floating`.)
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
