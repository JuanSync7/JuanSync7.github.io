import type { HardwareMode, HardwareView } from '../../figures/kit/hardware/types';

interface Props {
  mode: HardwareMode;
  view: HardwareView;
  open: boolean;
  detail: boolean;
  isolate: boolean;
  onDetail(): void;
  onIsolate(): void;
  onMode(mode: HardwareMode): void;
  onView(view: HardwareView): void;
  onOpen(): void;
}
export default function AtlasControls({ mode, view, open, detail, isolate, onMode, onView, onOpen, onDetail, onIsolate }: Props) {
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
      <fieldset>
        <legend>Detail</legend>
        <div className="atlas-segments">
          <button type="button" aria-pressed={!detail} onClick={() => { if (detail) onDetail(); }}>icon</button>
          <button type="button" aria-pressed={detail} onClick={() => { if (!detail) onDetail(); }}>engineering</button>
        </div>
      </fieldset>
      <button className="atlas-action" type="button" aria-pressed={isolate} onClick={onIsolate}>{isolate ? 'View assembly ↙' : 'Isolate part ↗'}</button>
      <button className="atlas-action" type="button" aria-pressed={open} onClick={onOpen}>{open ? 'Assemble ↘' : 'Take apart ↗'}</button>
    </div>
  );
}
