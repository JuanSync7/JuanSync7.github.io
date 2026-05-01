interface Props {
  value: number;
  max?: number;
  color?: string;
  segments?: number;
}

export default function SegmentedBar({ value, max = 100, color = 'var(--hf-accent)', segments = 20 }: Props) {
  const filled = Math.round((value / max) * segments);
  return (
    <div className="hf-seg-bar">
      {Array.from({ length: segments }, (_, i) => (
        <span
          key={i}
          className={`hf-seg ${i < filled ? 'hf-seg-on' : ''}`}
          style={i < filled ? { background: color } : undefined}
        />
      ))}
    </div>
  );
}
