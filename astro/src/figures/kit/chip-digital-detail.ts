import { chipCentre, type ChipComponent, type ChipPlan } from './chip-plan';
import { inset, type Box, type Pt, type Sketch } from './sketch';

const midpoint = (b: Box, side: 'n' | 'e' | 's' | 'w'): Pt => {
  const [x, y] = chipCentre(b);
  return side === 'n' || side === 's' ? [x, side === 'n' ? b[1] : b[3]] : [side === 'w' ? b[0] : b[2], y];
};

/** Bit/word lines meet decoder and sense-amplifier strips. The small cells are an array,
 * not anonymous hatch marks; the periphery and lane recipe scale with the architecture. */
function memory(S: Sketch, b: Box, lanes: number): void {
  const [w, h] = [b[2] - b[0], b[3] - b[1]];
  S.rect(b, 2);
  const decoder = b[0] + w * 0.12;
  const sense = b[3] - h * 0.16;
  S.seg(decoder, b[1], decoder, b[3], 1);
  S.seg(b[0], sense, b[2], sense, 1);
  const rows = Math.max(2, Math.floor(h / 0.027));
  const cols = Math.max(2, Math.min(24, Math.round(w / 0.027) + lanes / 2));
  for (let i = 1; i <= cols; i++) {
    const x = decoder + (w * 0.88 * i) / (cols + 1);
    S.seg(x, b[1], x, b[3], 2);
    S.dot(x, sense + h * 0.08);
  }
  for (let j = 1; j <= rows; j++) {
    const y = b[1] + ((sense - b[1]) * j) / (rows + 1);
    S.seg(b[0], y, b[2], y, 2);
    S.dot(b[0] + w * 0.06, y);
  }
}

function standardRows(S: Sketch, b: Box, rows: number, lanes: number): void {
  const w = b[2] - b[0],
    rh = (b[3] - b[1]) / rows;
  const count = Math.max(3, lanes + 2);
  const cw = w / count;
  for (let j = 0; j < rows; j++) {
    const y = b[1] + j * rh;
    S.seg(b[0], y, b[2], y, 2);
    S.seg(b[0], y + rh, b[2], y + rh, 2);
    for (let i = 0; i < count; i++) {
      const x = b[0] + i * cw;
      const gx = x + cw * 0.5;
      S.rect([x + cw * 0.13, y + rh * 0.16, x + cw * 0.87, y + rh * 0.38], 2);
      S.rect([x + cw * 0.13, y + rh * 0.62, x + cw * 0.87, y + rh * 0.84], 2);
      S.seg(gx, y + rh * 0.1, gx, y + rh * 0.9, 2);
      S.seg(x + cw * 0.26, y, x + cw * 0.26, y + rh * 0.27, 2);
      S.seg(x + cw * 0.26, y + rh * 0.73, x + cw * 0.26, y + rh, 2);
      S.seg(x + cw * 0.73, y + rh * 0.27, x + cw * 0.73, y + rh * 0.73, 2);
    }
  }
}

export function digitalDetail(S: Sketch, plan: ChipPlan, c: ChipComponent): Map<string, Pt> | undefined {
  if (!['sram', 'cache', 'hbm', 'core', 'logic', 'phy'].includes(c.kind)) return undefined;
  const [x0, y0, x1, y1] = c.box;
  const [w, h] = [x1 - x0, y1 - y0];
  const margin = Math.min(w, h) * 0.08;
  const inner = inset(c.box, margin);
  if (c.kind === 'core') {
    const cacheRight = x0 + w * 0.3;
    const bankHeight = (h - margin * (plan.cacheBanks + 1)) / plan.cacheBanks;
    for (let bank = 0; bank < plan.cacheBanks; bank++) {
      const top = y0 + margin + bank * (bankHeight + margin);
      memory(S, [x0 + margin, top, cacheRight, top + bankHeight], plan.lanes);
    }
    const left = cacheRight + margin * 1.4;
    const front: Box = [left, y0 + margin, x1 - margin, y0 + h * 0.24];
    const regs: Box = [left, y0 + h * 0.31, x1 - margin, y0 + h * 0.5];
    const stages = 2 + plan.unitCount / 4;
    S.rect(front, 2);
    S.grid(front, stages, 1, 2);
    memory(S, regs, plan.lanes);
    const execution: Box = [left, y0 + h * 0.58, x1 - margin, y1 - margin];
    S.rect(execution, 2);
    S.grid(execution, stages, plan.lanes, 2);
    // The two local trunks stop on cache, decoder, register and execution contacts.
    const channel = cacheRight + margin * 0.7;
    const a = midpoint(front, 'w'),
      b = midpoint(execution, 'w');
    S.poly([a, [channel, a[1]], [channel, b[1]], b], 2);
    for (const p of [a, b]) S.dot(...p);
    for (let lane = 0; lane < plan.lanes; lane++) {
      const x = left + ((x1 - margin - left) * (lane + 0.5)) / plan.lanes;
      S.seg(x, regs[3], x, execution[1], 2);
      S.dot(x, regs[3]);
      S.dot(x, execution[1]);
    }
  } else if (c.kind === 'cache' || c.kind === 'sram' || c.kind === 'hbm') {
    const banks = c.kind === 'hbm' ? 2 : plan.cacheBanks;
    const gap = margin * 0.7;
    const bw = (inner[2] - inner[0] - gap * (banks - 1)) / banks;
    for (let bank = 0; bank < banks; bank++) {
      const x = inner[0] + bank * (bw + gap);
      memory(S, [x, inner[1], x + bw, inner[3]], plan.lanes);
    }
  } else if (c.kind === 'logic') {
    standardRows(S, inner, Math.max(3, Math.min(12, Math.floor(h / 0.09) + plan.unitCount / 4)), plan.lanes);
  } else {
    const lanes = plan.lanes * 2;
    for (let i = 0; i < lanes; i++) {
      const x = inner[0] + ((inner[2] - inner[0]) * i) / lanes;
      const step = (inner[2] - inner[0]) / lanes;
      S.rect([x + step * 0.12, inner[1], x + step * 0.88, inner[3]], 2);
      S.seg(x + step / 2, y0, x + step / 2, inner[1], 2);
      S.seg(x + step / 2, inner[3], x + step / 2, y1, 2);
    }
  }
  const terminals = new Map<string, Pt>();
  for (const p of c.ports) {
    const target: Pt =
      p.side === 'n' || p.side === 's'
        ? [p.point[0], p.side === 'n' ? inner[1] : inner[3]]
        : [p.side === 'w' ? inner[0] : inner[2], p.point[1]];
    terminals.set(p.id.slice(c.id.length + 1), target);
  }
  return terminals;
}
