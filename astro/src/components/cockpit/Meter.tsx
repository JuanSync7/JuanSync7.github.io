interface Props {
  label: string;
  value: number;
  displayVal: string;
  color: string;
}

export default function Meter({ label, value, displayVal, color }: Props) {
  return (
    <div className="cp-meter">
      <div className="cp-meter-lbl">{label}</div>
      <div className="cp-meter-bar">
        <div className="cp-meter-fill" style={{ width: `${value}%`, background: color }} />
      </div>
      <div className="cp-meter-val" style={{ color }}>{displayVal}</div>
    </div>
  );
}
