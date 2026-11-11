import { boardBga, boardQfp } from './chip-board-parts';
import { boardConnector, boardCrystal } from './chip-board-connectors';
import { boardVrm } from './chip-board-vrm';
import type { BoardLayout } from './chip-board-types';
import type { ChipPlan } from './chip-types';
import { BOARD_VIA_RADIUS } from './chip-contact-clearance';

/** Board-specific footprints replace ASIC hatching inside packaged controllers. */
export function makeBoardLayout(plan: ChipPlan, variant: BoardLayout['variant']): BoardLayout {
  const board: BoardLayout = {
    variant,
    phaseCount: variant === 'workstation' ? 6 : variant === 'embedded' ? 3 : 4,
    footprints: [],
    traces: [],
    circles: [],
    repeats: [],
  };
  for (const c of plan.components) {
    if (c.kind === 'logic') {
      if (variant === 'embedded') boardBga(board, c);
      else boardQfp(board, c, variant === 'instrument' ? 11 : 7);
    } else if (c.kind === 'flash') boardQfp(board, c, 7);
    else if (c.kind === 'crystal') boardCrystal(board, c);
    else if (c.kind === 'vrm') boardVrm(board, c, plan);
    else if (['dimm', 'pcie', 'io'].includes(c.kind)) boardConnector(board, c, plan);
    else if (c.kind === 'mount-hole') {
      const point: [number, number] = [(c.box[0] + c.box[2]) / 2, (c.box[1] + c.box[3]) / 2];
      board.circles.push({
        id: `${c.id}-annulus`,
        owner: c.id,
        kind: 'mount',
        center: point,
        innerRadius: 0.014,
        outerRadius: 0.032,
      });
    }
  }
  for (const net of plan.nets)
    for (let i = 0; i < net.vias.length; i++) {
      const p = net.vias[i];
      if (p)
        board.circles.push({
          id: `${net.id}-via${i}`,
          owner: net.id,
          kind: 'via',
          center: [...p],
          innerRadius: 0.0028,
          outerRadius: BOARD_VIA_RADIUS,
        });
    }
  for (const trace of board.traces)
    for (const [i, p] of (trace.vias ?? []).entries())
      board.circles.push({
        id: `${trace.id}-via${i}`,
        owner: trace.id,
        kind: 'via',
        center: [...p],
        innerRadius: 0.0018,
        outerRadius: 0.004,
      });
  return board;
}
