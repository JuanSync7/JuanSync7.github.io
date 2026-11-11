import { boardPad, boardPart } from './chip-board-parts';
import type { BoardLayout } from './chip-board-types';
import type { ChipComponent, ChipPlan } from './chip-types';
import type { Box, Pt } from './sketch';

/** Opposed contact rows share pitch and leave keyed ends and latch clearances. */
export function boardConnector(board: BoardLayout, c: ChipComponent, plan: ChipPlan): void {
  const [x0, y0, x1, y1] = c.box,
    w = x1 - x0,
    h = y1 - y0,
    vertical = h > w;
  const cross = vertical ? w : h,
    depth = cross * 0.35;
  const body: Box = vertical
    ? [x0 + depth, y0 + 0.02, x1 - depth, y1 - 0.02]
    : [x0 + 0.02, y0 + depth, x1 - 0.02, y1 - depth];
  const part = boardPart(board, c.id, c.id, 'connector', [...c.box], body);
  const length = vertical ? h : w,
    count = Math.max(4, Math.floor((length - 0.12) / 0.025)),
    pitch = (length - 0.12) / (count - 1);
  const key = vertical ? y0 + h * 0.38 : x0 + w * 0.38;
  for (const side of [-1, 1]) {
    const banks: string[][] = [[], []];
    for (let i = 0; i < count; i++) {
      const t = (vertical ? y0 : x0) + 0.06 + i * pitch;
      if (Math.abs(t - key) < pitch * 0.38) continue;
      const b: Box = vertical
        ? [side < 0 ? x0 + 0.006 : body[2], t - 0.004, side < 0 ? body[0] : x1 - 0.006, t + 0.004]
        : [t - 0.004, side < 0 ? y0 + 0.006 : body[3], t + 0.004, side < 0 ? body[1] : y1 - 0.006];
      const p: Pt = vertical ? [side < 0 ? x0 + 0.006 : x1 - 0.006, t] : [t, side < 0 ? y0 + 0.006 : y1 - 0.006];
      banks[t < key ? 0 : 1]?.push(boardPad(part, `contact-${side}-${i}`, b, p).id);
    }
    banks.forEach((members, bank) =>
      board.repeats.push({
        id: `${c.id}-contacts-${side}-${bank}`,
        owner: c.id,
        kind: 'pin-row',
        members,
        axis: vertical ? 'y' : 'x',
        pitch,
      }),
    );
  }
  const used = new Set(plan.nets.flatMap((n) => [n.from, n.to]));
  for (const p of c.ports.filter((p) => used.has(p.id))) {
    const [x, y] = p.point,
      half = 0.004;
    const b: Box =
      p.side === 'w'
        ? [x, y - half, body[0], y + half]
        : p.side === 'e'
          ? [body[2], y - half, x, y + half]
          : p.side === 'n'
            ? [x - half, y, x + half, body[1]]
            : [x - half, body[3], x + half, y];
    boardPad(part, `terminal-${p.id}`, b, [...p.point], p.id);
  }
}

export function boardCrystal(board: BoardLayout, c: ChipComponent): void {
  const [x0, y0, x1, y1] = c.box,
    cy = (y0 + y1) / 2;
  const part = boardPart(board, c.id, c.id, 'crystal', [...c.box], [x0 + 0.025, y0 + 0.012, x1 - 0.025, y1 - 0.012]);
  boardPad(part, 'left', [x0, cy - 0.012, part.body[0], cy + 0.012], [x0, cy], `${c.id}:w2`);
  boardPad(part, 'right', [part.body[2], cy - 0.012, x1, cy + 0.012], [x1, cy], `${c.id}:e2`);
}
