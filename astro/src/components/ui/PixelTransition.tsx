interface Props {
  variant?: number;
}

export default function PixelTransition({ variant = 0 }: Props) {
  return (
    <div className="hf-pixel-trans" data-variant={variant}>
      <div className="hf-pixel-row">
        {Array.from({ length: 48 }, (_, i) => (
          <span
            key={i}
            className="hf-pixel"
            style={{ animationDelay: `${Math.random() * 0.4}s` }}
          />
        ))}
      </div>
    </div>
  );
}
