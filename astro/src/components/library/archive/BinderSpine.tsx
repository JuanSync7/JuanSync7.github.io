import type { ArchivePiece } from './types';

interface Props {
  piece: ArchivePiece;
}

/** What a binder's spine carries, front to back: a rule, the number label (the newest piece's
 *  in the signal), the title written down the spine, the finger hole, the shaded right edge and
 *  the foot. Drawn the same on the shelf and in the air. */
export default function BinderSpine({ piece }: Props) {
  return (
    <>
      <span className="bs-rule" aria-hidden="true" />
      <span className="bs-label" data-latest={piece.latest || undefined} aria-hidden="true">
        {piece.num}
      </span>
      <span className="bs-title" aria-hidden="true">
        <span>{piece.title}</span>
      </span>
      <span className="bs-hole" aria-hidden="true" />
      <span className="bs-edge" aria-hidden="true" />
      <span className="bs-foot" aria-hidden="true" />
    </>
  );
}
