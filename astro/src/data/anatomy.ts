/** The chip-package teardown (`/anatomy/chip-package/`, figure `chip-anatomy`): one step
 *  per part, top down, after the assembled package. The figure lights step i's part. */

export interface AnatomyStep {
  name: string;
  /** One sentence: what the part is and what it does. */
  body: string;
}

export const PACKAGE_STEPS: readonly AnatomyStep[] = [
  {
    name: 'The package',
    body: 'A 2.5D package: a logic die and stacks of memory side by side on a silicon interposer, under one lid, on one substrate. From outside, the lid is all you see.',
  },
  {
    name: 'Lid',
    body: 'A nickel-plated copper heat spreader. It carries heat from the dies to the heatsink and keeps them from being knocked or bent.',
  },
  {
    name: 'Thermal interface',
    body: 'A thin layer of indium or polymer paste between the dies and the lid, filling the microscopic gaps so heat can cross.',
  },
  {
    name: 'Compute die',
    body: 'The logic itself: billions of transistors on a slab of silicon a few hundred square millimetres in area. On top you can see its floorplan: the cores, a band of cache, and the PHY lanes along the edge that faces the memory.',
  },
  {
    name: 'Memory stacks',
    body: 'High-bandwidth memory: eight DRAM dies stacked on a slightly larger base die and joined straight through the silicon by columns of vias, so data moves up and down the stack, not around it.',
  },
  {
    name: 'Underfill',
    body: 'Epoxy flowed in under each die and cured round its microbumps. It holds the joints against the strain of heating and cooling, and shows as a fillet flaring out from every edge.',
  },
  {
    name: 'Microbumps',
    body: 'Thousands of tiny solder joints, tens of micrometres apart, only under the dies: they connect each die to the interposer.',
  },
  {
    name: 'Interposer',
    body: 'Passive silicon with very fine wiring that links logic and memory side by side: a bundle of lines from the die to each stack, and a field of through-silicon vias down to the bumps. Putting dies next to each other on it is what makes the package 2.5D.',
  },
  {
    name: 'C4 bumps',
    body: 'Controlled-collapse chip connections, a little over a tenth of a millimetre apart, carrying signals and power from the interposer down to the substrate.',
  },
  {
    name: 'Capacitors',
    body: 'Decoupling capacitors in rows on the substrate round the bump field, close to where power comes in, to steady the supply when the die suddenly draws more current.',
  },
  {
    name: 'Substrate',
    body: 'Layers of organic build-up wiring either side of a thicker core, joined through it by plated vias, that fan the connections out from bump pitch to a pitch a circuit board can use.',
  },
  {
    name: 'Solder balls',
    body: 'A ball grid array: solder balls about a millimetre apart that join the whole package to the board, with the centre left open for land-side capacitors.',
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
