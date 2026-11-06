import { useRef, type PointerEvent } from 'react';
import FigureCanvas from '../ui/FigureCanvas';
import { DEFAULT_VIEW, type VoxelView } from './voxel-view';

interface Props { id: string; aspect: number; view: VoxelView; onView: (view: VoxelView) => void }

export default function VoxelStage({ id, aspect, view, onView }: Props) {
  const drag = useRef<{ id: number; x: number; y: number; turn: number; pitch: number } | null>(null);
  function finish(e: PointerEvent<HTMLDivElement>): void {
    if (drag.current?.id !== e.pointerId) return;
    drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  }
  return (
    <div className="lab-main voxel-stage" style={{ aspectRatio: String(aspect) }} tabIndex={0} role="group" aria-label="Voxel world. Drag to rotate; arrow keys turn and tilt; plus and minus zoom; Home resets."
      onPointerDown={e => {
        if (e.button !== 0 && e.pointerType !== 'touch') return;
        drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, turn: view.turn, pitch: view.pitch };
        e.currentTarget.setPointerCapture(e.pointerId); onView({ ...view, orbit: false });
      }}
      onPointerMove={e => {
        const start = drag.current; if (!start || start.id !== e.pointerId) return;
        const width = e.currentTarget.getBoundingClientRect().width;
        onView({ ...view, orbit: false, turn: start.turn + (e.clientX - start.x) / width * Math.PI * 2, pitch: Math.max(0.28, Math.min(1.2, start.pitch + (e.clientY - start.y) / width * 2)) });
      }}
      onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={() => { drag.current = null; }}
      onKeyDown={e => {
        const delta = e.shiftKey ? 0.3 : 0.12;
        if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(e.key)) e.preventDefault(); else return;
        if (e.key === 'Home') { onView({ ...DEFAULT_VIEW }); return; }
        onView({ ...view, orbit: false,
          turn: view.turn + (e.key === 'ArrowLeft' ? -delta : e.key === 'ArrowRight' ? delta : 0),
          pitch: Math.max(0.28,Math.min(1.2,view.pitch + (e.key === 'ArrowUp' ? delta : e.key === 'ArrowDown' ? -delta : 0))),
          zoom: Math.max(0.75,Math.min(1.4,view.zoom + (['+','='].includes(e.key) ? .05 : e.key === '-' ? -.05 : 0))),
        });
      }}>
      <FigureCanvas key={id} id={id} data={view} />
    </div>
  );
}
