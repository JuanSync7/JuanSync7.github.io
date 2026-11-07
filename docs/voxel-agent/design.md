# Detail and exploration decisions — version 3

The reported problem was repeated composition and insufficient biome detail, followed
by a request for wider, coherent scenes and a reusable single-agent improvement loop.
The old sampled seed-42 worlds used radius 28 and 20–77 accepted land objects. The wider
prototype uses radius 44–60, ecological communities and accepted-parent places. Compare
actual report distributions and images; object count alone does not establish quality.

| Observed issue | Decision and evidence that can reject it |
|---|---|
| A larger catalog still looked scattered. | Seeded local communities, weighted abundance and bounded related groups. Inspect the biome/close-up sheets; audit actual realized variety and child accounting. |
| Tree envelopes excluded all understory. | Keep protected canopy spacing, but check low vegetation against actual 3D solid columns. A valid high-canopy fixture passes; touching solids fail. |
| Steep terrain shed most small dressing. | Only declared loose groundcover follows the actual surface, with grade four maximum and independently checked supporting roots. Rigid objects never gain flexible geometry. |
| Reeds could be horizontally close to water above a cliff. | Check both horizontal range and elevation against real open liquid water; ice is excluded. |
| Geological discoveries were repeated as often as grass. | Rare landmark weight is 0.06 versus floor dressing weight five; related discoveries may deliberately form a local group. Realized composition remains a visual judgment. |
| Increasing area raised mesh and water costs. | Exact greedy surface equivalence with contact AO, bounded solid volume, GPU surface waves and instanced particle families. Keep the official figure audit thresholds unchanged. |
| More area made details too small at default view. | Fit overview bounds, then focus actual accepted groups, zoom to 3.5× and pan with mouse/touch/keyboard. Verify production controls, fallback and projected place bounds. |
| Notes could drift from implementation. | One executable stage manifest, report traces, one voxel agent, eleven playbooks, independent checks and immutable full source/script snapshots in the vault. Owner-edited mirrors fail closed. |

Water close-ups also exposed a regular foam grid and shoreline classification using submerged pond beds. Foam now uses seeded irregular samples only on open water; submerged beds no longer damp the whole pond as if it were a bank. The GPU fixture checks real banks, submerged beds, fixed ice and cascade joins.

A realized-type audit distinguished 138 available models from 135 live catalog types. It found that frogs never appeared in the balanced cohort: treating every frog as strictly shore-bound excluded suitable rainforest habitat. Frogs now require high moisture plus shelter or nearby water; turtles remain shore-bound. Every live catalog type now has an actual accepted placement in the balanced cohort.

## Stress-found regression

The broader public-seed run caught public seed 949283578 / layout seed 28983808.
A natural standing-stone discovery added after an acacia could bypass focal clearance
because the original rule only handled a canopy arriving later. The original plan fixture (including its earlier building count), current natural replay
and both insertion orders are now permanent checks. The full pre-fix kernel was reconstructed from the three changed files, matched the original SHA-256 exactly, compiled and reproduced the original clearance failure. Preserve that historical kernel and the original failure report
and rerun the entire cohort after the fix; do not substitute a forced-biome plan, which
consumes a different plan stream.

A separate structural pass found isolated ceiling lips around skylights. Roof reachability now starts at actual rock contact after base shaping; disconnected fragments and their headroom entries are removed before meshing. An independent component walk verifies retained roof support and emitted geometry. The exact pre-fix kernel was also hash-matched, compiled and reproduced with VXL-ROOF for later feedback.

A final frozen-place close-up exposed a camera view blocked by a nearby ice peak: fitting destination bounds alone did not check intervening terrain. Focus now uses bounded solid lookup queries to lift above foreground while retaining yaw, and retreats the eye out of solids. The old center ray hits terrain 4.15 cells away. A center-only correction still left much of the place behind a peak, so the solver now scores nine rays over the subject region and refines the first clear angle; partial improvement is preferred when no full opening exists. A first fixed-step ray also missed a grazing corner; exact grid traversal replaced it. Two actual mesh-ray regressions (including the exact archived center-only pose), 1,512 focused eye checks over three zoom levels and focused-orbit profiles preserve this case. Cave walls can still hide a destination when the user rotates behind the cutaway.

## Scope and limits

Research studied pinned noa, Voxelize, FastNoiseLite and Luanti sources and four actual
Voxelize images. The implementation reuses the ideas, not their source code or assets.
There is no added voxel engine dependency: the existing Three.js renderer and seeded
noise helpers are sufficient for a finite diorama. Streaming chunks, editable worlds,
animated creatures and first-person navigation would be separate product work.

The island can be a sea composition; a mainland window has an irregular geological
cutaway instead. The closed bevel shortens outer walls while keeping real cliffs and
cave cuts legible. It cannot hide every side at every camera angle without inventing
terrain outside the generated world.

The larger scene costs more to generate once. Geometry and weather batching reduce
ongoing work; actual build timings, draw calls and unchanged figure frame audits are
recorded separately. The overview and close view serve different purposes: default
framing preserves the whole silhouette, deliberate zoom can crop the frame.

Static voxel wildlife and some small silhouettes remain deliberately simple at this
resolution. A forest may obscure parts of its floor from a low camera; focal clearings,
rotation and higher pitch provide other views. Valid objects may be omitted where
support, water, slope or clearance leave no acceptable site. That is recorded, never
repaired by a hidden default cottage or overlapping filler.

Mechanical geometry checks are independent algorithms. Visual assessment in this run
is the operating agent's inspection, not an independent human or second-agent approval.
The user's single-agent constraint is preserved; authored vault guidance remains unreviewed.
