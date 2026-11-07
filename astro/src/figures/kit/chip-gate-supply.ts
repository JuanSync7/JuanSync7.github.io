import { contact } from './analog';
import type { ChipPlan } from './chip-plan';
import type { GateContact, GateTerminal, GateWire } from './gates';
import type { Pt, Sketch } from './sketch';

export interface CellRow {
  top: number;
  height: number;
  flip: boolean;
}

/** Cell rails use M2; margin straps use M1. Only the matching-potential rail receives a
 * via at each crossing. IO pads cap both ends, so no supply stroke hangs in empty space. */
export function cellSupplies(S: Sketch, plan: ChipPlan, rows: CellRow[]): void {
  const wires: GateWire[] = [],
    contacts: GateContact[] = [],
    pins: GateTerminal[] = [];
  const wire = (net: string, layer: 'm1' | 'm2', points: Pt[]): void => {
    wires.push({ net, layer, points });
    S.poly(points, 1);
  };
  const via = (net: string, point: Pt, layers: ('m1' | 'm2')[], size = 0.005): void => {
    contacts.push({ net, point, layers, size });
    contact(S, ...point, size);
  };
  const straps = { VDD: -1.825, GND: 1.825 };
  for (const net of ['VDD', 'GND'] as const) {
    const x = straps[net];
    wire(net, 'm1', [
      [x, -0.855],
      [x, 0.855],
    ]);
    for (const y of [-0.855, 0.855]) {
      const point: Pt = [x, y];
      via(net, point, ['m1'], 0.012);
      pins.push({ net, point, layer: 'm1' });
    }
  }
  for (const row of rows)
    for (const net of ['VDD', 'GND'] as const) {
      const y = row.top + ((net === 'VDD') !== row.flip ? 0 : row.height);
      const point: Pt = [straps[net], y];
      wire(net, 'm2', net === 'VDD' ? [point, [1.81, y]] : [[-1.81, y], point]);
      via(net, point, ['m1', 'm2']);
      const remote: Pt = [net === 'VDD' ? 1.81 : -1.81, y];
      via(net, remote, ['m2'], 0.006);
      pins.push({ net, point: remote, layer: 'm2' });
      // The selected stretch inherits the same power pins as the cells it replaces.
      if (Math.abs(y - S.win[1]) < 1e-8 || Math.abs(y - S.win[3]) < 1e-8) {
        for (const x of [S.win[0], S.win[2]]) {
          via(net, [x, y], ['m2']);
          pins.push({ net, point: [x, y], layer: 'm2' });
        }
      }
    }
  plan.supplyWires = wires;
  plan.supplyContacts = contacts;
  plan.supplyPins = pins;
}
