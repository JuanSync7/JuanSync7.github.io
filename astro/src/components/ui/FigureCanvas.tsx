import { useRef, useState } from 'react';
import { useFigureLoop } from '../../hooks/useFigureLoop';
import './figure-canvas.css';

interface Props {
  /** The figure's id: its file name in src/figures. */
  id: string;
  className?: string;
  /** Show the figure's read-out (what is under the pointer) in the corner. */
  readout?: boolean;
  /** Freeze at this time in seconds: the audit's deterministic captures. */
  freezeAt?: number;
  /** Hold the pointer here, as fractions of the canvas, for frozen captures. */
  pointerAt?: readonly [number, number];
  /** Also find the audit's deliberately broken fixtures. */
  fixtures?: boolean;
}

/** Mounts one figure from the registry on a canvas that fills its box. The box sets the
 *  size: give the wrapper a height or an aspect-ratio. */
export default function FigureCanvas({ id, className, readout = false, freezeAt, pointerAt, fixtures }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState('rest');
  const figure = useFigureLoop(ref, { id, freezeAt, pointerAt, fixtures, onReadout: readout ? setText : undefined });
  return (
    <div className={`figure-canvas${className ? ` ${className}` : ''}`} data-figure={id} data-style={figure?.style}>
      <canvas ref={ref} role="img" aria-label={figure?.alt ?? ''} />
      {readout ? (
        <span className="figure-readout" aria-live="polite">
          {text}
        </span>
      ) : null}
    </div>
  );
}
