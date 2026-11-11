# PCB and package layout review — 11 November 2026

The board, package and modern die drawings now have separate physical recipes.
Their shared line style follows the existing figure palette; density comes from
modeled components, contacts and repeated structures rather than generic texture.

## Reference and arrangement decisions

The [reference cards](deepdive-chip-references.md) record the inspected TSMC
CoWoS-S/CoWoS-L cross-sections, AMD CDNA2/CDNA3 package diagrams, Raspberry Pi 4
schematic/mechanical drawings and Basys 3 board photograph. These supplied the
relationships between parts, not copied artwork.

| Scale | Physical organization | Deterministic variation |
| --- | --- | --- |
| PCB | Power stages and inductors, decouplers, DIMM/socket contacts, controller, flash, crystal, keyed edge connectors and mounting rings. Local copper uses actual footprint pads and declared layers. | Embedded/instrument/workstation; 3/4/6 power phases, 2/3/4 memory slots, BGA/QFP controller. |
| Package | Substrate, interposer, attached underfill, logic/IO dies, HBM base interfaces and memory banks, exposed TSV/microbump patches and coarser C4 cutaway. | Single logic, paired logic or chiplet IO; compatible HBM arrangements and 4/8/12 memory layers. |
| Die | Repeated compute tiles with mirrored interiors, private cache, shared memory arrays, control and ordered boundary interfaces. | Six core, four core with side memory, or paired columns with central shared memory. |

## Feedback that changed the implementation

- Finite plated contacts exposed routes that trapped a later endpoint. The board
  planner now declares all endpoints before routing, reserves their escape space
  and tests actual corner annuli. A collinear routing-grid vertex is not a via.
  There is no route-through-component fallback or seed-specific geometry repair.
- Local bottom copper now has real layer-change contacts at top-mounted pads.
  Connector rows, power phases and repeated contacts retain consistent pitch.
- Package contacts belong to exposed owner-contained patches. Underfill remains
  attached to its own die; HBM links terminate at modeled base-die contacts.
- Visual review initially found the flash lead hard to read. The revised legal
  route exposes its west-side lead and connects to the controller east contact;
  the independent reviewer withdrew the isolated-component finding.
- A variant tag alone is insufficient. Independent checks tie each tag to actual
  placement, repeated geometry and memory-array linework.

## Recorded verification

Reviewed source commit: `6dc7a39db894928b8096be927eb1ac9f06ab6815`.
Dedicated source fingerprint:
`a4af14bc7596aba340d6b059bd240173a359ffc37d44c91b2f261cb131afd489`.
This review note and generated evidence are outside that fingerprint.

- `npm run check` passed after integrating current main.
- `deepdive:agent review` passed: selftests, 2,884 generated plans, 150 gallery
  plans and the default eight-public-seed browser run. The browser checked 336
  phase frames, 64 handoffs, phone/reduced-motion cases and 13,075 performance
  frames. Modern public seeds 5 and 42 averaged 0.743 and 0.834 ms per draw in
  this run; these are local measurements, not a device-independent guarantee.
- The separate static surface audit passed 896 cases: 512 boards from four eras
  at plan salts 1–128; 256 boards from four eras at 64 mixed uint32 salts; 64
  modern packages and 64 modern dies at those mixed salts. Each mixed input is
  assigned one of five absolute dive cycles, rather than testing every salt in
  every cycle. The saved report records exact inputs and before/after identity.
- Sixty-four adverse surface fixtures rejected missing or gapped contacts, broken
  routes, layer mistakes, displaced underfill, inconsistent repetition and false
  variant claims. Positive split-stroke, rotated-circle and radial-pad cases
  prevent the inspector from requiring one particular drawing implementation.
- The routing selftest covers actual versus virtual corners, finite annulus
  clearance, future endpoint reservations and nine production regression salts.
  Existing analog matching, transistor truth-table, supply-network, package bond,
  city/room geometry and parent/child registration checks remain active.
- Default gallery salts 1, 4, 7, 42 and 2026 cover all three PCB, package and die
  variants. The maintained gallery asserts this coverage. The full modern sheet,
  individual board/package/die images and twelve public rest seeds were viewed.
  Independent final visual review found no blocking defect.

The generated `run.json`, `check.json`, `browser.json`, `gallery.json`,
`independent-surface.json` and source-bound feedback records live under
`figures-out/deepdive/`; CI retains its normal review artifacts. The packaging
playbook and kernel index identify the maintained generators and checks.

These are coherent illustrative abstractions, not foundry mask data or a
manufacturing signoff. Unused boundary pins are explicit abstraction boundaries.
Board variants retain a related macro arrangement; package and die variants make
larger structural changes. Finite seed samples do not prove every uint32 input.
