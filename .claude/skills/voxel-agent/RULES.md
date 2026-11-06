# Rules and proof

These are engine requirements. Numbers come from `policy.json`; the checks must fail
on a deliberately broken case. Taste questions live in `LOOK.md`, not in pass flags.

| Rule | When the engine shall reject a result | Check / case |
|---|---|---|
| VXL-SEED | When a seed is not an integer in the public range, or a plan has the wrong version. | `check.mjs`, invalid seed inputs; `selftest.mjs`. |
| VXL-STREAMS | When consuming an unrelated stage changes the terrain stream. | `check.mjs`, extra prop-stream calls. |
| VXL-DIVERSITY | When the atlas repeats fixed object counts, dimensions, house recipes or sites, or misses declared scene families. | `diversity.mjs`; fixed-house/two-boat and fixed-shape fixtures. |
| VXL-SEMANTICS | When a city has no buildings or a cavern lacks its roof/headroom. | `validate.mjs`; empty-city fixture and steep city seed 81195841. |
| VXL-GRID | When a solid voxel has noninteger coordinates. | `validate.mjs`; fractional-coordinate fixture. |
| VXL-COLLISION | When two emitted solid cells occupy one coordinate. | `validate.mjs`; duplicate-solid fixture. |
| VXL-ENVELOPE | When any realized voxel lies outside its declared footprint. | `validate.mjs`; undersized roof/sail envelope. |
| VXL-TERRAIN | When component geometry intersects the implicit solid terrain. | `validate.mjs`; buried component fixture. |
| VXL-SUPPORT | When a ground-contact cell lacks a foundation directly below it. | `validate.mjs`; lowered support fixture. |
| VXL-HEADROOM | When geometry reaches a cave roof or hanging formation. | `validate.mjs`; lowered cave clearance. |
| VXL-CLEARANCE | When full component envelopes do not retain the required gap. | `validate.mjs`; overlapping envelopes. |
| VXL-ECOLOGY | When a component's recipe differs from its local habitat. | `validate.mjs`; swapped biome fixture. |
| VXL-WATER | When a land component occupies a liquid column. | `validate.mjs`; flooded footprint fixture. |
| VXL-LIQUID | When liquid lacks support or has an inverted volume. | `validate.mjs`; invalid liquid column. |
| VXL-NAVIGATION | When a boat's hull, sail or motion envelope leaves equal-level navigable water, or reaches another boat. | `validate.mjs`, `motion.mjs`; displaced boat fixture. |
| VXL-ACCESS | When an entrance is unsupported, blocked or absent from the access map, or a path enters a footprint or liquid. | `validate.mjs`; deleted access network and the desert/tent regression. |
| VXL-ACCOUNTING | When planned, placed and omitted component counts disagree. | `validate.mjs`; forged placement count. |
| VXL-TERMINATION | When candidate search exceeds its retry budget. | `validate.mjs`; runaway-attempt fixture. |
| VXL-BUDGET | When emitted geometry or component count exceeds its cap. | `validate.mjs`; batch atlas and policy limits. |
| VXL-FRAME | When the default camera clips the world at a supported pose/aspect. | `motion.mjs`; projection of every bounds corner. |
| VXL-CAMERA | When invalid control input escapes pitch/zoom limits, or dragging fails to retain the new view. | `motion.mjs`, `browser.mjs`. |
| VXL-LIGHT | When changing sunlight has no measured lighting effect. | `motion.mjs`, `browser.mjs`. |
| VXL-MOTION | When time sampling changes static solids or fails to repeat at the same time. | `motion.mjs`. |
| VXL-WORKFLOW | When the single-agent entry, playbooks, prompt, scripts or rule references are missing. | `workflow.mjs`. |

## Catch yourself

| Temptation | Action |
|---|---|
| “Every seed needs a cottage so the scene looks finished.” | Let the planned count be zero; compare the composition atlas. |
| “It is random because the pixels changed.” | Inspect counts, positions, dimensions, recipes and terrain families in the report. |
| “Put the house down, then fit its roof.” | Realize the recipe, measure it, then find a valid site. |
| “A missing prop is harmless.” | Record its stable recipe id as omitted; do not conceal a retry failure. |
| “Move this one bad mushroom.” | Preserve the seed and fix the owning placement or shape rule. |
| “Lower the threshold until the screenshot passes.” | Keep the failure and repair the scene. A policy change needs its own justification. |
| “The checks passed, so it looks good.” | Read the atlas at desktop and phone size and answer `LOOK.md`. |
