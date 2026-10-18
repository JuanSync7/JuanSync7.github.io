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
    body: 'The logic itself: billions of transistors on a slab of silicon a few hundred square millimetres in area.',
  },
  {
    name: 'Memory stacks',
    body: 'High-bandwidth memory: DRAM dies stacked on a base die and joined straight through the silicon by vias, so data moves up and down the stack, not around it.',
  },
  {
    name: 'Microbumps',
    body: 'Thousands of tiny solder joints, tens of micrometres apart, connect each die to the interposer; an epoxy underfill holds them against heat and strain.',
  },
  {
    name: 'Interposer',
    body: 'Passive silicon with very fine wiring that links logic and memory side by side. Putting dies next to each other on it is what makes the package 2.5D.',
  },
  {
    name: 'C4 bumps',
    body: 'Controlled-collapse chip connections, a little over a tenth of a millimetre apart, carrying signals and power from the interposer down to the substrate.',
  },
  {
    name: 'Substrate',
    body: 'Layers of organic build-up wiring that fan the connections out from bump pitch to a pitch a circuit board can use, with capacitors on top to steady the power.',
  },
  {
    name: 'Solder balls',
    body: 'A ball grid array: solder balls about a millimetre apart that join the whole package to the board.',
  },
];
