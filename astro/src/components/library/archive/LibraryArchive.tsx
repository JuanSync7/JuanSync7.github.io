import { useEffect, useRef, useState, type CSSProperties } from 'react';
import ArchiveSheet from './ArchiveSheet';
import BinderFlight from './BinderFlight';
import DeskBinder from './DeskBinder';
import ShelfBar from './ShelfBar';
import ShelfTrack from './ShelfTrack';
import FigurePlate from '../../ui/FigurePlate';
import { DESK, PLATE, WALL, readMetrics, shelve, type Metrics } from './geometry';
import { IN_AIR, ON_DESK, SHEET_OUT, type ArchivePiece, type ArchiveShelf } from './types';
import { useArchive } from './useArchive';
import { useStageFit } from './useStageFit';
import '../../writing/post-grid.css';
import './archive.css';
import './binder.css';
import './sheet.css';

interface Props {
  shelves: ArchiveShelf[];
}

/** The stage is laid out in the plates' own units, so their sizes come from their manifests. */
const sizes = {
  ['--lib-unit' as string]: `${WALL.size[0]}px`,
  ['--lib-wall-h' as string]: `${WALL.size[1]}px`,
  ['--lib-desk-w' as string]: `${DESK.size[0]}px`,
  ['--lib-desk-h' as string]: `${DESK.size[1]}px`,
} as CSSProperties;
const spot: CSSProperties = {
  left: PLATE.deskSpot - PLATE.depth / 2,
  top: PLATE.deskTop - PLATE.spotH,
  width: PLATE.depth,
  height: PLATE.spotH,
};

/** The library as an archive: a wall of binder shelves, one shelf per kind of writing, turned
 *  like a carousel from the names above it, and a desk below. Picking a binder takes it off the
 *  shelf and lays it on the desk, where it opens and its paper comes out: the piece's cover on
 *  the left, what it is on the right, and the way in. Every binder is a real link, so without
 *  script (or with a modifier key) it simply goes to the piece. */
export default function LibraryArchive({ shelves }: Props) {
  const box = useRef<HTMLDivElement | null>(null);
  const desk = useRef<HTMLDivElement | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const last = useRef<string | null>(null);
  const [m, setM] = useState<Metrics | null>(null);
  const [hover, setHover] = useState<ArchivePiece | null>(null);
  const [sheetEnd, setSheetEnd] = useState(0);
  const fit = useStageFit(box);
  const a = useArchive(shelves.length, box);
  const boxes = shelves.map((s) => shelve(s.pieces.length));
  const shelf = shelves[a.shelf];
  const sel = a.picked
    ? { piece: shelves[a.picked.shelf].pieces[a.picked.index], box: boxes[a.picked.shelf][a.picked.index] }
    : null;

  useEffect(() => {
    if (box.current) setM(readMetrics(box.current));
  }, []);

  // Keep the eye and the keyboard with the binder: the desk comes into view as it flies, the
  // paper's title takes focus once it is open, and focus goes back to the binder on its shelf.
  useEffect(() => {
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (a.phase === 'fly' || (a.phase === 'show' && !smooth))
      desk.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' });
    if (a.phase === 'show') heading.current?.focus({ preventScroll: true });
    if (a.phase === 'return') box.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (a.picked) last.current = `${a.picked.shelf}-${a.picked.index}`;
    if (a.phase === 'idle' && last.current) {
      box.current?.querySelector<HTMLElement>(`[data-binder="${last.current}"]`)?.focus({ preventScroll: !smooth });
      last.current = null;
    }
  }, [a.phase, a.picked]);

  useEffect(() => {
    if (a.phase !== 'show') return undefined;
    const esc = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') a.close();
    };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [a]);

  const view = fit.width / fit.k;
  const caption = hover
    ? `// ${hover.num} · ${hover.title}`
    : `// ${shelf.label} · ${shelf.pieces.length} binders · pick one`;
  const vars = {
    ['--k' as string]: fit.k,
    minHeight: sel && SHEET_OUT.includes(a.phase) ? sheetEnd : undefined,
  } as CSSProperties;

  return (
    <div className="lib-archive" style={sizes}>
      <ShelfBar shelves={shelves} current={a.shelf} busy={a.phase !== 'idle'} onGo={a.goTo} onMove={a.move} />
      <p className="lib-sr" aria-live="polite">
        {`${shelf.label} shelf, ${shelf.pieces.length} pieces`}
      </p>
      <div ref={box} className="lib-box" style={vars}>
        <div className="lib-stage">
          <div className="lib-wall">
            <ShelfTrack
              shelves={shelves}
              boxes={boxes}
              pos={a.pos}
              still={a.still}
              away={a.phase === 'idle' ? null : a.picked}
              onPick={a.pick}
              onMove={a.move}
              onHover={setHover}
            />
            <span className="lib-fade" aria-hidden="true" />
            <span className="lib-fade lib-fade-end" aria-hidden="true" />
          </div>
          <div ref={desk} className="lib-desk">
            <div className="lib-desk-art">
              <FigurePlate id="library-desk" decorative />
              {a.phase === 'idle' ? <span className="lib-spot" style={spot} aria-hidden="true" /> : null}
              {sel && ON_DESK.includes(a.phase) ? <DeskBinder box={sel.box} phase={a.phase} /> : null}
            </div>
          </div>
          {sel && m && IN_AIR.includes(a.phase) ? (
            <BinderFlight
              piece={sel.piece}
              box={sel.box}
              phase={a.phase}
              view={view}
              unit={m.unit}
              wallH={m.wallH}
              band={m.band}
            />
          ) : null}
        </div>
        <p className="lib-band">{caption}</p>
        {sel && m && fit.width > 0 && SHEET_OUT.includes(a.phase) ? (
          <ArchiveSheet
            piece={sel.piece}
            shelf={shelves[a.picked?.shelf ?? 0].label}
            phase={a.phase}
            width={fit.width}
            k={fit.k}
            wallH={m.wallH}
            band={m.band}
            sheetW={m.sheetW}
            thick={sel.box.w}
            heading={heading}
            onHeight={setSheetEnd}
            onClose={a.close}
          />
        ) : null}
      </div>
    </div>
  );
}
