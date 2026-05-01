import { useMemo } from 'react';
import { makeNebulaStars } from './terminal-data';

export default function TerminalNebula() {
  const stars = useMemo(() => makeNebulaStars(120), []);
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
