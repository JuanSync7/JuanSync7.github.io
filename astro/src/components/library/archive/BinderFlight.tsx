import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import BinderSpine from './BinderSpine';
import { PLATE } from './geometry';
import type { ArchivePiece, BinderBox, Phase } from './types';

interface Props {
  piece: ArchivePiece;
  box: BinderBox;
  phase: Phase;
  /** The stage's view width, a wall unit's width, and the wall and band heights, in plate units. */
  view: number;
  unit: number;
  wallH: number;
  band: number;
}

/** How far a binder rises off its shelf before it flies. */
const LIFT = 16;

/** The binder in the air: a real box (spine, back, covers, top and bottom) that travels from its
 *  shelf to the desk. Across and down are separate moves with their own easing, so the path
 *  arcs; one turn of 120 degrees about (1, -1, -1) lays it down like a book, spine on the left
 *  and the front cover up, so nothing turns again when it lands. On the way back each move takes
 *  its mirrored ease, so the binder retraces the same arc. Only transforms animate. */
export default function BinderFlight({ piece, box, phase, view, unit, wallH, band }: Props) {
  const self = useRef<HTMLDivElement>(null);
  // Read the box once it is in the page, so the browser settles the pose it was put in before the
  // next step changes it: the next pose then transitions from this one instead of jumping to it.
  useLayoutEffect(() => {
    self.current?.getBoundingClientRect();
  }, []);
  const t = box.w;
  const h = box.h;
  const d = PLATE.depth;
  const standing = phase === 'lift' || phase === 'back';
  const x = standing ? view / 2 - unit / 2 + box.x + t / 2 : view / 2;
  const y = standing ? box.y + h / 2 - (phase === 'lift' ? LIFT : 0) : wallH + band + PLATE.deskTop - t / 2;
  const vars = {
    ['--fx' as string]: `${x}px`,
    ['--fy' as string]: `${y}px`,
    ['--turn' as string]: standing ? '0deg' : '120deg',
    ['--bt' as string]: `${t}px`,
    ['--bh' as string]: `${h}px`,
    ['--bd' as string]: `${d}px`,
  } as CSSProperties;
  return (
    <div
      ref={self}
      className="lib-flight"
      style={vars}
      data-fill={box.fill}
      data-back={phase === 'return' || phase === 'back' || undefined}
      aria-hidden="true"
    >
      <div className="lf-down">
        <div className="lf-turn">
          <div className="lf-face lf-spine lib-spine">
            <BinderSpine piece={piece} />
          </div>
          <div className="lf-face lf-fore" />
          <div className="lf-face lf-cover lf-front">
            <span className="lf-panel" />
          </div>
          <div className="lf-face lf-cover lf-back" />
          <div className="lf-face lf-end lf-top" />
          <div className="lf-face lf-end lf-bottom" />
        </div>
      </div>
    </div>
  );
}
