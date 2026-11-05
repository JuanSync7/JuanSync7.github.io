import type { HardwareMode, HardwareView } from '../../figures/kit/hardware/types';

interface Props {
  mode: HardwareMode;
  view: HardwareView;
  open: boolean;
  onMode(mode: HardwareMode): void;
  onView(view: HardwareView): void;
  onOpen(): void;
}
export default function AtlasControls({ mode, view, open, onMode, onView, onOpen }: Props) {
  return (
    <div className="atlas-controls">
      <fieldset>
        <legend>Drawing</legend>
        <div className="atlas-segments">
          {(['isometric', 'wireframe'] as const).map((value) => (
            <button key={value} type="button" aria-pressed={value === mode} onClick={() => onMode(value)}>{value}</button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Camera</legend>
        <div className="atlas-segments">
          {([['three-quarter', '¾ view'], ['front', 'front'], ['plan', 'above']] as const).map(([value, title]) => (
            <button key={value} type="button" aria-pressed={value === view} onClick={() => onView(value)}>{title}</button>
          ))}
        </div>
      </fieldset>
      <button className="atlas-action" type="button" aria-pressed={open} onClick={onOpen}>{open ? 'Assemble ↘' : 'Take apart ↗'}</button>
    </div>
  );
}
