import { useId } from 'react';
import { hardwareModel } from '../../figures/kit/hardware/models';
import { hardwareDrawing } from '../../figures/kit/hardware/project';
import { DEFAULT_OPTIONS, type HardwareKind, type HardwareMode, type HardwareView } from '../../figures/kit/hardware/types';
import { HARDWARE_INFO } from '../../data/hardware';

interface Props {
  kind: HardwareKind;
  mode?: HardwareMode;
  view?: HardwareView;
  open?: number;
  pick?: number;
  decorative?: boolean;
  detail?: boolean;
}
/** SVG presentation only. All object geometry and projection live in the figure kit. */
export default function HardwareIcon({ kind, mode = 'isometric', view = 'three-quarter', open = 0, pick = -1, decorative = false, detail = false }: Props) {
  const title = useId();
  const drawing = hardwareDrawing(hardwareModel(kind), { ...DEFAULT_OPTIONS, mode, view, open, pick, detail }, 256, 256);
  return (
    <svg viewBox="0 0 256 256" fill="none" strokeWidth="1" strokeLinejoin="round" strokeLinecap="round"
      width="100%" height="100%" role={decorative ? undefined : 'img'}
      aria-labelledby={decorative ? undefined : title} aria-hidden={decorative || undefined}>
      {!decorative && <title id={title}>{HARDWARE_INFO[kind].title} · {mode}</title>}
      {drawing.paths.map((p, i) => <path key={i} d={p.d} fill={p.fill} stroke={p.stroke} />)}
    </svg>
  );
}
