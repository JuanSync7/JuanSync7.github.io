# The kit

Everything a figure may import. Read this index, not the code under it.

## Defining a figure (`src/figures/define.ts`, `defineThree.ts`)

```ts
export default defineCanvasFigure<State>({
  id, title, alt, idea,          // id = file name; alt for screen readers; idea = object · motion · meaning
  style, motion, answers, group, // see types.ts: FIGURE_STYLES, FIGURE_MOTIONS, FIGURE_GROUPS
  seed, aspect, bleed?,          // integer seed; width/height of the box it is designed for
  setup: ({ w, h, rng }) => State,       // once per size: build geometry, seed marks
  draw: (frame) => string | void,        // every frame; return the read-out ('rest' at rest)
});
```

`frame` holds `ctx, w, h, state, rng, t, dt, hover, pointer {x, y, active}, pulses [{x, y,
age}], still`. The canvas is cleared and the transform set before `draw`; `lineWidth` is 1.

`defineThreeFigure({ ...meta without style, build: ({ scene, camera, rng }) => State,
update: (frame) => string | void, fallback: (canvasFrame) => string | void })`.

`defineTemplate<P, S>({ id, title, idea, style, motion, answers, aspect, bleed?,
grammar: (rng) => P, name: (p) => string, alt: (p) => string, setup: ({ w, h, rng, params })
=> S, draw: (frame & { params }) => string | void })` in `src/figures/templates/`; the
grammar's rng is salted so its choices never mirror the drawing's.

A page can hand a figure data: `<FigureCanvas id data={…} onReadout={…} />` puts it on
`frame.data` (typed `unknown`: narrow it with a guard, and draw a sample of your own when
it is absent, as `lesson-field.ts` does). `onReadout` gets the read-out, so a page can act
on what is under the pointer.

## The clock (`src/hooks/useFigureLoop.ts`) guarantees

- `t` is the figure's own time and stops while it is offscreen; `dt` is capped at 50 ms.
- `hover` eases 0 → 1 while the pointer is over the canvas; `pointer` is 0..1 across it.
  Under `still`, `hover` is 0 or 1 and pointer moves redraw with `dt = 0`: snap to targets
  (`still ? target : follow(...)`) or the figure will not answer.
- `pulses` lists clicks with their age in seconds, for two seconds (none under reduced
  motion).
- Under reduced motion, or a frozen capture, the figure is simulated from 0 to rest (1.2 s,
  or the frozen time) in 1/60 s steps and shown once, with `still: true`. Each simulation
  starts from fresh state (the figure is resized, so `setup` runs again), so a figure may
  accumulate in `state` (a scroll, a drift) and its still still repeats exactly.
- Device pixel ratio is capped at 2. The canvas carries `data-ready`, `data-frames`,
  `data-ms-avg`, `data-ms-max`, `data-readout`, `data-error` for the audit; a three.js
  figure also carries `data-renderer` (`webgl` or `2d-fallback`).

## `kit/ink.ts`: colour
`ink.ground(a)`, `ink.panel(a)`, `ink.line(a)`, `ink.signal(a)`, `ink.soft(a)`, `ink.faint(a)`,
`ink.face(a)`; `tone(key, a)` for any night token; `mix(keyA, keyB, t, a)` to blend two
tokens (flat shading); `hexOf(key)` for three.js; `rgb(key)` as numbers.

## `kit/rng.ts`, `kit/noise.ts`: randomness
`mulberry32(seed)`, `hashSeed(text)`, `between(rng, lo, hi)`, `pick(rng, list)`.
`noise2(rng)` returns a smooth `(x, y) => -1..1`; `fbm(noise, x, y, octaves)`.

## `kit/camera.ts`: 3D on a 2D canvas
`camera({ cx, cy, scale, yaw?, pitch?, dist? })` (pitch > 0 looks down; `dist: Infinity` is
parallel); `isometric(cx, cy, scale)`; `project(cam, x, y, z)` → `[sx, sy, depth]` (larger depth
is nearer); `nearness(depth, radius)` → 0 far .. 1 near.

