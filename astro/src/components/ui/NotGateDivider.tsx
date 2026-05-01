interface Props {
  label: string;
}

function GateSvg({ flip = false }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 60 30" className={`hf-notgate-svg${flip ? ' hf-notgate-flip' : ''}`}>
      <polygon points="8,4 42,15 8,26" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="46" cy="15" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="0" y1="15" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5" />
      <line x1="50" y1="15" x2="60" y2="15" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default function NotGateDivider({ label }: Props) {
  return (
    <div className="hf-notgate">
      <GateSvg />
      <span className="hf-notgate-lbl">{label}</span>
      <GateSvg flip />
    </div>
  );
}
