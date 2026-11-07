# Zoom-dive review — 7 November 2026

Review of the seeded geometry at `/lab/zoom-dive/`, against the live site's original
drawings and the references recorded in the three domain reference notes.

Source fingerprint:
`55f7ec8d3abffe7d2eddac61cfaed99e39b5ac30ce2fae2aab472624769ba82d`.
Generated reports and images are under the ignored `astro/figures-out/deepdive/`
directory. The fingerprint identifies the implementation and checks, not this
historical review record. Re-run the workflow when that fingerprint changes.

## Findings that changed the implementation

| Observed defect | Correction retained in the generator | Independent regression check |
| --- | --- | --- |
| Wires stopped near parts or crossed component bodies. | Named edge pins, reserved escape tracks, obstacle-aware routes and explicit junctions. | Emitted route coverage, terminal contact and unrelated-conductor checks. |
| Package bonds behaved like planar metal or stopped at the zoom frame. | A distinct bond material; ordered straight spans registered to the actual child die pads. | Child-pad identity/projection, full landing-ring coverage and inside-frame continuity. |
| Gate straps and contact squares could short despite plausible labels. | Separate internal tracks and explicit layer contacts. | Reconstructed electrical nets, full contact footprints and exhaustive gate truth tables. |
| Analog and early NMOS terminals reused a modern digital recipe. | Separate matched-MOS ABBA arrays and depletion-load NMOS gates. | Era/recipe checks and independent electrode/supply connectivity. |
| Small contours branched or hung; town roofs and station access crossed infrastructure. | Canonical shared terrain edges, explicit town footprints and a platform facing its approach. | Contour topology, elevation residuals, roof/road and access/track intersections. |
| Rooms had ambiguous wall cuts, inconsistent scale or empty oversized wings. | Real jambs and openings, physical furniture/core dimensions, repeatable meeting islands. | Wall/door linework, clear circulation, programme and physical-scale checks. |
| Parent streets and corridors did not clearly reach nested entrances. | Explicit approaches projected between actual parent/child openings; matching frame notches. | Opening coverage, emitted curb continuity and exclusion from child interiors. |
| A terminal cell or room appeared to contain another rack or region. | Retain its own physical detail, then dissolve into a fresh journey. | Camera position/velocity, clipping, terminal detail and restart-phase browser probes. |
| Passing old screenshots could be mistaken for current evidence. | Source fingerprints, image hashes and strict replay namespaces. | Deliberately stale, altered, missing and invalid-input workflow fixtures. |

The domain reference notes preserve additional observations and the exact drawing
conventions used. The maintained agent, rules and playbooks describe how to repeat
this research → layout → independent check → close visual inspection → regression
loop without treating a screenshot or a metadata label as connectivity proof.

## Mechanical acceptance

- `npm run check` and `npm run build` passed on the final merged source.
- `npm run figures:audit -- --url=http://127.0.0.1:4421` passed all 46 figures
  against the production build. Advisory border/slowest-frame flags were retained;
  the zoom-dive sheet was inspected, including its intentional offscreen parent
  context. The dedicated browser report records full-cycle drawing performance.
- `npm run deepdive:agent -- review` passed: 2,882 plans, 120 gallery captures,
  eight public seeds covering both chains and all four chip eras, 336 phase
  frames, 64 handoffs and 13,075 measured performance frames.
- The selftest rejected 153 deliberately broken domain fixtures and 50 additional
  geometry/boundary fixtures; 935 camera checks and 2,000 clipping probes passed.
  Gate verification covered 6,976 exhaustive truth-table states.
- A separate twelve-public-seed contact sheet was captured from the production
  build, alongside desktop, phone, reduced-motion and actual-control evidence.
- The final frozen-source stress run, `npm run deepdive:check -- --seeds=1024`,
  passed 30,722 plans and 68,878,225 emitted segments across all thirty families.
  Its independent domain checks covered 24,576 chip layouts, 3,072 architectural
  layouts, 3,072 terrain/city plans and 4,096 parent/child pairs with 6,144
  entrance approaches. This larger result replaces the default `check.json`;
  both runs used the same source fingerprint.
- Existing shared-helper regressions also passed through `npm run tabletop:check`:
  support/depth fixtures and 1,391 tabletop layouts with 36,845 objects.
- The shared CI workflow passed the repository's maintainer ownership gate with
  a separate review bound to the exact base revision and changed workflow bytes.

Commands and seed namespaces are documented in [the workflow guide](deepdive.md).
JSON reports carry their exact arguments, counts, source identity and outcomes.

## Visual acceptance

The same public input images were compared before and after. A separate reviewer,
given blinded city and chip comparisons, preferred the revised drawings. That
review exposed the ambiguous nested entrance, which was repaired and reviewed
again rather than accepted on the strength of a mechanical pass.

The final inspection covered all chip eras at package/die/core/cell scales, terrain
and city plans, block/building/floor views, the twelve-seed sheet, phone frames and
transition pairs. Specifically inspected final files include:

- `silicon-bipolar-42-package.png`: eight visible bonds land on eight distinct
  actual child pads, including their geometry inside the selected aperture.
- `silicon-modern-42-die.png`: repeated banks, pad rows, junctions and routed
  channels retain consistent organisation.
- `city-modern-42-{block,building,floor}.png`: paths reach actual entrances;
  doors, furniture and stair geometry leave the intended circulation clear.
- `public-2-handoff-5-{before,after}.png`: the same layout and entrance connections
  persist across the handoff without a visible jump.
- `../zoom-dive.seeds.png`: useful structural variety remains across twelve
  public seeds, rather than independent displacement of repeated parts.

Independent final visual verdict: **no remaining major coherence faults observed
in these cases**. Finite seeded checks and visual samples do not prove every
possible random scene perfect. The drawings remain explanatory illustrations;
the reference notes distinguish checked local connectivity from foundry,
construction or surveying verification.