## `kit/models.ts`: meshes
`icosphere(level, r)` (20·4^level triangles), `torus(nu, nv, ring, tube)`, `lattice(n, half)`,
`grid(n, half)`; each `{ v, e, f }`.

## `kit/shapes.ts`: wire shapes
Solids as lists of 3D segments (`Seg = [Vec3, Vec3]`): `path(pts, closed?)`,
`circle(c, r, axis?, n?, a0?, a1?)`, `box(x0, y0, z0, x1, y1, z1)`,
`cylinder(c, r, h, n?, rungs?, r2?)` (r2 makes a cone or frustum), `extrude(outline, z0, z1)`,
`globe(c, r, lat?, lon?)`; `place(segs, { yaw, pitch, roll, scale, at })` turns and moves them;
`strokeWire(ctx, segs, cam, { alpha, radius?, signal? })` strokes with depth fade.
`along(pts, u)` is the point a fraction `u` along a polyline; `tracePath(ctx, cam, pts)`
begins a projected path for you to stroke.

## `kit/assemblies.ts`: machines as parts
`ASSEMBLIES.rocket | keySwitch | lens | chip` → `(rng) => Part[]`, each part
`{ name, segs, dir, gap }`: built in place along y, with the direction and distance it moves
when exploded. Add a machine here, not in a template.

## Parts that templates and scenes share
Moved out of a figure when it outgrew its length budget; add to these, not to the figure.
- `kit/city.ts`: `district(k, rng)` → `{ parts, traces }` for each stack level (silicon cells
  to overcity apartments and parks); `Part { kind, x, z, w, d, h }`, `STREETS`, `isBox`, `isRound`.
- `kit/citylife.ts`: `windows(parts, rng, max?)` → `Lights`, `bridges(parts, rng, max?)`,
  `power(parts, n?)`, `roof(parts, rng)`: what makes a district look lived in.
- `kit/outlines.ts`: `outlines(parts)` → the wire edges of a district's parts (boxes, round
  parts, wire trees and pines).
- `kit/patterns.ts`: `MOTIFS`, `motif(m, pen, seed, noise)` (the pattern-cards drawings).
- `kit/voxels.ts`: `KINDS`, `buildVoxels(spec, rng)` → `VoxelModel` (the voxel-scene objects).
- `kit/wireobjects.ts` + `kit/machines.ts`: `KINDS`, `FRAME`, `build(spec, t)` → `{ body, hot }`
  (the wire-object kinds; `machines.ts` holds the rocket, turbine and satellite).
- `kit/plans.ts`: `FORMS`, `layout(spec, rng)` → towers (the city-form plans).
- `kit/flows.ts`: `SHAPES`, `GLYPHS`, `layout`, `route`, `trace` (the workflow stations and paths).

## `kit/draw.ts`: strokes and faces
`line(ctx, a, b, style)`, `poly(ctx, pts, close)`, `dot(ctx, x, y, r, style)`,
`strokeMesh(ctx, mesh, cam, { alpha, hot, radius?, lift? })`,
`shadeMesh(ctx, mesh, cam, light, hotTri?)`,
`box(ctx, cam, x0, z0, x1, z1, y0, y1, { top, left, right, edge, crease })` for a hairline
slab: three filled faces, the silhouette in `edge`, the front crease in `crease`.

## `kit/brush.ts`: ink
`brush(ctx, pts, { width, noise, wobble?, profile?, seed? })` fills a tapered stroke with the
current `fillStyle`; `ridge(noise, x0, x1, base, height, seed, step?, peak?)` → outline points (`peak` 0 is a
rounded hill, 1 a pointed summit);
`texture(ctx, top, depth, noise, every?)` strokes dry-brush marks under a ridge.

## `kit/pixel.ts`: cells
`pixelGrid(w, h, cols, rows)`, `cell(ctx, grid, x, y, style, gap?)`,
`dither(ctx, grid, x, y, value, style, gap?)`, `bayer(x, y)`.

## `kit/motion.ts`: the two clocks
`easeOut(t)` (the 700 ms ease, `EASE_MS`), `smoothstep(a, b, x)`, `clamp`, `spring(x)` +
`stepSpring(s, dt)` (k 100, c 18), `follow(x, target, dt, rate)`.
