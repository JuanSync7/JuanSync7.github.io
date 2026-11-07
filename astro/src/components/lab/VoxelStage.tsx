import { useRef, type PointerEvent } from 'react';
import FigureCanvas from '../ui/FigureCanvas';
import type { WorldInfo } from '../../figures/kit/voxel-world/ecology-types';
import { DEFAULT_VIEW, type VoxelView } from './voxel-view';

interface Props {
  id: string;
  aspect: number;
  view: VoxelView;
  onView: (view: VoxelView) => void;
  onWorldInfo: (info: WorldInfo) => void;
}
type Touch = { x: number; y: number };
type Gesture = { view: VoxelView; x: number; y: number; distance: number; pan: boolean };
const clamp = (n: number, min: number, max: number): number => Math.max(min, Math.min(max, n));

export default function VoxelStage({ id, aspect, view, onView, onWorldInfo }: Props) {
  const pointers = useRef(new Map<number, Touch>()),
    start = useRef<Gesture | null>(null);
  function sample(): { x: number; y: number; distance: number } {
    const points = [...pointers.current.values()],
      a = points[0] ?? { x: 0, y: 0 },
      b = points[1] ?? a;
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, distance: Math.hypot(a.x - b.x, a.y - b.y) };
  }
  function finish(e: PointerEvent<HTMLDivElement>): void {
    pointers.current.delete(e.pointerId);
    start.current = pointers.current.size ? { ...sample(), view, pan: false } : null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  }
  return (
    <div
      className="lab-main voxel-stage"
      style={{ aspectRatio: String(aspect) }}
      tabIndex={0}
      role="group"
      aria-label="Voxel world. Drag to rotate. Shift-drag or two fingers to pan. Pinch or plus and minus to zoom. Arrow keys turn and tilt, Shift-arrows pan, Home resets."
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        if (e.button !== 0 && e.button !== 2 && e.pointerType !== 'touch') return;
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        start.current = { ...sample(), view, pan: e.shiftKey || e.button === 2 };
        e.currentTarget.setPointerCapture(e.pointerId);
        onView({ ...view, orbit: false });
      }}
      onPointerMove={(e) => {
        if (!pointers.current.has(e.pointerId) || !start.current) return;
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const initial = start.current,
          current = sample(),
          width = e.currentTarget.getBoundingClientRect().width;
        const dx = (current.x - initial.x) / width,
          dy = (current.y - initial.y) / width;
        if (initial.pan || pointers.current.size > 1) {
          onView({
            ...view,
            orbit: false,
            panX: clamp(initial.view.panX - (dx * 2) / view.zoom, -1, 1),
            panY: clamp(initial.view.panY - (dy * 2) / view.zoom, -1, 1),
            zoom:
              initial.distance > 0
                ? clamp((initial.view.zoom * current.distance) / initial.distance, 0.75, 3.5)
                : view.zoom,
          });
        } else
          onView({
            ...view,
            orbit: false,
            turn: initial.view.turn + dx * Math.PI * 2,
            pitch: clamp(initial.view.pitch + dy * 2, 0.28, 1.2),
          });
      }}
      onPointerUp={finish}
      onPointerCancel={finish}
      onLostPointerCapture={(e) => {
        pointers.current.delete(e.pointerId);
        if (!pointers.current.size) start.current = null;
      }}
      onKeyDown={(e) => {
        const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', 'Home'];
        if (!keys.includes(e.key)) return;
        e.preventDefault();
        if (e.key === 'Home') {
          onView({ ...DEFAULT_VIEW });
          return;
        }
        const horizontal = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0,
          vertical = e.key === 'ArrowUp' ? 1 : e.key === 'ArrowDown' ? -1 : 0;
        onView({
          ...view,
          orbit: false,
          turn: view.turn + (e.shiftKey ? 0 : horizontal * 0.12),
          pitch: clamp(view.pitch + (e.shiftKey ? 0 : vertical * 0.12), 0.28, 1.2),
          panX: clamp(view.panX + (e.shiftKey ? (horizontal * 0.1) / view.zoom : 0), -1, 1),
          panY: clamp(view.panY + (e.shiftKey ? (vertical * 0.1) / view.zoom : 0), -1, 1),
          zoom: clamp(view.zoom + (['+', '='].includes(e.key) ? 0.15 : e.key === '-' ? -0.15 : 0), 0.75, 3.5),
        });
      }}
    >
      <FigureCanvas key={id} id={id} data={{ ...view, onWorldInfo }} />
    </div>
  );
}
