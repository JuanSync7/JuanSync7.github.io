# Silicon dive: references, model and review

Read alongside the deep-dive agent's layout and connectivity playbooks. These drawings use normalized
plan coordinates; they are illustrations of physical organisation, not mask data.

## Reference cards

| Primary reference | Observation used | Where it appears |
| --- | --- | --- |
| [Ken Shirriff: inside the 741](https://www.righto.com/2015/10/inside-ubiquitous-741-op-amp-circuits.html) | Inspected the original die, NPN structure and current-mirror images: small matched transistor groups, a large compensation plate, long resistor strips, larger output devices, ordered edge pads. The die is asymmetric. | `chip-bipolar-layout.ts` places mirror groups at the left, a resistor network above, an input stage, gain/output devices and a dominant compensation capacitor. `analog.ts` uses nested collector/base/emitter regions and real contact locations. |
| [OpenROAD: Ibex floorplan](https://openroad.readthedocs.io/en/latest/main/README.html) | Digital floorplans have bounded macro regions, ordered IO, rows of placed cells and reserved interconnect space. A drawing should preserve those different scales of repetition. | `dies.ts` and `chip-digital-detail.ts`: repeated core tiles, local caches, decoder/sense strips, execution lanes, standard-cell rows, edge PHY lanes. |
| [OpenROAD: hierarchical macro placement](https://openroad.readthedocs.io/en/latest/main/src/mpl/README.html) | Hierarchy/dataflow drives placement; macro channels, pin-aware clearance, fences and fixed outlines are explicit constraints. | `chip-plan.ts`: allocate components first; route through legal edge channels; reject a route with no legal channel. No fallback line through a macro. |
| [OpenROAD: pin placement](https://openroad.readthedocs.io/en/latest/main/src/ppl/README.html) | Pins belong on declared edges, in ordered groups; track-grid placement and routing-obstruction keepouts matter. | `ChipPort.side`, ordered PHY/pad groups, monotonic HBM contacts, package lead-to-die fanout and checker edge tests. |
| [GF180MCU analog guidelines](https://gf180mcu-pdk.readthedocs.io/en/latest/physical_verification/design_manual/drm_05_4.html) | Unrelated routing must not run over precision matching components; resistor/device matching has dedicated rules. | Device footprints are router obstacles; matched instances share dimensions and a complete ABBA unit count. Guard contacts surround active groups. |
| [UMBC: NMOS combinational logic](https://courses.cs.umbc.edu/graduate/CMPE640/Fall16/cpatel2/lectures/lect15_combo2.pdf) | Slide 4 shows the depletion-load gate tied to its output/source. A weak load remains conductive at zero gate/source voltage. | The separate 6502-era `nmos-load` recipe has a depletion device and enhancement pull-down network, with no PFETs. Its tests check ratioed logic rather than incorrectly applying the CMOS no-static-current condition. |
| [Steve Ward: CMOS notes](https://computationstructures.org/notes/cmos/notes.html) | Complementary PFET/NFET series-parallel networks drive the output from exactly one rail for each input combination. | `gates.ts` derives the pull-up as the dual of the pull-down; independent exhaustive truth-table tests check every input state. |

## PCB and advanced packaging references

Inspected on 11 November 2026 alongside the earlier device references:

| Primary reference | Observed relationship | Adaptation |
| --- | --- | --- |
| [TSMC CoWoS-S cross-section](https://3dfabric.tsmc.com/site_img/dedicatedFoundry/technology/cowos/CoWoS-s_01.png), [CoWoS-L cross-section](https://3dfabric.tsmc.com/site_img/dedicatedFoundry/technology/cowos/CoWoS-L_01.png) | Distinct die contacts, interposer, substrate joints and attached underfill. Pitch changes with the interface; a local bridge belongs beneath a specific interface. | Explicit package envelopes and owner-contained exposed contact patches, rather than uniform circles across empty substrate. |
| [AMD CDNA3 white paper, Figure 1, page 3](https://www.amd.com/content/dam/amd/en/documents/instinct-tech-docs/white-papers/amd-cdna-3-white-paper.pdf#page=3) | Exploded package render: compute chiplets above I/O dies, memory stacks alongside, perimeter passives and a shared base. | Compatible package recipes with distinct logic, memory, routing and support neighborhoods. These are inspired arrangements, not an exact MI300 implementation. |
| [AMD CDNA2 white paper, Figures 1a–1b, pages 3–4](https://www.amd.com/content/dam/amd/en/documents/instinct-business-docs/white-papers/amd-cdna2-white-paper.pdf#page=3) | Older compute-array, cache/controller and boundary-interface organization, plus a paired-die module. | Whole die placement variants retain common tile dimensions while changing compute/fabric organization. |
| [Raspberry Pi 4 reduced schematics](https://datasheets.raspberrypi.com/rpi4/raspberry-pi-4-reduced-schematics.pdf), [mechanical drawing](https://datasheets.raspberrypi.com/rpi4/raspberry-pi-4-mechanical-drawing.pdf) | Power stages and small support circuits form neighborhoods; connectors face edges; mounting holes have reserved annuli. | Board footprints, repeated power/passive banks, real contact pads, short support routes and mounting keepouts. |
| [Digilent Basys3 manual, Figure 1, page 2](https://www.amd.com/content/dam/amd/en/documents/university/aup-boards/XUPBasys3/documentation/Basys3_rm_8_22_2014.pdf#page=2) | Actual photographed board distinguishes dense FPGA support components, peripheral ports and aligned switch/LED banks. | Component-specific PCB recipes rather than giving every device the same hatch or connector outline. |

Earlier device references were reviewed on 7 November 2026. Reference screenshots live only in the ignored
`figures-out/deepdive/reference-*` review directory. The site uses original vector
geometry; no microscopy image or extracted proprietary layout is bundled.

## Physical contracts

- A selected package, core, circuit block or cell occupies the exact dive aperture.
  The terminal cell retains a physical cell specimen while the journey resets.
- Package, die and PCB boundaries remain distinct. Pin-one corners, cavity seals,
  substrate contacts, ordered pad groups and repeated device footprints have roles.
- Every inter-component wire joins two named boundary contacts. Source, destination,
  access track, bends and vias are recorded, then checked against emitted segments.
- Horizontal and vertical macro interconnect use separate metal layers. A via joins layers
  only at a declared contact; unrelated parallel runs and contact-on-wire shorts fail.
- Local PCB footprint traces declare their copper side. Same-layer bends need no
  via; bottom-side routes connected to top SMD pads have explicit plated attachments.
  The board router reserves full annular contacts, including at later connections,
  rather than accepting clear centers whose metal rings still touch another signal.
- Wire-bonded packages use a separate material rule: direct, ordered lead-to-die
  spans, each ending on two landing contacts. A bond has no planar routing elbow or
  metal-layer via. Crossing or overlapping bond fanouts fail even if labels match.
- A bonded package uses the actual independently seeded child die's pad count, side
  order and coordinates. Nested pad footprints are explicit children of its die;
  only the own landing's ancestor can be traversed by an aerial bond. Inside-window
  interface strokes are retained and checked with the finished outer drawing, so a
  portal cannot hide a gap before the child pad.
- A pad or power rail is one conductor. Explicit pin groups identify the same supply
  at several macro pins. The checker derives these equivalences independently rather
  than trusting a repeated `signal` string.
- Every decoupling capacitor connects between power and return through separate pads.
  The row of capacitors is a real parallel network, with two continuous conductors.
- Repeated core/cache tiles, bit slices and analog matched units share a recipe within
  one plan. Lane count, cache-bank count, pipeline stage count and transistor drive
  class vary the architecture, not each nominally identical instance independently.
- A memory array includes decoder and sense-amplifier strips. Word and bit lines meet
  those structures; dense detail should still read as an array at the next zoom scale.

## What the checks establish

`chip-check.mjs` inspects production `makeDiveSketch` output for all six levels and
four silicon eras. Its seed argument is a **plan salt**, matching the gallery's labels;
it includes production's level offset and initial random draws.

It checks component containment/nonoverlap, selected-footprint equality, declared pin
edges, explicit route endpoints, orthogonal routes, component keepouts, route coverage
in actual emitted strokes, actual via contacts and shorts between independently derived
nets. Capacitor power/return separation and required board roles are checked too.

For every actual CMOS or depletion-load NMOS gate, `chip-gate-check.mjs` independently reconstructs the
transistor netlist, enumerates every input combination, checks the appropriate complementary or ratioed-load logic
and compares transistor terminals to the physical diffusion/poly/metal model.
Every conductor, strip and contact must occur in emitted linework. The whole-cell
supply checker floods from each gate's VDD/GND pin through actual row rails and layer
contacts to the global power pads. Distinct internal nets get separate strap tracks. Full contact squares, not only their centres, must remain clear of unrelated same-layer wires and contacts.

The analog terminal has its own matched-MOS recipe: ABBA gate fingers, a shared source,
separate A/B gates and drains, a diffusion sequence `DA,S,DB,S,DA`, five named contact
nodes and explicit poly/metal layer changes. It stays analog when the camera descends;
it does not turn into a bank of NAND gates.

This is stronger than visual proximity or a metadata-only connection list. It does not
claim foundry DRC, parasitic extraction, analog circuit simulation or a synthesized CPU
netlist between every visible gate. Macro ports and unconnected cell input/output pads
are explicit abstraction boundaries; the local CMOS circuits and drawn interconnect
are the units checked electrically.

## Feedback captured in the implementation

| Finding | Correction | Rejection fixture |
| --- | --- | --- |
| Tracks ran from device centres through unrelated bodies. | Named edge contacts, component obstacles and legal access tracks. | A route crossing the chipset must fail. |
| All contacts used one escape distance, so a later pin landed on an earlier wire. | Choose an available access track before channel routing. | Via/contact-on-unrelated-wire short. |
| A duplicated signal label could excuse a metal overlap. | Independent terminal/conductor union groups. | Relabelled short still fails. |
| The resistor had one detached contact. | Both meander ends return real contacts. | Route endpoints and emitted continuity. |
| RF outer lead crossed the winding. | Outer terminal enters from the outer left turn; the inner terminal uses a marked underpass. | Precision device keepouts and visual winding review. |
| Distinct internal gate nets shared one strap height. | Separate strap tracks and explicit layer-change contacts. | Same-layer internal short and exhaustive logic fixtures. |
| Alternating cell rows were individually powered but lacked a shared supply network. | Global VDD/GND straps, complete row centre lines, junction vias and end pads. | Missing rail/via, hanging rail end and disconnected supply fixtures. |
| Analog and NMOS terminal levels reused modern CMOS gates. | A five-node matched-MOS terminal and a separate depletion-load NMOS gate recipe preserve the selected era. | Era mismatch, CMOS-in-NMOS and digital-in-analog fixtures. |
| A terminal cell zoomed into a rack. | Render real selected cell detail; the renderer resets the journey through a deliberate transition. | Terminal detail/transition checks in the main deep-dive kernel. |
| Modern macros became sparse generic grids after topology cleanup. | Real cache periphery, standard-cell organisation, local trunks, HBM lane groups and connected decoupling. | Geometry diversity and full-size/phone gallery review. |
| Package bonds were drawn as right-angle metal routes. | A dedicated `bond-wire` conductor joins ordered lead fingers directly to die pads. | Crossed fanout, false bond via, right-angle bond and metal-substitution fixtures. |
| Package bonds landed on the portal while the next die's real pads sat farther inside. | Register the actual child pad footprints and retain the inside bond spans across the portal. | Misregistered pad, missing retained inside span, unrelated-pad traversal and substituted pin-list fixtures. |
