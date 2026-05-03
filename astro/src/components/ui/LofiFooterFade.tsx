import { useMemo, type CSSProperties } from 'react';

interface DotStyle extends CSSProperties {
  '--dot-color'?: string;
}

export default function LofiFooterFade() {
  const dots = useMemo(
    () =>
      Array.from({ length: 80 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        o: Math.random() * 0.35 + 0.05,
        d: Math.random() * 3,
        s: 2 + Math.random() * 2,
      })),
    [],
  );

  return (
    <div className="hf-scene-trans hf-fade-lofi-footer">
      <div className="hf-trans-noise">
        {dots.map((d, i) => {
          const style: DotStyle = {
            left: `${d.x}%`,
            top: `${d.y}%`,
            opacity: d.o,
            animationDelay: `${d.d}s`,
            width: `${d.s}px`,
            height: `${d.s}px`,
            '--dot-color': 'var(--hf-dot-green)',
          };
          return <span key={i} className="hf-trans-dot" style={style} />;
        })}
      </div>
    </div>
  );
}
