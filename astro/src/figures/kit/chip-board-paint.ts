import type { BoardLayout } from './chip-board-types';
import type { Sketch } from './sketch';

export function paintBoardLayout(S: Sketch, board: BoardLayout): void {
  for (const trace of board.traces) S.poly(trace.points, 2);
  for (const part of board.footprints) {
    S.rect(part.box, part.kind === 'passive' ? 2 : 1);
    S.rect(part.body, 2);
    for (const pad of part.pads) S.rect(pad.box, 2);
    if (part.pinOne) S.dot(...part.pinOne);
    if (part.kind === 'connector') {
      const b = part.body,
        vertical = b[3] - b[1] > b[2] - b[0];
      if (vertical) S.seg((b[0] + b[2]) / 2, b[1], (b[0] + b[2]) / 2, b[3], 2);
      else S.seg(b[0], (b[1] + b[3]) / 2, b[2], (b[1] + b[3]) / 2, 2);
    }
    if (part.kind === 'crystal') {
      const b = part.body;
      S.rect([b[0] + 0.008, b[1] + 0.006, b[2] - 0.008, b[3] - 0.006], 2);
    }
  }
  for (const ring of board.circles) {
    S.arc(...ring.center, ring.outerRadius, 0, Math.PI * 2, 2, 12);
    S.arc(...ring.center, ring.innerRadius, 0, Math.PI * 2, 2, 12);
  }
}
