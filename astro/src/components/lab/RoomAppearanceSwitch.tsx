import type { RoomAppearance } from '../../figures/kit/roomstyles';
interface Props {
  value: RoomAppearance;
  onChange: (value: RoomAppearance) => void;
}
export default function RoomAppearanceSwitch({ value, onChange }: Props) {
  return (
    <div className="room-presets" role="group" aria-label="Room appearance">
      <button
        type="button"
        className="lab-btn"
        aria-pressed={value === 'monochrome'}
        onClick={() => onChange('monochrome')}
      >
        Monochrome
      </button>
      <button type="button" className="lab-btn" aria-pressed={value === 'colour'} onClick={() => onChange('colour')}>
        Full colour
      </button>
    </div>
  );
}
