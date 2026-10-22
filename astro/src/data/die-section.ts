import type { PackagePartInfo } from './anatomy';

/** The cut-open die (`/anatomy/chip-package/`, figure `die-section`): one entry per layer the
 *  figure lights, top down, as it lists them; `id` is the figure's read-out for it. */
export const DIE_PARTS: readonly PackagePartInfo[] = [
  {
    id: 'passivation',
    name: 'Passivation',
    body: 'Silicon nitride over silicon oxide seals the die against moisture and the stray ions that would drift into the transistors, and a layer of polyimide over that cushions it against the package. The only holes are over the pads, where the bumps land. Round the die’s edge, every metal level stacked solid makes a seal ring against cracks from the saw.',
  },
  {
    id: 'pad',
    name: 'Aluminium pad',
    body: 'The one level that is not copper: a micrometre or more of aluminium, which does not corrode in air, takes a probe needle at wafer test, and is what a bump or a wire bond lands on. Vias under it reach the top copper; straps beside it carry the capacitor and the power grid.',
  },
  {
    id: 'mim',
    name: 'MIM capacitor',
    body: 'Metal, insulator, metal: thin plates of titanium nitride with a high-k film between them, stacked three or four deep with alternate plates joined. Spread under the top metal, they hold charge right on the power grid, so a burst of switching does not drag the supply down.',
  },
  {
    id: 'global',
    name: 'Global metal',
    body: 'The top two copper levels, micrometres wide and many times thicker than the levels below. Thick is cheap to run far, so they carry the power grid and the clock across the whole die, and the longest signals.',
  },
  {
    id: 'intermediate',
    name: 'Intermediate metal',
    body: 'Levels at two to four times the tightest pitch, carrying signals between blocks: from one unit of a core to the next, or out to the cache, over tens to hundreds of micrometres. Each still turns a right angle from the level below, so any point reaches any other in a few turns.',
  },
  {
    id: 'local',
    name: 'Local metal',
    body: 'M0 up to about M3, at the tightest pitch lithography allows, around 23 to 32 nm on today’s leading nodes: they wire transistors into gates and gates into cells. Each level is a trench etched into low-k glass, lined with a barrier a couple of nanometres thick so the copper cannot escape, filled, polished flat, then capped with silicon carbonitride: the thin line over every level. At these widths the barrier is much of the line, so the narrowest use cobalt or ruthenium instead.',
  },
  {
    id: 'vias',
    name: 'Vias',
    body: 'Short pillars joining a line to the one crossing beneath it. Each is filled with its line above in one go (dual damascene), so a via and its line are one piece of copper. A chip has billions; the router doubles them where it can, so one bad via does not break a net, and at the tightest pitches their resistance, not the lines’, sets the speed.',
  },
  {
    id: 'contacts',
    name: 'Contacts',
    body: 'The middle of the line, where wiring meets silicon. Trench contacts of tungsten or cobalt run down between the gates onto every source and drain, through a thin silicide that keeps the resistance low, and vias land on them from M0. A dielectric cap on each gate lets a gate contact drop straight onto the gate over the transistor itself without touching the trench contact beside it.',
  },
  {
    id: 'transistors',
    name: 'Transistors',
    body: 'Gate-all-around nanosheets, as in TSMC N2, Samsung SF3 and Intel 18A: three sheets of silicon about 5 nm thick, the gate wrapping all four sides of each, a gate about every 50 nm. The gate is a film of hafnium oxide under work-function metals; the source and drain are crystal grown from the sheets’ ends, phosphorus-doped silicon for n, boron-doped silicon-germanium for p. The right-hand cut goes through one gate as it crosses two n rows and two p rows: an nFET and a pFET sharing one input, the CMOS inverter. In the middle, a dummy gate cuts down into the silicon instead: a break between two cells.',
  },
  {
    id: 'substrate',
    name: 'Silicon',
    body: 'The wafer, about 775 µm thick before it is thinned, and all of it scaffolding except the top few hundred nanometres. Implants make a p-type well under the nFETs and an n-type well under the pFETs; trenches filled with oxide isolate each ridge of active silicon from the next. Intel 18A and TSMC A16 go further and feed power from underneath, through the back of a thinned wafer, so the front metal carries only signals.',
  },
];
