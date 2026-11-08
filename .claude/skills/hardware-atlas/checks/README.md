# Built checks

Run in `astro/`. Builder code and judges have separate homes. Ordinary model
authoring cannot edit either the judges or their inputs to clear a failure.

| Rule / property | Owner and command | Evidence / limit |
|---|---|---|
| Geometry, framing, SVG/canvas equality, seeds, isolation, symbol IDs | `scripts/hardware/check.mjs`, `npm run hardware:check` | All kinds, supported densities, both modes, preset views, sampled openings and viewport sizes. |
| HA-PART | `contracts.mjs::checkSignals` | Every selected projected front-facing outlined solid has an accent; no unrelated part has one. Visibility through other solids is judged visually. |
| HA-ROUTE | `contracts.mjs::checkRouting` plus endpoint tests in `check.mjs` | Named source/sink footprints, planar Manhattan nonzero segments, sampled support containment, no shared collinear lanes or perpendicular crossings. Applied to declared board/interposer traces. |
| HA-HOST | `contracts.mjs::checkSupportedMarkings`, `check.mjs` | Every declared supported segment lies on one actual host face, including chamfers, across all laminate models/densities. Seed 1, historical square-corner failure, transformed profiles, absent profiles, server bounds, annulus seams and hidden-stroke fixtures. This is not a universal decorative-stroke attachment solver. |
| HA-DEPTH / HA-FRAME | `check.mjs`, `transitions.mjs` | Outward extrusion winding, ordering dependencies and actual mounted camera/isolation transitions. Visual review still required. |
| Guard sensitivity | `check.mjs` | Injected duplicate lane, escaped support and missing repeated accent must fail. Production models remain immutable. |
| HA-WORK | `gallery-profile.mjs --check`, called by `hardware:browser` | Normal-motion production gallery: eight still thumbnails, zero idle frame growth, seed selection, responsive main, no console error or viewport overflow. |
| Page and exports | `browser-check.mjs`, `npm run hardware:browser` | Workbench controls, URLs, SVG/XML, clipboard, sprite, reduced motion, mobile and no-JS collection. |
| Figure rules | `figures/check.mjs` and `figures/look.mjs` | Existing palette/signal/frame-time/source/seed audits; thresholds are unchanged. |
| Playbook contract | `playbook-check.mjs`, called by `hardware:check` | Required package files and public kernel/check source paths exist. |

## Complete run

`npm run hardware:verify` runs repository checks, hardware checks, production build,
exports and browser tests in that order. It stops at the first failed child exit.
Screenshots, profiles and SVGs go to ignored `hardware-out/`; figure audit artifacts
also live in `figures-out/`. Open the images after the commands pass.

To compare a known before build with the candidate, run the same command against
each preview: `node scripts/hardware/gallery-profile.mjs --url=http://127.0.0.1:4387
--name=gallery-before` and the candidate with `--name=gallery-after --check`.
Use the same host, browser, viewport and seed. Timing is evidence, not a universal
FPS guarantee. `node scripts/hardware/capture.mjs --url=... --name=after` renders
the exported object sheets and targeted workbench views.

## Check configuration

After committing the source, `npm run hardware:archive -- /absolute/archive/path`
preserves the scoped source in `source.json`, readable playbook `.txt` files and
`manifest.json`. Each entry carries SHA-256 and byte length; the source records the
commit and a combined fingerprint. The archive refuses uncommitted source and
different existing bytes. A new revision uses a new folder; no owner edits are
overwritten. Restore onto a checkout at the recorded commit, then run the normal
verification gate. The snapshot is a recovery record, not a second app.

`scripts/hardware/rules.json` is the owner of these settings; code reads the keys.

| Key | Default | Effect |
|---|---|---|
| `routing.epsilon` | `1e-8` | Model-coordinate tolerance for planar, collinear and boundary comparisons. |
| `routing.surfaceTolerance` | `0.006` | Permitted Y offset from a supporting horizontal face. Matches the scene's small marking offsets. |
| `routing.samplesPerSegment` | `20` | Support-containment subdivisions. This is sampling, not an exact polygon-coverage proof. Must be at least two. |
| `gallery.idleWindowMs` | `1200` | Idle measurement window; longer samples expose slower idle work. |
| `gallery.scrollFrames` | `90` | Number of animation-frame scroll samples. |
| `gallery.percentile` | `0.95` | Reported scroll interval percentile; it is descriptive, not a pass threshold. |

These sample sizes are trial diagnostic inputs, not an empirically calibrated
quality bar. Actual invariants are nonempty coverage and zero idle thumbnail work.
