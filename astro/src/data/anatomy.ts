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
