# Scope and ownership

The executable subject is `/lab/zoom-dive/`, backed by
`astro/src/figures/templates/zoom-dive.ts`. It has two cyclic scale chains:

- silicon: rack → board → package → die → core → cell;
- city: region → city → district → block → building → floor.

The silicon era remains consistent through a dive. Model generation is seeded and
separate from drawing. The selected window belongs to an intentional part of the
model; its position is chosen before surrounding geometry. The camera carries that
window into the next complete frame. Child linework stays within that opening.
The terminal room or device keeps its physical detail. A purposeful dissolve
begins a fresh journey; a region is not presented as a literal room interior.

These are explanatory plan drawings. Digital layout conventions, analog matching,
architectural circulation and mapped terrain make the drawings credible; they do
not establish manufacturability, electrical function, building-code compliance or
survey accuracy. Do not claim those from a visual or geometric check.

## Kernel and proof boundary

Read `kernel/INDEX.md` to find an owner. Domain model builders own valid layout;
renderers consume those entities. Independent scripts under
`astro/scripts/deepdive/` measure relationships and contain broken fixtures.
Do not generate proof by merely copying a model's declared `valid` flag.

The public seed chooses grammar parameters, including a plan salt and starting
level. A diagnostic must keep enough of those inputs to reproduce the same scene.
Seed repeatability is tied to source bytes: a grammar change may change old pictures.
Keep the fingerprint with the evidence and re-run after edits.

One integration owner maintains the acceptance cases and final source state.
Delegated work, when authorized, needs disjoint file ownership and a common model
interface. The final check and visual comparison happen after integration.
