import { useMemo } from 'react';

interface Props {
  count?: number;
}

interface Star {
  x: number;
  y: number;
  r: number;
  o: number;
  d: number;
  dur: number;
}

function makeStars(count: number): Star[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    r: 0.3 + Math.random() * 1.4,
    o: 0.06 + Math.random() * 0.4,
    d: Math.random() * 5,
    dur: 1.5 + Math.random() * 2.5,
  }));
}

export default function NebulaStars({ count = 120 }: Props) {
  const stars = useMemo(() => makeStars(count), [count]);
  return (
    <div className="hf-term-nebula">
      {stars.map((s, i) => (
        <span
          key={i}
          className="hf-term-nebula-star"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.r}px`,
            height: `${s.r}px`,
            opacity: s.o,
            animationDelay: `${s.d}s`,
            animationDuration: `${s.dur}s`,
          }}
        />
      ))}
    </div>
  );
}
