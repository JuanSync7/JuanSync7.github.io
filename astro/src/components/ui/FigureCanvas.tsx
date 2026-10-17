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
  /** Handed to the figure each frame (see FrameInput.data). */
  data?: unknown;
  /** Called with the figure's read-out whenever it changes: what is under the pointer. */
  onReadout?: (text: string) => void;
}

/** Mounts one figure from the registry on a canvas that fills its box. The box sets the
 *  size: give the wrapper a height or an aspect-ratio. */
export default function FigureCanvas({ id, className, readout = false, freezeAt, pointerAt, fixtures, data, onReadout }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState('rest');
  const report = (r: string): void => {
    if (readout) setText(r);
    onReadout?.(r);
  };
  const figure = useFigureLoop(ref, { id, freezeAt, pointerAt, fixtures, data, onReadout: report });
  return (
    <div className={`figure-canvas${className ? ` ${className}` : ''}`} data-figure={id} data-style={figure?.style}>
      {/* The canvas is an image only once its figure, and so its alt text, has loaded; until
          then it is hidden from assistive tech rather than an image with no name. */}
      <canvas ref={ref} role={figure ? 'img' : undefined} aria-label={figure?.alt} aria-hidden={figure ? undefined : true} />
      {/* The read-out follows the pointer: a visual aid, not news to announce. */}
      {readout ? (
        <span className="figure-readout" aria-hidden="true">
          {text}
        </span>
      ) : null}
    </div>
  );
}
