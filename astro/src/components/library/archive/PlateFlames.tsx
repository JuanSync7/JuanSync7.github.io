import FigureCanvas from '../../ui/FigureCanvas';
import type { Plate } from '../../../figures/plates/registry';
import { flames } from './geometry';

interface Props {
  plate: Plate;
  /** Mixed into each flame's seed, so the same candle on two copies of a plate differs too. */
  salt: number;
}

/** Live pixel flames on a baked plate's candles, placed by its `flames` anchors: each one a
 *  little larger than the drawn flame, so the live one covers it, and seeded apart, so candles
 *  side by side do not flicker together. Decoration: hidden from screen readers. */
export default function PlateFlames({ plate, salt }: Props) {
  return (
    <>
      {flames(plate).map((f) => (
        <span
          key={f.key}
          className="lib-flame"
          style={{ left: f.x, top: f.y, width: f.w, height: f.h }}
          aria-hidden="true"
        >
          <FigureCanvas id="pixel-flame" data={{ seed: salt * 7 + f.key * 3 + 1 }} />
        </span>
      ))}
    </>
  );
}
