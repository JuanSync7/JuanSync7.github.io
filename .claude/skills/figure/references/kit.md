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

## The clock (`src/hooks/useFigureLoop.ts`) guarantees

- `t` is the figure's own time and stops while it is offscreen; `dt` is capped at 50 ms.
- `hover` eases 0 → 1 while the pointer is over the canvas; `pointer` is 0..1 across it.
- `pulses` lists clicks with their age in seconds, for two seconds.
- Under reduced motion, or a frozen capture, the figure is simulated from 0 to rest (1.2 s,
  or the frozen time) in 1/60 s steps and shown once, with `still: true`.
- Device pixel ratio is capped at 2. The canvas carries `data-ready`, `data-frames`,
  `data-ms-avg`, `data-ms-max`, `data-readout`, `data-error` for the audit.

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

## `kit/draw.ts`: strokes and faces
`line(ctx, a, b, style)`, `poly(ctx, pts, close)`, `dot(ctx, x, y, r, style)`,
`strokeMesh(ctx, mesh, cam, { alpha, hot, radius?, lift? })`,
`shadeMesh(ctx, mesh, cam, light, hotTri?)`.

## `kit/brush.ts`: ink
`brush(ctx, pts, { width, noise, wobble?, profile?, seed? })` fills a tapered stroke with the
current `fillStyle`; `ridge(noise, x0, x1, base, height, seed, step?)` → outline points;
`texture(ctx, top, depth, noise, every?)` strokes dry-brush marks under a ridge.

## `kit/pixel.ts`: cells
`pixelGrid(w, h, cols, rows)`, `cell(ctx, grid, x, y, style, gap?)`,
`dither(ctx, grid, x, y, value, style, gap?)`, `bayer(x, y)`.

## `kit/motion.ts`: the two clocks
`easeOut(t)` (the 700 ms ease, `EASE_MS`), `smoothstep(a, b, x)`, `clamp`, `spring(x)` +
`stepSpring(s, dt)` (k 100, c 18), `follow(x, target, dt, rate)`.
