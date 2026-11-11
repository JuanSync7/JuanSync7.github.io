import type { BoardFootprint, BoardKind, BoardLayout, BoardPad } from './chip-board-types';
import type { ChipComponent } from './chip-types';
import { inset, type Box, type Pt } from './sketch';

export function boardPart(
  board: BoardLayout,
  id: string,
  owner: string,
  kind: BoardKind,
  box: Box,
  body: Box,
): BoardFootprint {
  const part: BoardFootprint = { id, owner, kind, box, body, pads: [] };
  board.footprints.push(part);
  return part;
}

export function boardPad(part: BoardFootprint, id: string, box: Box, point: Pt, port?: string): BoardPad {
  const pad: BoardPad = { id: `${part.id}:pad-${id}`, box, point, ...(port ? { port } : {}) };
  part.pads.push(pad);
  return pad;
}

export function boardPort(part: BoardFootprint, c: ChipComponent, depth = 0.016): void {
  for (const p of c.ports) {
    if (part.pads.some((pad) => pad.port === p.id)) continue;
    const [x, y] = p.point,
      width = 0.004;
    const b: Box =
      p.side === 'n'
        ? [x - width, y, x + width, y + depth]
        : p.side === 's'
          ? [x - width, y - depth, x + width, y]
          : p.side === 'w'
            ? [x, y - width, x + depth, y + width]
            : [x - depth, y - width, x, y + width];
    boardPad(part, `port-${p.id}`, b, [...p.point], p.id);
  }
}

/** The lead toes are the component's boundary contacts; quarter points coincide
 * with the existing routed macro terminals rather than stopping short of them. */
export function boardQfp(board: BoardLayout, c: ChipComponent, pins = 7): BoardFootprint {
  const margin = Math.min(c.box[2] - c.box[0], c.box[3] - c.box[1]) * 0.18;
  const part = boardPart(board, c.id, c.id, 'qfp', [...c.box], inset(c.box, margin));
  const [x0, y0, x1, y1] = c.box;
  for (const side of ['n', 'e', 's', 'w'] as const) {
    const members: string[] = [];
    const length = side === 'n' || side === 's' ? x1 - x0 : y1 - y0;
    const pitch = length / (pins + 1),
      half = Math.min(0.008, pitch * 0.24);
    for (let i = 1; i <= pins; i++) {
      const u = i / (pins + 1),
        point: Pt =
          side === 'n' || side === 's'
            ? [x0 + (x1 - x0) * u, side === 'n' ? y0 : y1]
            : [side === 'w' ? x0 : x1, y0 + (y1 - y0) * u];
      const [x, y] = point;
      const b: Box =
        side === 'n'
          ? [x - half, y, x + half, part.body[1]]
          : side === 's'
            ? [x - half, part.body[3], x + half, y]
            : side === 'w'
              ? [x, y - half, part.body[0], y + half]
              : [part.body[2], y - half, x, y + half];
      const terminal = c.ports.find((p) => Math.hypot(p.point[0] - x, p.point[1] - y) < 1e-8);
      members.push(boardPad(part, `${side}${i}`, b, point, terminal?.id).id);
    }
    board.repeats.push({
      id: `${part.id}-${side}`,
      owner: c.id,
      kind: 'pin-row',
      members,
      axis: side === 'n' || side === 's' ? 'x' : 'y',
      pitch,
    });
  }
  part.pinOne = [part.body[0] + 0.015, part.body[1] + 0.015];
  boardPort(part, c);
  return part;
}

export function boardBga(board: BoardLayout, c: ChipComponent): BoardFootprint {
  const part = boardPart(board, c.id, c.id, 'bga', [...c.box], inset(c.box, 0.035));
  const field = inset(part.body, 0.025),
    pitch = 0.035;
  const columns = Math.max(2, Math.floor((field[2] - field[0]) / pitch) + 1),
    rows = Math.max(2, Math.floor((field[3] - field[1]) / pitch) + 1);
  const cx = (field[0] + field[2]) / 2,
    cy = (field[1] + field[3]) / 2,
    members: string[] = [];
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < columns; col++) {
      const x = cx + (col - (columns - 1) / 2) * pitch,
        y = cy + (row - (rows - 1) / 2) * pitch;
      members.push(boardPad(part, `ball-${row}-${col}`, [x - 0.005, y - 0.005, x + 0.005, y + 0.005], [x, y]).id);
    }
  board.repeats.push({
    id: `${part.id}-balls`,
    owner: c.id,
    kind: 'bga-grid',
    members,
    axis: 'x',
    pitch,
    rows,
    columns,
  });
  part.pinOne = [part.body[0] + 0.012, part.body[1] + 0.012];
  boardPort(part, c);
  return part;
}
