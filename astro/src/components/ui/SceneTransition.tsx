import { useMemo, type CSSProperties, type ReactNode } from 'react';

type SceneColor = 'green' | 'navy' | 'purple' | 'dark';

interface Props {
  from: SceneColor;
  to: SceneColor;
  children?: ReactNode;
}

const GRADIENTS: Record<string, string> = {
  'green-navy': 'var(--hf-grad-scene-green-navy)',
  'navy-green': 'var(--hf-grad-scene-navy-green)',
  'green-purple': 'var(--hf-grad-scene-green-purple)',
  'purple-dark': 'var(--hf-grad-scene-purple-dark)',
};

const DOT_COLOR: Partial<Record<SceneColor, string>> = {
  purple: 'var(--hf-dot-purple)',
  navy: 'var(--hf-dot-navy)',
  green: 'var(--hf-dot-green)',
};

interface DotStyle extends CSSProperties {
  '--dot-color'?: string;
}

export default function SceneTransition({ from, to, children }: Props) {
  const key = `${from}-${to}`;
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

  const dotColor = DOT_COLOR[to] ?? 'var(--hf-dot-green)';

  return (
    <div className="hf-scene-trans" style={{ background: GRADIENTS[key] ?? GRADIENTS['green-navy'] }}>
      <div className="hf-trans-noise">
        {dots.map((d, i) => {
          const style: DotStyle = {
            left: `${d.x}%`,
            top: `${d.y}%`,
            opacity: d.o,
            animationDelay: `${d.d}s`,
            width: `${d.s}px`,
            height: `${d.s}px`,
            '--dot-color': dotColor,
          };
          return <span key={i} className="hf-trans-dot" style={style} />;
        })}
      </div>
      {children && <div className="hf-trans-text">{children}</div>}
    </div>
  );
}
