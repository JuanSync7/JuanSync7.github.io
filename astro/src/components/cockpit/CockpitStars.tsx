import { useMemo } from 'react';

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
    r: 0.4 + Math.random() * 1.6,
    o: 0.08 + Math.random() * 0.5,
    d: Math.random() * 4,
    dur: 1.5 + Math.random() * 2.5,
  }));
}

interface Props {
  count: number;
}

export default function CockpitStars({ count }: Props) {
  const stars = useMemo(() => makeStars(count), [count]);
  return (
    <div className="cp-stars">
      {stars.map((s, i) => (
        <span
          key={i}
          className="cp-star"
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
