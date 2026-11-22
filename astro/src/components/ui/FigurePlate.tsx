import type { CSSProperties, ReactNode } from 'react';
import { plate, plateImage } from '../../figures/plates/registry';
import './figure-plate.css';

interface Props {
  /** A baked figure's id: its manifest is src/figures/plates/<id>.json. */
  id: string;
  /** A backdrop that only sets the scene says nothing to a screen reader. */
  decorative?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Live parts laid on the drawing (DOM, or a live figure), placed by the plate's anchors. */
  children?: ReactNode;
}

/** Shows a baked figure: the plate for the page's theme at the screen's resolution, filling its
 *  host. The host gives it its size; the plate's own size and anchors are in its manifest. */
export default function FigurePlate({ id, decorative = false, className, style, children }: Props) {
  const p = plate(id);
  const vars = {
    ...style,
    ['--plate-light' as string]: plateImage(p.sources.light),
    ['--plate-dark' as string]: plateImage(p.sources.dark),
  } as CSSProperties;
  return (
    <span
      className={className ? `figure-plate ${className}` : 'figure-plate'}
      style={vars}
      data-plate={p.id}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : p.alt}
      aria-hidden={decorative || undefined}
    >
      {children}
    </span>
  );
}
