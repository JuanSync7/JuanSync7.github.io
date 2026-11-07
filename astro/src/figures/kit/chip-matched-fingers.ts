import { contact } from './analog';
import type { GateContact, GateFet, GateTerminal, GateWire, GateLayer } from './chip-gate-layout';
import type { Box, Pt, Seg, Sketch } from './sketch';

export type MatchedNet = 'GA' | 'GB' | 'S' | 'DA' | 'DB';
export interface MatchedFingers {
  bounds: Box;
  footprint?: Box;
  active: Box;
  fingers: { group: 'A' | 'B'; segment: Seg }[];
  buses: [Seg, Seg];
  fets: GateFet[];
  wires: GateWire[];
  contacts: GateContact[];
  pins: GateTerminal[];
  terminals: Record<MatchedNet, Pt>;
}

export function matchedWire(S: Sketch, layout: MatchedFingers, net: MatchedNet, layer: GateLayer, points: Pt[]): void {
  const clean = points.filter(
    (p, i) => i === 0 || Math.hypot(p[0] - (points[i - 1]?.[0] ?? 0), p[1] - (points[i - 1]?.[1] ?? 0)) > 1e-9,
  );
  if (clean.length < 2) return;
  layout.wires.push({ net, layer, points: clean });
  S.poly(clean, layer === 'poly' ? 1 : 2);
}
export function matchedContact(
  S: Sketch,
  layout: MatchedFingers,
  net: MatchedNet,
  point: Pt,
  layers: GateLayer[],
  size: number,
): void {
  layout.contacts.push({ net, point, layers, size });
  contact(S, ...point, size);
}

/** ABBA shares one source and keeps A/B gates and drains separate. Along the diffusion
 * strip, terminal order is DA,S,DB,S,DA: neighbouring equal-net terminals are physical
 * shared diffusion, while three metal buses join each repeated electrode's contacts. */
export function fingers(S: Sketch, b: Box, n: number): MatchedFingers {
  n = Math.max(4, Math.floor(n / 4) * 4);
  const [x0, y0, x1, y1] = b;
  const h = y1 - y0,
    pitch = (x1 - x0) / n;
  const active: Box = [x0, y0 + h * 0.25, x1, y1 - h * 0.25];
  const middle = (y0 + y1) / 2;
  const busY: Record<MatchedNet, number> = { GA: y0, GB: y1, S: y0 + h * 0.17, DA: y0 + h * 0.83, DB: y0 + h * 0.91 };
  const terminals: Record<MatchedNet, Pt> = {
    GA: [x0, y0],
    GB: [x1, y1],
    S: [x0, busY.S],
    DA: [x0, busY.DA],
    DB: [x1, busY.DB],
  };
  const layout: MatchedFingers = {
    bounds: b,
    active,
    fingers: [],
    buses: [
      [x0, y0, x1, y0],
      [x0, y1, x1, y1],
    ],
    fets: [],
    wires: [],
    contacts: [],
    pins: [],
    terminals,
  };
  const size = Math.min(pitch * 0.08, h * 0.014);
  const positions = Array.from({ length: n + 1 }, (_, i) => x0 + pitch * (i === 0 ? 0.13 : i === n ? n - 0.13 : i));
  const netAt = (i: number): MatchedNet => (i % 2 ? 'S' : i % 4 === 0 ? 'DA' : 'DB');
  S.rect(active, 2);
  for (let i = 0; i < n; i++) {
    const x = x0 + pitch * (i + 0.5),
      a = i % 4 === 0 || i % 4 === 3;
    const net = a ? 'GA' : 'GB';
    const segment: Seg = [x, a ? y0 : active[1], x, a ? active[3] : y1];
    layout.fingers.push({ group: a ? 'A' : 'B', segment });
    matchedWire(S, layout, net, 'poly', [
      [segment[0], segment[1]],
      [segment[2], segment[3]],
    ]);
    matchedContact(S, layout, net, [x, busY[net]], ['poly', 'm2'], size);
    layout.fets.push({
      type: 'n',
      input: a ? 0 : 1,
      control: net,
      gate: [x, middle],
      left: { net: netAt(i), point: [positions[i] ?? x0, middle], layer: 'm1' },
      right: { net: netAt(i + 1), point: [positions[i + 1] ?? x1, middle], layer: 'm1' },
    });
  }
  for (let i = 0; i <= n; i++) {
    const x = positions[i] ?? x0,
      net = netAt(i);
    matchedContact(S, layout, net, [x, middle], ['m1'], size);
    matchedWire(S, layout, net, 'm1', [
      [x, middle],
      [x, busY[net]],
    ]);
    matchedContact(S, layout, net, [x, busY[net]], ['m1', 'm2'], size);
  }
  for (const net of ['GA', 'GB', 'S', 'DA', 'DB'] as const) {
    const xs = positions.filter((_, i) => netAt(i) === net);
    const a = net === 'GB' || net === 'DB' ? Math.min(...xs, x1) : x0;
    const z = net === 'GB' || net === 'DB' ? x1 : Math.max(...xs, x0);
    matchedWire(S, layout, net, 'm2', [
      [a, busY[net]],
      [z, busY[net]],
    ]);
    // Gate buses span the poly columns, independent of the diffusion contact sequence.
    if (net === 'GA' || net === 'GB')
      matchedWire(S, layout, net, 'm2', [
        [x0, busY[net]],
        [x1, busY[net]],
      ]);
    matchedContact(S, layout, net, terminals[net], ['m2'], size);
    layout.pins.push({ net, point: terminals[net], layer: 'm2' });
  }
  return layout;
}
