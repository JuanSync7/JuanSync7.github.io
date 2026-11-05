import type { HardwareKind } from '../figures/kit/hardware/types';

export const HARDWARE_INFO: Record<HardwareKind, { title: string; category: string; note: string }> = {
  processor: { title: 'Processor package', category: 'compute', note: 'Silicon, substrate, contacts and a heat spreader.' },
  memory: { title: 'Memory stack', category: 'compute', note: 'DRAM layers above base logic, joined vertically.' },
  board: { title: 'Single-board computer', category: 'compute', note: 'Compute, memory and connectors on one board.' },
  server: { title: 'Rack server', category: 'infrastructure', note: 'A serviceable chassis with front drive carriers.' },
  storage: { title: 'Hard disk', category: 'infrastructure', note: 'Platters, a spindle and a read/write actuator.' },
  switch: { title: 'Network switch', category: 'infrastructure', note: 'Switching silicon behind a row of physical ports.' },
  rack: { title: 'Equipment rack', category: 'infrastructure', note: 'Repeated equipment bays in a four-post frame.' },
  cooler: { title: 'Active cooler', category: 'physical', note: 'A cold plate, fins and a seven-blade impeller.' },
  power: { title: 'Power supply', category: 'physical', note: 'Conversion, filtering, outputs and ventilation.' },
  accelerator: { title: 'AI accelerator', category: 'compute', note: 'Compute and memory sharing an interposer.' },
  sensor: { title: 'Camera module', category: 'physical', note: 'An optical stack aligned over an image sensor.' },
  optics: { title: 'Optical transceiver', category: 'physical', note: 'Paired optical engines in a pluggable shell.' },
};
