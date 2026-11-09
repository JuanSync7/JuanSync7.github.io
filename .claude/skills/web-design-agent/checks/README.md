# Lighting and variation checks

Run from `astro/`. Use a production preview at the supplied URL; do not share Vite
cache writers while rebuilding. `rooms:verify` remains the complete ordered gate.

| Contract | Command / evidence |
| --- | --- |
| Seed replay, four palettes/theme, three table designs, geometry cache independence | `npm run rooms:lighting` |
| Light roles, one shadow caster, haze/halo budget, mirrored source, mode restoration and texture disposal | Same command; six mutated emitted-state failures must be rejected |
| 243 layout/construction/furniture combinations; non-overlap, table anchor and camera projection | `npm run tabletop:check` |
| 243 functional programs, human scale, grounded furniture and connected walking routes | `npm run rooms:program` |
| 243 support cases plus buried/floating/detached failures | `npm run rooms:supports` |
| Same-theme seeded palette/layout/design renders, tonal span, reversible modes and stillness | `npm run rooms:variation -- --url=http://127.0.0.1:4474`; read the generated sheets |
| Nine themes, both renderers, colour/mono, previews, mobile, eye endpoints and floor/ceiling regions | `npm run rooms:colour -- --url=http://127.0.0.1:4474` |
| Complete source, build, geometry, camera, performance and whole-site figure gate | `npm run rooms:verify -- --url=http://127.0.0.1:4474` |

Reports start with `passed:false` and become green only after completion. Missing
browser/server or an assertion failure must leave a failing report. Public CI runs
the focused lighting check through `tabletop:check`; browser variation is included
in the appearance run. Do not call a sheet inspected until it has actually been read.

A proper eye interior can fill its frame; its scoped occupancy guard differs from
the overview's global 50% coverage ceiling. Contrast, palette and highlight checks
still apply. Never change global thresholds to make a room pass.
