import type { MouseEvent } from 'react';
import FigurePlate from '../../ui/FigurePlate';
import BinderSpine from './BinderSpine';
import { PLATE } from './geometry';
import type { ArchivePiece, ArchiveShelf, BinderBox, Picked } from './types';

interface Props {
  shelves: readonly ArchiveShelf[];
  boxes: readonly (readonly BinderBox[])[];
  pos: number;
  still: boolean;
  /** The binder that is off its shelf, if any. */
  away: Picked | null;
  onPick: (p: Picked) => void;
  onMove: (d: number) => void;
  onHover: (piece: ArchivePiece | null) => void;
}

/** A plain click on a binder opens it here; a click with a modifier (new tab, new window) is
 *  left to the browser, and so is every click before the island wakes up. */
function plain(e: MouseEvent): boolean {
  return !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

/** The wall: three copies of the shelves in a row on one track, so the carousel can keep
 *  turning. Only the shelf facing you takes focus and speaks to a screen reader; a side shelf
 *  is a target that brings itself to the centre. */
export default function ShelfTrack({ shelves, boxes, pos, still, away, onPick, onMove, onHover }: Props) {
  const n = shelves.length;
  const units = Array.from({ length: n * 3 }, (_, j) => j);
  return (
    <div className="lib-track" data-still={still || undefined} style={{ ['--pos' as string]: pos }}>
      {units.map((j) => {
        const s = j % n;
        const shelf = shelves[s];
        const active = j === pos;
        return (
          <section
            key={j}
            className="lib-unit"
            data-active={active || undefined}
            aria-hidden={active ? undefined : true}
            aria-label={active ? `${shelf.label} shelf` : undefined}
            style={{ ['--j' as string]: j }}
            onClick={active ? undefined : (e) => plain(e) && (e.preventDefault(), onMove(j - pos))}
          >
            <FigurePlate id="library-wall" decorative />
            <p className="lib-plaque" style={PLATE.plaque}>
              {shelf.label}
            </p>
            {shelf.pieces.map((p, i) => {
              const b = boxes[s][i];
              if (!b) return null;
              const gone = active && away !== null && away.shelf === s && away.index === i;
              return (
                <a
                  key={p.slug}
                  className="lib-binder lib-spine"
                  href={p.href}
                  data-fill={b.fill}
                  data-gone={gone || undefined}
                  data-binder={active ? `${s}-${i}` : undefined}
                  tabIndex={active ? undefined : -1}
                  aria-label={`${p.num}. ${p.title}. ${p.date}, ${p.read}`}
                  style={{ left: b.x, top: b.y, width: b.w, height: b.h }}
                  onClick={(e) => {
                    if (!plain(e) || !active) return;
                    e.preventDefault();
                    onPick({ shelf: s, index: i });
                  }}
                  onPointerEnter={active ? () => onHover(p) : undefined}
                  onPointerLeave={active ? () => onHover(null) : undefined}
                  onFocus={() => onHover(p)}
                  onBlur={() => onHover(null)}
                >
                  <BinderSpine piece={p} />
                </a>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
