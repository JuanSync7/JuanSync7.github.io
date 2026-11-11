import { boardPad, boardPart } from './chip-board-parts';
import type { BoardLayout, BoardPad } from './chip-board-types';
import type { ChipComponent, ChipPlan } from './chip-types';
import type { Pt } from './sketch';

export function boardTrace(
  board: BoardLayout,
  owner: string,
  from: string,
  to: string,
  points: Pt[],
  net: string,
  layer: 'top' | 'bottom' = 'top',
): void {
  const first = points[0],
    last = points[points.length - 1];
  if (!first || !last || points.length < 2) throw new Error('PCB trace needs two physical terminals');
  board.traces.push({
    id: `pcb-trace-${board.traces.length}`,
    owner,
    from,
    to,
    points,
    net,
    layer,
    width: 0.001,
    clearance: 0.001,
    ...(layer === 'bottom' ? { vias: [[...first], [...last]] } : {}),
  });
}

/** A multiphase buck neighborhood: input → power stage → choke → output capacitor.
 * Shared VIN/VDD are on top; return is a separate bottom conductor, without false vias. */
export function boardVrm(board: BoardLayout, c: ChipComponent, plan: ChipPlan): void {
  const [x0, y0, x1] = c.box,
    pitch = (x1 - x0) / board.phaseCount;
  const vin: BoardPad[] = [],
    ground: BoardPad[] = [],
    positive: BoardPad[] = [],
    stages: string[] = [],
    coils: string[] = [],
    capacitors: string[] = [];
  const signal = (port: string) => plan.nets.find((n) => n.from === port || n.to === port)?.signal ?? port;
  const names = { vin: signal('vrm:e2'), vdd: signal('vrm:s2'), vss: signal('vrm:n2') };
  for (let i = 0; i < board.phaseCount; i++) {
    const x = x0 + (i + 0.5) * pitch;
    const stage = boardPart(
      board,
      `phase${i}-stage`,
      c.id,
      'power-stage',
      [x - 0.05, y0 + 0.028, x + 0.05, y0 + 0.087],
      [x - 0.035, y0 + 0.038, x + 0.035, y0 + 0.08],
    );
    stage.pinOne = [x - 0.025, y0 + 0.046];
    stages.push(stage.id);
    const input = boardPad(stage, 'vin', [x - 0.012, y0 + 0.028, x + 0.012, y0 + 0.038], [x, y0 + 0.028]);
    const output = boardPad(stage, 'sw', [x - 0.012, y0 + 0.08, x + 0.012, y0 + 0.087], [x, y0 + 0.087]);
    const gnd = boardPad(stage, 'gnd', [x - 0.05, y0 + 0.055, x - 0.035, y0 + 0.063], [x - 0.05, y0 + 0.059]);
    for (const side of [-1, 1])
      for (let k = 0; k < 3; k++) {
        if (side < 0 && k === 1) continue;
        const y = y0 + 0.044 + k * 0.015;
        boardPad(
          stage,
          `lead-${side}-${k}`,
          [x + (side < 0 ? -0.05 : 0.035), y - 0.004, x + (side < 0 ? -0.035 : 0.05), y + 0.004],
          [x + side * 0.05, y],
        );
      }
    const coil = boardPart(
      board,
      `phase${i}-choke`,
      c.id,
      'inductor',
      [x - 0.06, y0 + 0.093, x + 0.06, y0 + 0.143],
      [x - 0.045, y0 + 0.1, x + 0.045, y0 + 0.136],
    );
    coils.push(coil.id);
    const ci = boardPad(coil, 'in', [x - 0.022, y0 + 0.093, x + 0.022, y0 + 0.1], [x, y0 + 0.093]);
    const co = boardPad(coil, 'out', [x - 0.022, y0 + 0.136, x + 0.022, y0 + 0.143], [x, y0 + 0.143]);
    board.circles.push({
      id: `${coil.id}-winding`,
      owner: c.id,
      kind: 'coil',
      center: [x, y0 + 0.118],
      innerRadius: 0.006,
      outerRadius: 0.013,
    });
    const cap = boardPart(
      board,
      `phase${i}-cap`,
      c.id,
      'passive',
      [x - 0.016, y0 + 0.151, x + 0.016, y0 + 0.177],
      [x - 0.016, y0 + 0.157, x + 0.016, y0 + 0.171],
    );
    capacitors.push(cap.id);
    const cp = boardPad(cap, 'vdd', [x - 0.016, y0 + 0.151, x + 0.016, y0 + 0.157], [x, y0 + 0.151]);
    const cg = boardPad(cap, 'vss', [x - 0.016, y0 + 0.171, x + 0.016, y0 + 0.177], [x, y0 + 0.177]);
    boardTrace(board, c.id, output.id, ci.id, [output.point, ci.point], `phase${i}-switch`);
    boardTrace(board, c.id, co.id, cp.id, [co.point, cp.point], names.vdd);
    boardTrace(
      board,
      c.id,
      gnd.id,
      cg.id,
      [gnd.point, [x - 0.075, gnd.point[1]], [x - 0.075, y0 + 0.184], [x, y0 + 0.184], cg.point],
      names.vss,
      'bottom',
    );
    vin.push(input);
    ground.push(cg);
    positive.push(cp);
  }
  for (const [pads, y, net, layer] of [
    [vin, y0 + 0.014, names.vin, 'top'],
    [positive, y0 + 0.147, names.vdd, 'top'],
    [ground, y0 + 0.184, names.vss, 'bottom'],
  ] as const) {
    for (let i = 1; i < pads.length; i++) {
      const a = pads[i - 1],
        b = pads[i];
      if (a && b) boardTrace(board, c.id, a.id, b.id, [a.point, [a.point[0], y], [b.point[0], y], b.point], net, layer);
    }
  }
  const a = vin[vin.length - 1],
    p = positive[0],
    g = ground[0];
  const port = (id: string) => c.ports.find((q) => q.id === id)?.point;
  const input = port('vrm:e2'),
    vdd = port('vrm:s2'),
    vss = port('vrm:n2');
  if (a && input)
    boardTrace(
      board,
      c.id,
      'vrm:e2',
      a.id,
      [input, [x1 - 0.005, input[1]], [x1 - 0.005, y0 + 0.014], [a.point[0], y0 + 0.014], a.point],
      names.vin,
    );
  if (p && vdd)
    boardTrace(
      board,
      c.id,
      'vrm:s2',
      p.id,
      [
        vdd,
        [vdd[0], y0 + 0.188],
        [x0 + 0.005, y0 + 0.188],
        [x0 + 0.005, y0 + 0.147],
        [p.point[0], y0 + 0.147],
        p.point,
      ],
      names.vdd,
    );
  if (g && vss)
    boardTrace(
      board,
      c.id,
      'vrm:n2',
      g.id,
      [
        vss,
        [vss[0], y0 + 0.005],
        [x0 + 0.012, y0 + 0.005],
        [x0 + 0.012, y0 + 0.184],
        [g.point[0], y0 + 0.184],
        g.point,
      ],
      names.vss,
      'bottom',
    );
  board.repeats.push(
    { id: 'vrm-power-stages', owner: c.id, kind: 'phase-bank', members: stages, axis: 'x', pitch },
    { id: 'vrm-inductors', owner: c.id, kind: 'phase-bank', members: coils, axis: 'x', pitch },
    { id: 'vrm-output-caps', owner: c.id, kind: 'passive-bank', members: capacitors, axis: 'x', pitch },
  );
}
