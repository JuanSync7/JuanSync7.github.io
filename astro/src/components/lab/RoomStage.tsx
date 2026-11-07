import { useId, useRef, useState, type PointerEvent } from 'react';
import FigureCanvas from '../ui/FigureCanvas';
import RoomAppearanceSwitch from './RoomAppearanceSwitch';
import type { RoomAppearance } from '../../figures/kit/roomstyles';
import './room-stage.css';

interface Props {
  id: string;
  aspect: number;
}
const clampAngle = (angle: number): number => Math.max(0, Math.min(180, Math.round(angle)));

export default function RoomStage({ id, aspect }: Props) {
  const [appearance, setAppearance] = useState<RoomAppearance>('colour');
  const [angle, setAngle] = useState(90);
  const [view, setView] = useState<'eye' | 'isometric'>('eye');
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ id: number; x: number; y: number; angle: number } | null>(null);
  const rangeId = useId();
  const stop = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    drag.current = null;
    setDragging(false);
  };
  const preset = (mode: 'eye' | 'isometric'): void => {
    setView(mode);
    setAngle(mode === 'isometric' ? 135 : 90);
    setZoom(1);
  };
  return (
    <div className="room-viewer">
      <div
        className="lab-main room-stage"
        style={{ aspectRatio: aspect }}
        role="group"
        aria-label="Room view. Drag horizontally or use the left and right arrow keys to rotate."
        tabIndex={0}
        data-dragging={dragging}
        onPointerDown={(event) => {
          if (event.button === 0) drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, angle };
        }}
        onPointerMove={(event) => {
          const start = drag.current;
          if (!start || start.id !== event.pointerId) return;
          const dx = event.clientX - start.x,
            dy = event.clientY - start.y;
          if (!dragging && (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(dy))) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
          setAngle(clampAngle(start.angle - (dx / Math.max(1, event.currentTarget.clientWidth)) * 180));
        }}
        onPointerUp={stop}
        onPointerCancel={stop}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            setAngle((a) => clampAngle(a + (event.key === 'ArrowLeft' ? -5 : 5)));
          }
          if (event.key === 'Home') {
            event.preventDefault();
            preset(view);
          }
        }}
      >
        <FigureCanvas key={id} id={id} data={{ angle, view, zoom, appearance }} />
      </div>
      <div className="room-toolbar">
        <RoomAppearanceSwitch value={appearance} onChange={setAppearance} />
        <label className="room-orbit" htmlFor={rangeId}>
          <span>View angle</span>
          <input
            id={rangeId}
            type="range"
            min={0}
            max={180}
            step={1}
            value={angle}
            onChange={(event) => setAngle(Number(event.target.value))}
            aria-valuetext={
              angle === 90 ? '90 degrees, front view' : `${angle} degrees, ${angle < 90 ? 'left' : 'right'} side`
            }
          />
          <output htmlFor={rangeId}>{angle}°</output>
        </label>
        <div className="room-presets" role="group" aria-label="Camera projection">
          <button className="lab-btn" type="button" aria-pressed={view === 'eye'} onClick={() => preset('eye')}>
            Eye level
          </button>
          <button
            className="lab-btn"
            type="button"
            aria-pressed={view === 'isometric'}
            onClick={() => preset('isometric')}
          >
            Isometric
          </button>
        </div>
        <div className="room-presets" role="group" aria-label="Camera zoom">
          <button
            className="lab-btn"
            type="button"
            aria-label="Zoom out"
            disabled={zoom <= 0.8}
            onClick={() => setZoom((z) => Math.max(0.8, z - 0.1))}
          >
            −
          </button>
          <button
            className="lab-btn"
            type="button"
            aria-label="Zoom in"
            disabled={zoom >= 1.6}
            onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))}
          >
            +
          </button>
          <button className="lab-btn" type="button" onClick={() => preset(view)}>
            Reset view
          </button>
        </div>
      </div>
      <p className="room-help">Drag to explore · 0° left entrance · 90° front · 180° right entrance</p>
    </div>
  );
}
