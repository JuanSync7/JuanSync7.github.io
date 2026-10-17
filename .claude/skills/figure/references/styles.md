# The styles

Ten techniques. Each figure declares one as `style`. A page varies them (rule 03). For
each: when it suits a subject, the recipe in kit calls, the parameters that give it its
character, what gets it rejected, and the figures that already use it (read one before
writing another).

All share the palette (ground, greys, one teal), 1px weight and the clock.

## wireframe
**Suits:** an abstract structure that has a shape: a lattice, a mesh, a network of parts.
**Recipe:** a `Mesh` from `kit/models` (`icosphere`, `torus`, `lattice`, `grid`), a
`camera()` that turns slowly with `t`, and `strokeMesh(ctx, mesh, cam, { alpha, hot })`.
Build a low and a high resolution in `setup` and cross-fade on `hover`: the shape resolves
when the pointer comes.
**Character:** depth fade (near edges up to ~0.7 opacity, far ~0.08); signal only on the
near side when hot.
**Rejected when:** every edge equally bright; so dense it reads as grey fog at 358 px.

## lowpoly
**Suits:** surfaces and solids where facing matters: terrain, a skyline, a die under glass,
a faceted object that morphs.
**Recipe:** triangles from a jittered grid or `icosphere(1..2)`; `shadeMesh(ctx, mesh, cam,
light, hotTri)` paints them back to front, shaded by facing between ground and a grey; one
triangle (or a patch) in the signal. 2D meshes (`lattice-field`) fill each triangle with a
faint grey and light the ones near the pointer.
**Character:** flat faces, no gradients; 40–400 visible triangles.
**Rejected when:** smooth shading; so many faces it stops reading as low-poly.

## pixel
**Suits:** digital fabric: FPGAs, memory, screens, terminals, sprites, anything made of cells;
also the playful subjects.
**Recipe:** `pixelGrid(w, h, cols, rows)` picks a whole-pixel cell size; paint with
`cell(...)`; make tones with `dither(...)` (4×4 Bayer), never with in-between colours.
**Character:** 24–64 columns; a 1px gap between cells when the grid itself is the subject.
**Rejected when:** anti-aliased curves; cells under 3 px; half-pixel offsets.

## perspective
**Suits:** depth or sequence: a tunnel, a pipeline into the distance, a receding plane, an
exploded view, a worm's- or bird's-eye camera.
**Recipe:** `camera({ cx, cy, scale, yaw, pitch, dist })` and `project(...)`; draw rails to a
vanishing point first, then the planes, near ones brighter. An exploded view lifts layers
along one axis with `easeOut(hover)`.
**Character:** a clear vanishing point or axis; the camera itself carries the meaning.
**Rejected when:** perspective as decoration, with nothing travelling along the depth.

## hairline
**Suits:** a physical object: a package, an instrument, a fixture. The style of hairline.
**Recipe:** `isometric(cx, cy, scale)`; each solid is filled with a face tone first, then its
silhouette in grey and one dim crease inside it. Never draw vertical corners. The signal
goes on the one part that matters.
**Character:** 2:1 isometric; rounded or chamfered corners; parts sit on parts.
**Rejected when:** twelve-edge boxes; every inner line as bright as the outline.

## ink
**Suits:** organic or calm subjects: a landscape, a process that grows, a human moment.
After shan-shui-inf.
**Recipe:** `noise2(rng)` once in `setup`; `ridge(...)` for mountain outlines; `brush(ctx,
pts, { width, noise })` fills a tapered stroke; `texture(...)` adds short dry-brush marks.
Mist is fewer, fainter strokes toward the back, never a gradient.
**Character:** widths that swell and taper; a few strong strokes, many faint ones.
**Rejected when:** uniform-width lines (that is a vector, not a brush); gradient fog.

## field
**Suits:** distributions and flows: attention, data moving, a population of things.
**Recipe:** many identical marks driven by a function or by `noise(x, t)`: ridge lines,
flow-field streamlines, point clouds. Seed the marks in `setup`; move them in `draw`.
**Character:** one mark repeated; the pattern carries the meaning; one mark or one row lit.
**Rejected when:** marks re-randomised each frame (shimmer); more than ~2,000 marks.

## trace
**Suits:** time and connection: waveforms, metal routing, a pipeline diagram stepping, a
timeline.
**Recipe:** a grid in `setup` (the routes, the signal names); `draw` advances along time with
`t`. Every trace starts and ends on something: a pad, an edge, a via.
**Character:** orthogonal lines on a grid; a cursor or front in the signal.
**Rejected when:** a line that stops in mid-air; text labels (put names in the read-out).

## three
**Suits:** when real depth sorting, fog or an orbiting camera is the idea and faking it in 2D
would be wrong: stacked planes you can see between, a solid you can turn.
**Recipe:** `defineThreeFigure({ build, update, fallback })`. Build meshes once; `update` moves
the camera and parts from the frame. Colours from `hexOf(key)`; lines with
`LineBasicMaterial`; faces with `MeshBasicMaterial` (no lights, no shading models).
`fallback` draws the same picture on a 2D canvas for devices without WebGL.
**Character:** fog to ground for depth; thin `EdgesGeometry` lines; at most one per page.
**Rejected when:** no fallback; physically based materials, lights or bloom; over 14 ms a frame.

## Surfaces (not a figure style)
Glass (a frosted `backdrop-filter` chip) is allowed only for a read-out or control that floats
over a live figure, using the `--nt-scrim` tokens. Never on static cards, never as decoration.
