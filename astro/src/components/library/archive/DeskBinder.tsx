import type { CSSProperties } from 'react';
import { PLATE } from './geometry';
import { COVER_OPEN, SHEET_OUT, type BinderBox, type Phase } from './types';

interface Props {
  box: BinderBox;
  phase: Phase;
}

/** The binder lying on the desk, seen side on like a book: the spine on the left, the paper
 *  block, the back board under it and the front board on top. It lands with a small squash,
 *  the front board swings over the spine to the left, and the ring opens for the paper. */
export default function DeskBinder({ box, phase }: Props) {
  const t = box.w;
  const vars = {
    ['--bt' as string]: `${t}px`,
    ['--bx' as string]: `${PLATE.deskSpot - PLATE.depth / 2}px`,
    ['--by' as string]: `${PLATE.deskTop - t}px`,
    ['--bd' as string]: `${PLATE.depth}px`,
  } as CSSProperties;
  return (
    <div
      className="lib-desk-binder"
      style={vars}
      data-fill={box.fill}
      data-plop={phase === 'land' || undefined}
      data-open={COVER_OPEN.includes(phase) || undefined}
      data-rings={SHEET_OUT.includes(phase) || undefined}
      aria-hidden="true"
    >
      <span className="db-block" />
      <span className="db-back" />
      <span className="db-spine" />
      <span className="db-ring" />
      <span className="db-board" />
    </div>
  );
}
