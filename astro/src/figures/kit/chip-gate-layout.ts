import { contact } from './analog';
import { width, type Gate } from './gates';
import type { Box, Pt, Sketch, Tone } from './sketch';

import type { GateLayer, GateLayout } from './chip-gate-types';
export type { GateLayout, GateWire, GateContact, GateTerminal, GateFet, GateLayer } from './chip-gate-types';

/** Horizontal M2 straps cross vertical M1 only at declared contacts. Distinct broken
 * diffusion nets receive distinct tracks; one shared y coordinate could short them. */
export function stick(
  S: Sketch,
  g: Gate,
  x0: number,
  top: number,
  h: number,
  pitch: number,
  flip: boolean,
): GateLayout {
  const layout: GateLayout = {
    gate: g,
    bounds: [x0, top, x0 + width(g, pitch), top + h],
    fets: [],
    strips: [],
    wires: [],
    contacts: [],
    pins: [],
  };
  const y = (f: number): number => (flip ? top + h * (1 - f) : top + h * f);
  const c = pitch * 0.13;
  const wire = (net: string, layer: GateLayer, points: Pt[], tone: Tone = 0): void => {
    const distinct = points.filter(
      (p, i) => i === 0 || Math.hypot(p[0] - (points[i - 1]?.[0] ?? 0), p[1] - (points[i - 1]?.[1] ?? 0)) > 1e-9,
    );
    if (distinct.length < 2) return;
    layout.wires.push({ net, layer, points: distinct });
    S.poly(distinct, tone);
  };
  const via = (net: string, point: Pt, layers: GateLayer[], size = c): void => {
    layout.contacts.push({ net, point, layers, size });
    contact(S, ...point, size);
  };
  const xs: number[] = [];
  let x = x0 + pitch;
  for (let i = 0; i < g.inputs; i++) {
    if (g.pull.some((p) => p.brk[i])) x += pitch * 0.6;
    xs.push(x);
    x += pitch;
  }
  const outputPoints: Pt[] = [];
  for (const [side, pull] of g.pull.entries()) {
    const load = side === 0 && g.kind === 'nmos-load';
    const positions = load ? [xs[xs.length - 1] ?? x0 + pitch] : xs;
    const [b0, b1] = side === 0 ? (load ? [0.25, 0.29] : [0.16, 0.38]) : [0.62, 0.84];
    const mid = y((b0 + b1) / 2),
      supply = side === 0 ? 'VDD' : 'GND';
    const railY = y(side === 0 ? 0 : 1);
    wire(
      supply,
      'm2',
      [
        [x0, railY],
        [x0 + width(g, pitch), railY],
      ],
      1,
    );
    const contacts = new Map<string, number[]>();
    const add = (net: string, at: number): void => {
      const points = contacts.get(net) ?? [];
      if (!points.some((p) => Math.abs(p - at) < 1e-9)) points.push(at);
      contacts.set(net, points);
    };
    let start = (positions[0] ?? x0) - pitch / 2;
    const strip = (a: number, b: number): void => {
      const box: Box = [a, Math.min(y(b0), y(b1)), b, Math.max(y(b0), y(b1))];
      layout.strips.push(box);
      S.rect(box, 2);
    };
    pull.lr.forEach(([left, right], i) => {
      const gx = positions[i] ?? x0,
        prev = positions[i - 1],
        next = positions[i + 1];
      if (i > 0 && pull.brk[i]) {
        strip(start, (prev ?? gx) + pitch / 2);
        start = gx - pitch / 2;
      }
      const leftX = i === 0 || pull.brk[i] ? gx - pitch / 2 : ((prev ?? gx) + gx) / 2;
      const rightX = next === undefined || pull.brk[i + 1] ? gx + pitch / 2 : (gx + next) / 2;
      add(left, leftX);
      add(right, rightX);
      layout.fets.push({
        type: side === 0 ? (load ? 'd' : 'p') : 'n',
        input: load ? -1 : i,
        control: load ? 'OUT' : `IN${i}`,
        left: { net: left, point: [leftX, mid], layer: 'm1' },
        right: { net: right, point: [rightX, mid], layer: 'm1' },
        gate: [gx, mid],
      });
    });
    strip(start, (positions[positions.length - 1] ?? x0) + pitch / 2);
    if (load) {
      const gx = positions[0] ?? x0 + pitch;
      // The upper device is depletion NMOS, not a PMOS pull-up. Its poly contact is
      // strapped to the OUT/source contact on M1; the lower enhancement network
      // pulls against this weak, always-conducting load when the output is low.
      wire(
        'OUT',
        'poly',
        [
          [gx, y(0.1)],
          [gx, y(0.4)],
        ],
        1,
      );
      via('OUT', [gx, y(0.1)], ['poly', 'm1']);
      wire('OUT', 'm1', [
        [gx, y(0.1)],
        [gx + pitch / 2, y(0.1)],
        [gx + pitch / 2, mid],
      ]);
      S.rect([gx - pitch * 0.22, Math.min(y(0.2), y(0.34)), gx + pitch * 0.22, Math.max(y(0.2), y(0.34))], 2);
    }
    const brokenNets = [...contacts].filter(
      ([net, positions]) => positions.length > 1 && net !== supply && net !== 'OUT',
    );
    for (const [net, positions] of contacts) {
      for (const tx of positions) {
        via(net, [tx, mid], ['m1'], load ? Math.min(c, h * 0.012) : c);
        if (net === supply) {
          wire(net, 'm1', [
            [tx, mid],
            [tx, railY],
          ]);
          via(net, [tx, railY], ['m1', 'm2']);
        }
        if (net === 'OUT') {
          wire(net, 'm1', [
            [tx, mid],
            [tx, y(0.5)],
          ]);
          via(net, [tx, y(0.5)], ['m1', 'm2']);
          outputPoints.push([tx, y(0.5)]);
        }
      }
      const track = brokenNets.findIndex(([name]) => name === net);
      if (track >= 0) {
        const fraction = 0.05 + (0.08 * (track + 1)) / (brokenNets.length + 1);
        const strapY = y(side === 0 ? fraction : 1 - fraction);
        for (const tx of positions) {
          wire(net, 'm1', [
            [tx, mid],
            [tx, strapY],
          ]);
          via(net, [tx, strapY], ['m1', 'm2'], Math.min(c, (h * 0.08 * 0.28) / (brokenNets.length + 1)));
        }
        wire(net, 'm2', [
          [Math.min(...positions), strapY],
          [Math.max(...positions), strapY],
        ]);
      }
    }
  }
  const right = (xs.at(-1) ?? x0) + pitch * 0.75;
  const out: Pt = [right, y(0.5)];
  wire('OUT', 'm2', [[Math.min(...outputPoints.map((p) => p[0]), right), out[1]], out]);
  via('OUT', out, ['m1', 'm2'], c * 1.3);
  layout.pins.push({ net: 'OUT', point: out, layer: 'm2' });
  for (const [i, gx] of xs.entries()) {
    const net = `IN${i}`,
      pin: Pt = [gx, y(g.kind === 'nmos-load' ? 0.56 : i % 2 ? 0.44 : 0.56)];
    wire(
      net,
      'poly',
      [
        [gx, y(g.kind === 'nmos-load' ? 0.52 : 0.1)],
        [gx, y(0.9)],
      ],
      1,
    );
    via(net, pin, ['poly', 'm1'], c * 1.4);
    layout.pins.push({ net, point: pin, layer: 'poly' });
  }
  for (const net of ['VDD', 'GND']) layout.pins.push({ net, point: [x0, y(net === 'VDD' ? 0 : 1)], layer: 'm2' });
  return layout;
}
