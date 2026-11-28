import FigurePlate from '../../ui/FigurePlate';
import BinderSpine from './BinderSpine';
import PlateFlames from './PlateFlames';
import ShelfDirectory from './ShelfDirectory';
import { PLATE, WALL } from './geometry';
import { plain } from './plain';
import type { ArchivePiece, ArchiveShelf, BinderBox, Picked, Prop } from './types';

interface Props {
  shelves: readonly ArchiveShelf[];
  boxes: readonly (readonly BinderBox[])[];
  props: readonly (readonly Prop[])[];
  pos: number;
  still: boolean;
  /** The binder that is off its shelf, if any. */
  away: Picked | null;
  /** The piece pointed at, on its spine or its directory row: its binder lifts and shows its tag. */
  hot: ArchivePiece | null;
  /** Whether the shelf facing you carries its directory on the wall (off when the bay is out of view). */
  board: boolean;
  busy: boolean;
  onPick: (p: Picked) => void;
  onMove: (d: number) => void;
  onHover: (piece: ArchivePiece | null) => void;
}

/** The wall: three copies of the shelves in a row on one track, so the carousel can keep
 *  turning. Only the shelf facing you takes focus and speaks to a screen reader; a side shelf
 *  is a target that brings itself to the centre. */
export default function ShelfTrack({
  shelves,
  boxes,
  props,
  pos,
  still,
  away,
  hot,
  board,
  busy,
  onPick,
  onMove,
  onHover,
}: Props) {
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
            {Math.abs(j - pos) <= 1 ? <PlateFlames plate={WALL} salt={j} /> : null}
            {props[s].map((f, k) => (
              <span
                key={k}
                className="lib-prop"
                style={{ left: f.x, top: f.y, width: f.w, height: f.h }}
                aria-hidden="true"
              >
                <FigurePlate id={f.id} decorative />
              </span>
            ))}
            <p className="lib-plaque" style={PLATE.plaque}>
              {shelf.label}
            </p>
            {active && board ? (
              <ShelfDirectory shelf={shelf} index={s} busy={busy} onPick={onPick} onHover={onHover} />
            ) : null}
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
                  data-hot={(active && hot?.slug === p.slug) || undefined}
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
                  {active ? (
                    <span className="bs-tip" aria-hidden="true">
                      {p.title}
                    </span>
                  ) : null}
                </a>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
