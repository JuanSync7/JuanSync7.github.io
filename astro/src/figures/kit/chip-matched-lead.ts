import { matchedContact, matchedWire, type MatchedFingers, type MatchedNet } from './chip-matched-fingers';
import type { ChipComponent, ChipPort } from './chip-types';
import type { Pt, Sketch } from './sketch';

const NETS: Record<string, MatchedNet> = {
  w2: 'GA',
  e2: 'GB',
  n2: 'S',
  s2: 'DB',
  w3: 'DA',
  e1: 'DB',
  s1: 'DA',
  s3: 'DB',
};

/** Macro leads stay in separate outside access tracks. Connecting directly to the
 * array's left edge would short the A gate lead through its shared source contact. */
export function matchedLead(S: Sketch, c: ChipComponent, port: ChipPort, layout: MatchedFingers): void {
  const key = port.id.slice(c.id.length + 1),
    net = NETS[key];
  if (!net) return;
  const [x0, y0, x1, y1] = layout.bounds,
    p = port.point,
    target = layout.terminals[net];
  const size = Math.min(...layout.contacts.map((v) => v.size), 0.0025);
  const gap = Math.min(0.012, (x0 - c.box[0]) / 4.5, (c.box[2] - x1) / 4.5);
  let points: Pt[];
  if (net === 'S') {
    const x = x0 - gap * 2,
      y = y0 - gap * 2;
    points = [p, [p[0], y], [x, y], [x, target[1]], target];
  } else if (port.side === 's' && (net === 'DA' || net === 'DB')) {
    const x = net === 'DA' ? x0 - gap * 3 : x1 + gap * 2,
      y = y1 + gap * 2;
    points = [p, [p[0], y], [x, y], [x, target[1]], target];
  } else {
    const x = net === 'GA' ? x0 - gap : net === 'DA' ? x0 - gap * 3 : net === 'GB' ? x1 + gap : x1 + gap * 2;
    points = [p, [x, p[1]], [x, target[1]], target];
  }
  points = points.filter(
    (q, i) => i === 0 || Math.hypot(q[0] - (points[i - 1]?.[0] ?? 0), q[1] - (points[i - 1]?.[1] ?? 0)) > 1e-9,
  );
  layout.footprint = c.box;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i];
    if (!a || !b) continue;
    matchedWire(S, layout, net, Math.abs(a[1] - b[1]) < 1e-9 ? 'm2' : 'm1', [a, b]);
  }
  for (const q of points.slice(1, -1)) matchedContact(S, layout, net, q, ['m1', 'm2'], size);
  const first = points[1] ?? target;
  const layer = Math.abs(p[1] - first[1]) < 1e-9 ? 'm2' : 'm1';
  matchedContact(S, layout, net, p, [layer], size);
  layout.pins.push({ net, point: p, layer });
}
