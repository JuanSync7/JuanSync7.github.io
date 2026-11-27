import { PLATE } from './geometry';
import { plain } from './plain';
import type { ArchivePiece, ArchiveShelf, Picked } from './types';
import './directory.css';

interface Props {
  shelf: ArchiveShelf;
  /** The shelf's place in the archive, for picking one of its binders. */
  index: number;
  /** Off the wall: set in the page under the stage, when the wall bay is out of view (a phone). */
  inline?: boolean;
  busy: boolean;
  onPick: (p: Picked) => void;
  onHover: (piece: ArchivePiece | null) => void;
}

/** The shelf's directory: a board nailed to the wall bay right of the shelf facing you, with
 *  the kind of writing at its head and every binder on the shelf listed under it, newest first.
 *  The list scrolls when a shelf outgrows the board. A row is the binder's link: a plain click
 *  takes the binder off the shelf as picking its spine does, and pointing at a row lifts it. */
export default function ShelfDirectory({ shelf, index, inline = false, busy, onPick, onHover }: Props) {
  const n = shelf.pieces.length;
  return (
    <>
      {inline ? null : <span className="ld-cast" style={PLATE.directory} aria-hidden="true" />}
      <aside
        className="lib-dir"
        data-inline={inline || undefined}
        style={inline ? undefined : PLATE.directory}
        aria-label={`${shelf.label}: directory`}
      >
        {inline ? null : (
          <>
            <span className="ld-nail" aria-hidden="true" />
            <span className="ld-nail ld-nail-r" aria-hidden="true" />
          </>
        )}
        <header className="ld-head">
          <p className="ld-kind">{shelf.label}</p>
          <p className="ld-count">{`${n} ${n === 1 ? 'binder' : 'binders'} · newest first`}</p>
        </header>
        <ol className="ld-list">
          {shelf.pieces.map((p, i) => (
            <li key={p.slug}>
              <a
                className="ld-row"
                href={p.href}
                title={p.title}
                data-latest={p.latest || undefined}
                onClick={(e) => {
                  if (!plain(e) || busy) return;
                  e.preventDefault();
                  onPick({ shelf: index, index: i });
                }}
                onPointerEnter={() => onHover(p)}
                onPointerLeave={() => onHover(null)}
                onFocus={() => onHover(p)}
                onBlur={() => onHover(null)}
              >
                <span className="ld-num">{p.num}</span>
                <span className="ld-title">{p.title}</span>
              </a>
            </li>
          ))}
        </ol>
      </aside>
    </>
  );
}
