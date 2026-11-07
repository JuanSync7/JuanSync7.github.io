import { contact } from './analog';
import { chipDetails, chipPad } from './chip-detail';
import { cellSupplies } from './chip-gate-supply';
import { matchedCells } from './chip-matched-cell';
import { chipFrame, chipPart, chipPlan, chipWire } from './chip-plan';
import { gate, stick, width } from './gates';
import { BOUND, type Box, type Sketch } from './sketch';

/** At this scale inputs and outputs terminate on contact pads, diffusion stops at
 * breaks, and alternating rows share VDD/VSS rails. A zoom window replaces whole cells. */
export function physicalCells(S: Sketch): void {
  if (S.era === 'testchip') return matchedCells(S);
  S.select([0, 0], S.era === 'bipolar' ? 'bipolar-pair' : 'standard-cell');
  const plan = chipPlan(S, 'cell');
  chipFrame(S);
  if (S.era === 'bipolar') {
    for (let j = 0; j < 3; j++) {
      const y = (j - 1) * 0.56;
      for (let i = 0; i < 3; i++) {
        const x = (i - 1) * 1.06;
        chipPart(plan, `pair${j}${i}`, 'bjt-pair', [x - 0.5, y - 0.25, x + 0.5, y + 0.25], i === 1 && j === 1);
      }
      chipPad(plan, `in${j}`, 'w', y, 0.075);
      chipPad(plan, `out${j}`, 'e', y, 0.075);
      chipWire(S, plan, `in${j}:e2`, `pair${j}0:w2`, 2);
      chipWire(S, plan, `pair${j}0:e2`, `pair${j}1:w2`, 2);
      chipWire(S, plan, `pair${j}1:e2`, `pair${j}2:w2`, 2);
      chipWire(S, plan, `pair${j}2:e2`, `out${j}:w2`, 2);
    }
    chipDetails(S, plan);
    const selected = plan.components.find((part) => part.selected);
    if (selected) chipDetails(S, { ...plan, components: [{ ...selected, selected: false }] });
    return;
  }
  chipPart(plan, 'selected', 'standard-cell', S.win, true);
  plan.gates = [];
  const pitch = 0.055;
  const rows = Array.from({ length: 3 }, (_, row) => ({ top: -0.81 + row * 0.56, height: 0.5, flip: row % 2 === 1 }));
  for (let row = 0; row < 3; row++) {
    const { top: y, flip } = rows[row];
    for (const ry of [y, y + 0.5]) S.rect([BOUND[0] + 0.05, ry - 0.009, BOUND[2] - 0.05, ry + 0.009], 0);
    let x = BOUND[0] + 0.09;
    let count = 0;
    while (x < BOUND[2] - 0.19) {
      if (row === 1 && x > S.win[0] - 0.15 && x < S.win[2] + 0.018) {
        x = S.win[2] + 0.04;
        continue;
      }
      const g = gate(S.rng, S.era === 'nmos' ? 'nmos-load' : 'cmos');
      const gw = width(g, pitch);
      const right = row === 1 && x < S.win[0] ? S.win[0] - 0.025 : BOUND[2] - 0.08;
      if (x + gw > right) {
        if (row === 1 && x < S.win[0]) {
          x = S.win[2] + 0.04;
          continue;
        }
        break;
      }
      const box: Box = [x, y, x + gw, y + 0.5];
      chipPart(plan, `gate${row}-${count++}`, 'standard-cell', box);
      plan.gates.push(stick(S, g, x, y, 0.5, pitch, flip));
      // Cell boundary, well tap and output contact remain tied to the shared rails.
      S.seg(x + gw, y + 0.018, x + gw, y + 0.482, 2);
      x += gw + 0.015;
    }
    for (const tx of [BOUND[0] + 0.065, BOUND[2] - 0.065]) {
      contact(S, tx, y + 0.06, 0.008);
      contact(S, tx, y + 0.44, 0.008);
      S.seg(tx, y, tx, y + 0.06, 1);
      S.seg(tx, y + 0.44, tx, y + 0.5, 1);
    }
  }
  // The terminal scale still contains physical silicon; the next journey dissolves over
  // these complete cells instead of turning their selected stretch into an empty portal.
  for (let x = S.win[0] + 0.025; x < S.win[2] - 0.1; ) {
    const g = gate(S.rng, S.era === 'nmos' ? 'nmos-load' : 'cmos'),
      gw = width(g, pitch);
    if (x + gw > S.win[2] - 0.025) break;
    plan.gates.push(stick(S, g, x, S.win[1], S.win[3] - S.win[1], pitch, true));
    x += gw + 0.015;
  }
  cellSupplies(S, plan, rows);
}

/** A bit-sliced datapath repeats the same gate in each bit position of a stage. */
export function physicalDatapath(S: Sketch): void {
  S.select([0, 0.28], 'cell');
  const plan = chipPlan(S, 'core');
  plan.gates = [];
  chipFrame(S);
  for (let j = 0; j < 2; j++)
    for (let i = 0; i < 3; i++) {
      const [x, y] = [(i - 1) * 1.06, j ? 0.28 : -0.28];
      chipPart(plan, `stage${j}${i}`, 'datapath', [x - 0.5, y - 0.25, x + 0.5, y + 0.25], i === 1 && j === 1);
    }
  for (let j = 0; j < 2; j++)
    for (let i = 0; i < 2; i++) chipWire(S, plan, `stage${j}${i}:e2`, `stage${j}${i + 1}:w2`, 1);
  for (let i = 0; i < 3; i++) chipWire(S, plan, `stage0${i}:s2`, `stage1${i}:n2`, 1);
  for (const c of plan.components) {
    if (c.selected) continue;
    S.rect(c.box, 1);
    const g = gate(S.rng, 'nmos-load');
    const pitch = 0.19 / width(g, 1);
    for (let bit = 0; bit < 4; bit++) {
      const x = c.box[0] + 0.025 + bit * 0.24;
      plan.gates.push(stick(S, g, x, c.box[1] + 0.035, 0.43, pitch, false));
    }
    for (const y of [c.box[1] + 0.035, c.box[3] - 0.035]) S.seg(c.box[0] + 0.015, y, c.box[2] - 0.015, y, 1);
  }
}
