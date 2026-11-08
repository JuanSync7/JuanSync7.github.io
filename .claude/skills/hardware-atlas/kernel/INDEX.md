# Built kernel API

Read this index for ordinary model work; do not edit the implementation underneath
it. Sources live in `astro/src/figures/kit/hardware/`. The vault stores a pinned
snapshot, not another editable implementation.

| Call / type | Contract and gotcha |
|---|---|
| `Draft.part(name, note, explode?, hiddenWhenClosed?)` | Starts a semantic assembly; all subsequent geometry belongs to it. Explosion is a vector in model coordinates. |
| `Draft.box`, `extrude`, `cylinder`, `tube` | Start physical solids with stable IDs. Y is height; X/Z are footprint axes. Extrusion normalizes winding. Tube rim tessellation is filled but not stroked. |
| `Draft.line(points, closed?, support?)`, `ring` | Physical details, never a substitute for a routed electrical connection. An explicit support solid ID binds and checks a surface marking; those marks are never inferred onto another solid. Unbound strokes use containing-solid inference. |
| `Draft.profile()` | Returns the current extrusion's actual cap faces and solid ID. Cap references follow completed transforms. Fails without a current extrusion; use it rather than reconstructing an outline from bounds. |
| `Draft.surface(points, face?, outline?)` | Appends a custom polygon to the current solid. Set `outline=false` on construction facets; add the real boundary separately. |
| `Draft.tiles`, `pins`, `ribs` | Repeated contacts and physical rib details; caller owns pitch, dimensions and support. Do not use ribs as an electrical route. |
| `Draft.trace(points, from, to)` | A planar board/interposer route with named source and sink parts. It moves with its owning support, not with exploded endpoints. |
| `Draft.transform(draw, at, pitch?, yaw?)` | Transforms new geometry only. Include markings in the same coordinate transform as their host. |
| `Draft.detail(draw)` | Marks engineering-only geometry; icon detail omits it. Restore the previous detail context afterwards. |
| `rect`, `screw`, `capacitor`, `packageChip`, `laminate`, `matrix`, `logic`, `port`, `frame` | Shared manufacturing features in `details.ts`. `laminate(p)` interpolates the current emitted profile; it takes no duplicate dimensions/offsets and preserves chamfers. `port` constructs recessed walls and contacts. |
| `fan`, `impeller`, `finBank`, `electrolytic`, `grille` | Mechanical features in `mechanical.ts`; transform the entire feature for another orientation. |
| `hardwareModel(kind, density?)` | Cached immutable model, density clamped to its supported range. Do not mutate returned parts. |
| `hardwareScene(model, options, camera)` | Prepared solid bounds, host attachment, explosion, projection and dependency ordering. Preserves part and solid IDs. Bounded local-pose caches reuse clipping through hover and explosion translations. |
| `orderSolids(solids)` | Orders lower overlapping solids before raised solids; depth breaks ties. General intersecting meshes are outside this simplified renderer's guarantees. |
| `visibleStrokes(surfaces)` | Accepts one solid's surfaces. Splits markings at projected face/depth-plane boundaries, hides rear intervals and merges redundant collinear cuts. Wireframe bypasses it. |
| `hardwareCamera(view)` | Shared orthographic presets; no elapsed-time camera rotation. |
| `hardwareDrawing(model, options, w, h, camera?, vector?, framing?)` | Fits all projected points unless explicit framing is supplied. Bounded per-model cache. `vector=false` skips SVG path-string formatting. Accents are per selected solid, in painter order. |
| `nearestPart(drawing, point)` | Frontmost face, then nearest part centre. Pass an unlifted drawing at the painted framing. Returns the semantic part index. |
| `paintHardware(ctx, drawing)` | Paints the same points that SVG serializes, retaining face occlusion and tokens. |
| `hardwareSvg(model, options)`, `hardwareSprite(options)` | Portable SVGs; sprite IDs are stable and assembled. No separate export geometry. |

Laminate hatching chooses the edge with greatest world Z at call time. Calling it
before versus after rotating a host can choose a different physical side; both
must remain contained. Current laminate models use untranslated or translated
boards. Camera-pose cache entries project at the same canonical precision as
their key, so cache warm-up order cannot change seam geometry.

The template `astro/src/figures/templates/hardware-atlas.ts` eases camera/opening/
lift through the shared figure clock. Still captures skip unseen simulation steps:
this template has no time-driven state that needs warming. The seed strip freezes
at the clock's `REST_T`; other templates retain their existing behavior.
