import { bjt, capacitor, contact, fingers, guard, meander, spiral } from './analog';
import { matchedLead } from './chip-matched-lead';
import type { MatchedFingers } from './chip-matched-fingers';
import { digitalDetail } from './chip-digital-detail';
import { chipCentre, type ChipComponent, type ChipPlan, type ChipPort } from './chip-plan';
import { inset, type Box, type Pt, type Sketch } from './sketch';

/** Identical instances share a drawing recipe and pitch; random variation belongs to
 * architecture choices, never to nominally matched transistors or repeated memory bits. */
export function chipDetails(S: Sketch, plan: ChipPlan): void {
  const used = new Set(plan.nets.flatMap((n) => [n.from, n.to]));
  for (const c of plan.components) {
    if (c.selected) continue;
    const [x0, y0, x1, y1] = c.box;
    const [w, h] = [x1 - x0, y1 - y0];
    const [cx, cy] = chipCentre(c.box);
    const inner = inset(c.box, Math.min(w, h) * 0.1);
    const terminals = new Map<string, Pt>();
    let matching: MatchedFingers | undefined;
    if (c.kind === 'pad') {
      S.rect(c.box, 1);
      S.rect(inner, 2);
      continue;
    }
    S.rect(c.box, c.kind === 'decap' ? 2 : 1);
    const digital = digitalDetail(S, plan, c);
    if (digital) {
      for (const [id, point] of digital) terminals.set(id, point);
    } else if (c.kind === 'spiral') {
      const ts = spiral(S, cx, cy, Math.min(w, h) * 0.34, 3);
      terminals.set('w2', ts[0]);
      terminals.set('e2', ts[1]);
    } else if (c.kind === 'resistor') {
      const ts = meander(S, inset(c.box, Math.min(w, h) * 0.2), 6);
      terminals.set('w2', ts[0]);
      terminals.set('e2', ts[1]);
    } else if (c.kind === 'capacitor') {
      const ts = capacitor(S, inset(c.box, Math.min(w, h) * 0.2));
      terminals.set('w2', ts[0]);
      terminals.set('e2', ts[1]);
    } else if (c.kind === 'mos-pair') {
      const active = inset(c.box, Math.min(w, h) * (0.18 + plan.driveStrength * 0.006));
      matching = fingers(S, active, plan.unitCount);
      (plan.matches ??= []).push(matching);
      guard(S, active);
      terminals.set('w2', [active[0], active[1]]);
      terminals.set('e2', [active[2], active[3]]);
      terminals.set('n2', [(active[0] + active[2]) / 2, active[1] + (active[3] - active[1]) * 0.5]);
      terminals.set('s2', [(active[0] + active[2]) / 2, active[3]]);
    } else if (c.kind === 'bjt-pair') {
      const size = Math.min(w * 0.21, h * 0.35) * (0.65 + plan.driveStrength / 40);
      const [a, b] = [bjt(S, cx - w * 0.23, cy, size), bjt(S, cx + w * 0.23, cy, size)];
      for (const x of [cx - w * 0.23, cx + w * 0.23])
        for (let finger = 0; finger < plan.lanes; finger++) {
          const fx = x + size * (0.08 + (0.44 * (finger + 0.5)) / plan.lanes);
          S.seg(fx, cy - size * 0.2, fx, cy + size * 0.2, 2);
        }
      const emit: Pt = [cx, y1 - h * 0.12];
      S.poly([a[2], [a[2][0], emit[1]], emit, [b[2][0], emit[1]], b[2]], 1);
      terminals.set('w2', a[1]);
      terminals.set('e2', b[1]);
      terminals.set('n1', a[0]);
      terminals.set('n3', b[0]);
      terminals.set('n2', a[0]);
      terminals.set('s2', emit);
    } else if (c.kind === 'dimm' || c.kind === 'pcie' || c.kind === 'io') {
      S.rect(inner, 2);
      const vertical = h > w;
      const n = Math.max(3, Math.floor((vertical ? h : w) / 0.035));
      for (let i = 1; i < n; i++) {
        const u = i / n;
        if (vertical) S.seg(x0, y0 + h * u, inner[0], y0 + h * u, 2);
        else S.seg(x0 + w * u, y1, x0 + w * u, inner[3], 2);
      }
      if (vertical) S.seg(x0, y0 + h * 0.38, x1, y0 + h * 0.38, 1);
      else S.seg(x0 + w * 0.38, y0, x0 + w * 0.38, y1, 1);
    } else if (c.kind === 'vrm') {
      for (let i = 0; i < 4; i++) {
        const x = x0 + (w * i) / 4;
        S.rect([x + w * 0.035, y0 + h * 0.15, x + w * 0.215, y1 - h * 0.15], 2);
      }
    } else if (c.kind === 'decap') {
      if (h > w) {
        S.seg(x0, y0 + h * 0.23, x1, y0 + h * 0.23, 2);
        S.seg(x0, y1 - h * 0.23, x1, y1 - h * 0.23, 2);
      } else {
        S.seg(x0 + w * 0.23, y0, x0 + w * 0.23, y1, 2);
        S.seg(x1 - w * 0.23, y0, x1 - w * 0.23, y1, 2);
      }
    } else if (c.kind === 'power-rail') {
      // The whole rectangle is one conductor; taps have their own contact geometry.
    } else {
      S.rect(inner, 2);
      const pitch = Math.max(0.025, Math.min(w, h) / 6);
      S.hatch(inner, pitch, 2, c.kind === 'phy' ? 'v' : 'h');
      S.dot(x0 + w * 0.12, y0 + h * 0.12);
    }
    for (const p of c.ports) {
      if (!used.has(p.id)) continue;
      if (matching) {
        matchedLead(S, c, p, matching);
        continue;
      }
      const local = p.id.slice(c.id.length + 1);
      const device = terminals.get(local);
      if (device) lead(S, p, device);
    }
  }
}

function lead(S: Sketch, port: ChipPort, device: Pt): void {
  const p = port.point;
  const points: Pt[] = [p, port.side === 'n' || port.side === 's' ? [p[0], device[1]] : [device[0], p[1]], device];
  S.poly(
    points.filter(
      (q, i) => i === 0 || Math.hypot(q[0] - (points[i - 1]?.[0] ?? 0), q[1] - (points[i - 1]?.[1] ?? 0)) > 1e-8,
    ),
    1,
  );
  contact(S, ...device, 0.005);
}

export function chipPad(
  plan: ChipPlan,
  id: string,
  side: 'n' | 'e' | 's' | 'w',
  u: number,
  size = 0.09,
): ChipComponent {
  const [x, y] = side === 'n' || side === 's' ? [u, side === 'n' ? -0.765 : 0.765] : [side === 'w' ? -1.725 : 1.725, u];
  const box: Box = [x - size / 2, y - size / 2, x + size / 2, y + size / 2];
  const ports: ChipPort[] = [];
  for (const edge of ['n', 'e', 's', 'w'] as const) {
    const point: Pt =
      edge === 'n' || edge === 's' ? [x, edge === 'n' ? box[1] : box[3]] : [edge === 'w' ? box[0] : box[2], y];
    ports.push({ id: `${id}:${edge}2`, point, side: edge });
  }
  const pad: ChipComponent = { id, kind: 'pad', box, ports, selected: false, side };
  plan.components.push(pad);
  return pad;
}
