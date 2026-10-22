/** The chip-package teardown (`/anatomy/chip-package/`, figure `chip-anatomy`): a phone
 *  processor's package, one step per part, top down, after the assembled package. The figure
 *  lights step i's part. */

export interface AnatomyStep {
  name: string;
  /** One or two sentences: what the part is and what it does. */
  body: string;
}

export const PACKAGE_STEPS: readonly AnatomyStep[] = [
  {
    name: 'The package',
    body: "A phone's processor, packaged the way TSMC builds Apple's A-series chips (InFO-PoP): one die, no lid, and the memory stacked right on top of it. About 14 mm across and under a millimetre tall; the drawing stretches the heights so the layers read.",
  },
  {
    name: 'Memory cap',
    body: "The memory package's own epoxy, moulded over its dies and marked with its part number. It is the top of the stack, so heat from the processor underneath leaves partly up through it, into the phone's heat spreader.",
  },
  {
    name: 'DRAM dies',
    body: 'LPDDR memory: eight DRAM dies in four layers, two side by side on each, ground down to tens of micrometres. Each layer is set back a little from the edge so the pads along the edge of the one below stay uncovered.',
  },
  {
    name: 'Wire bonds',
    body: "Gold wires thinner than a hair, looped from every pad down to fingers on the memory's substrate. Wire is cheap and proven, but it limits a die to a few hundred connections, so phone memory has a narrow bus where an accelerator's memory has thousands of wires.",
  },
  {
    name: 'Memory substrate',
    body: 'A thin, coreless circuit board under the dies. Its bond fingers catch the wires, and wiring inside it takes each one down to a ball underneath.',
  },
  {
    name: 'PoP balls',
    body: 'Package-on-package joints: about four hundred solder balls in a ring round the edge of the memory, each landing on a copper via in the package below. That ring is the whole path between the processor and its memory.',
  },
  {
    name: 'Mould',
    body: 'Epoxy moulding compound round the die. InFO places the die on a carrier, pours this round it and grinds it flat, then builds the wiring straight onto the die and the mould: the die never sits on a substrate.',
  },
  {
    name: 'Processor die',
    body: "The phone's whole computer on about a hundred square millimetres: two performance and four efficiency CPU cores, a six-core GPU, a sixteen-core neural engine, two banks of system cache, the image, display and media engines, and memory interfaces along both long edges. Drawn face up; in the package it faces down, onto the wiring.",
  },
  {
    name: 'Through vias',
    body: 'Copper posts through the mould, in two rows round the die (through-InFO vias). They carry the memory signals and power from the wiring under the die up to the balls of the memory on top.',
  },
  {
    name: 'Fan-out wiring',
    body: "Three thin layers of copper and polymer in place of a substrate. They spread the die's tightly packed pads out to the vias round it and to the balls under the package, which is what 'fan-out' means: traces run from the die's edge to each via of the inner row.",
  },
  {
    name: 'Capacitors',
    body: 'Small silicon capacitors bonded to the underside, in the gap the ball grid leaves under the die, as close as they can get to where the cores draw their power.',
  },
  {
    name: 'Solder balls',
    body: "About thirteen hundred solder balls, four tenths of a millimetre apart, join it all to the phone's board.",
  },
];

/** The opened accelerator (`/anatomy/chip-package/`, figure `accelerator-package`): one entry
 *  per part the figure lights, top down; `id` is the figure's read-out for it. */
export interface PackagePartInfo {
  id: string;
  name: string;
  body: string;
}

export const ACCELERATOR_PARTS: readonly PackagePartInfo[] = [
  {
    id: 'lid',
    name: 'Lid',
    body: 'Nickel-plated copper, with a raised plateau where the heatsink presses down and a foot bonded to the substrate all round. The mark plate and the data matrix in its corner say which part it is and where it was made.',
  },
  {
    id: 'tim',
    name: 'Indium sheet',
    body: 'A thin sheet of indium, a soft metal, soldered between the silicon and the lid. A paste would do for a laptop; at several hundred watts the heat needs metal to cross.',
  },
  {
    id: 'hbm',
    name: 'HBM stacks',
    body: 'Eight stacks of high-bandwidth memory, four along each long side. Each is eight DRAM dies on a base logic die, wired straight down through the silicon, with a wide bus that runs only millimetres to the compute die beside it.',
  },
  {
    id: 'dies',
    name: 'Compute dies',
    body: 'Two dies, each about as large as a lithography scanner can expose in one shot, joined edge to edge by a die-to-die link so software sees one chip. Two banks of cores sit either side of the shared cache, with PHY lanes along the edges that face the memory.',
  },
  {
    id: 'ubumps',
    name: 'Microbumps and underfill',
    body: 'Copper microbumps a few tens of micrometres apart, tens of thousands under each die and stack, sealed in epoxy underfill that flares out in a fillet from every edge.',
  },
  {
    id: 'interposer',
    name: 'Silicon interposer',
    body: 'Passive silicon, larger than one exposure, so it is printed in stitched pieces. Its fine wiring carries the bundles from die to memory and across the die-to-die link; through-silicon vias take power and signals down to the bumps. Chip on wafer on substrate: CoWoS.',
  },
  {
    id: 'c4',
    name: 'C4 bumps',
    body: 'Solder bumps a little over a tenth of a millimetre apart, joining the interposer to the substrate.',
  },
  {
    id: 'substrate',
    name: 'Substrate',
    body: 'Organic build-up layers either side of a stiff core, joined through it by plated vias, fanning the connections out to a pitch a board can use. Rows of capacitors round the edge hold the supply steady when the dies suddenly draw more current.',
  },
  {
    id: 'balls',
    name: 'Ball grid',
    body: 'Solder balls about a millimetre apart join the package to the board, with the centre left open for capacitors right under the core power.',
  },
];
