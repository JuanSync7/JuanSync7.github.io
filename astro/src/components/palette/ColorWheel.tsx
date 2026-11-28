import { useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { hslToRgb, rgbToHsl, type Rgba } from '../../lib/palette/color';
import { fromWheel, wheel, wheelSpot } from '../../lib/palette/paint';

interface Props {
  color: Rgba;
  label: string;
  onPick: (c: Rgba) => void;
}

/** A hue and saturation wheel at the colour's own lightness. Drag on it, or use the arrow keys:
 *  left and right turn the hue, up and down the saturation. */
export default function ColorWheel({ color, label, onPick }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const hsl = rgbToHsl(color);

  const pickAt = (e: PointerEvent<HTMLDivElement>): void => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    const { h, s } = fromWheel((e.clientX - box.left) / box.width, (e.clientY - box.top) / box.height);
    onPick(hslToRgb({ h, s, l: hsl.l }, color.a));
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>): void => {
    const step = e.shiftKey ? 10 : 2;
    const next = { ...hsl };
    if (e.key === 'ArrowLeft') next.h -= step;
    else if (e.key === 'ArrowRight') next.h += step;
    else if (e.key === 'ArrowUp') next.s = Math.min(100, next.s + step);
    else if (e.key === 'ArrowDown') next.s = Math.max(0, next.s - step);
    else return;
    e.preventDefault();
    onPick(hslToRgb(next, color.a));
  };

  return (
    <div
      ref={ref}
      className="pal-wheel"
      style={{ background: wheel(color) }}
      role="slider"
      tabIndex={0}
      aria-label={`${label}: hue and saturation wheel`}
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={Math.round(hsl.h)}
      aria-valuetext={`hue ${Math.round(hsl.h)}°, saturation ${Math.round(hsl.s)}%`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        pickAt(e);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) pickAt(e);
      }}
      onKeyDown={onKey}
    >
      <span className="pal-wheel-spot" style={wheelSpot(color)} aria-hidden="true" />
    </div>
  );
}
