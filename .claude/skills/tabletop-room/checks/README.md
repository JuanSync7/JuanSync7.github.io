# Independent checks

Run from `astro/`. The complete ordered command is `npm run rooms:verify -- --url=…`.
The source, geometry and room-program checks are independent of the geometry builders.
Never change the site's global thresholds to accommodate this room.

| Command / file | Evidence |
| --- | --- |
| `npm run check` | Types, lint, file/figure rules, formatting and existing site checks |
| `npm run tabletop:check` | Many seeded layouts; measured prop/room bounds; contacts; separate textile clearance; measured door approach; native/fallback projection agreement and true isometric axes |
| `npm run rooms:camera` | 27 themed ceilings, 8,991 eye poses, mirrored endpoint projections, level sightline, bounded constant lens, primary activity framing, native/fallback roof visibility, physical source positions, continuous tessellated grout, six broken mutations and nine captured old-camera failures; runs in `tabletop:check` and CI |
| `npm run rooms:supports` | Actual book/box base support, wall attachment paths and six rejected floating/buried/detached output mutations; also runs in `tabletop:check` and CI |
| `npm run rooms:depth` | Pixel-centre visibility against independent native triangle rays in nine themes, three variants, two projections and three angles; the legacy painter remains a rejected fixture |
| `npm run rooms:program` | Actual primary floor share, human furniture/device scale, mandatory theme furnishings, grounded supports and connected walking routes |
| `room-program-limits.json` | Scoped design criteria, separate from global figure thresholds |
| `room-program-check.mjs --baseline` | Intentionally fails the captured pre-redesign proportions; not part of the passing production sequence |
| `room-proportion-before.json` | Actual measurements from source revision `5baabe9`; the negative regression case |
| `npm run rooms:materials` | Material recipes, mirrored tokens, exact mode restoration and local shader composition |
| `npm run tabletop:browser -- --url=…` | Native/fallback camera sweep, mouse, keyboard, touch, zoom, seed and phone checks |
| `npm run rooms:colour -- --url=…` | Nine themes, native/fallback, 0°/90°/180° eye ceilings and isometric, opaque floor/ceiling-hole regressions with mutated real-image fixtures, reversible appearance, stable detail, contrast and highlights |
| `room-colour-performance.mjs --url=…` | Existing Three.js frame budget, retained idle image and redraws after input |
| `npm run figure -- pixel-still --url=…` | Three full audit seeds; read the output sheet |
| `npm run figure:seeds -- pixel-still 12 --url=…` | Wider seeded composition sheet |
| `npm run rooms:gallery` | Compact actual-render colour and monochrome galleries |
| `npm run figures:audit -- --no-sheet --url=…` | Whole-site regression audit |
| `npm run figures:selftest -- --url=…` | Proves the existing audit still catches its deliberately broken fixtures |

Generated reports begin with a failing/incomplete state and are marked passed only
at the end. Read the real exit code and report. A previous passing report is not
proof that the current run completed. Visual craft still requires `../LOOK.md`.
