import type { ArchiveShelf } from './types';

interface Props {
  shelves: readonly ArchiveShelf[];
  current: number;
  busy: boolean;
  onGo: (shelf: number) => void;
  onMove: (d: number) => void;
}

/** The shelf names across the top, with the arrows either side: a name brings its shelf to the
 *  centre the short way round, an arrow turns the wall one shelf. */
export default function ShelfBar({ shelves, current, busy, onGo, onMove }: Props) {
  return (
    <nav className="lib-bar" aria-label="Shelves">
      <button
        type="button"
        className="lib-arrow"
        aria-label="Previous shelf"
        disabled={busy}
        onClick={() => onMove(-1)}
      >
        ←
      </button>
      <div className="lib-names">
        {shelves.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className="pill"
            aria-pressed={i === current}
            disabled={busy}
            onClick={() => onGo(i)}
          >
            {s.label}
            <span className="pill-count">{s.pieces.length}</span>
          </button>
        ))}
      </div>
      <button type="button" className="lib-arrow" aria-label="Next shelf" disabled={busy} onClick={() => onMove(1)}>
        →
      </button>
    </nav>
  );
}
