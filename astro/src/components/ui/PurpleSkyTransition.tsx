import { useMemo, useRef } from 'react';
import { useInView } from '@/hooks/useInView';

export default function PurpleSkyTransition() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, '300px 0px');

  const stars = useMemo(
    () =>
      Array.from({ length: 120 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        r: 0.5 + Math.random() * 1.5,
        o: 0.1 + Math.random() * 0.6,
        d: Math.random() * 4,
        dur: 1.5 + Math.random() * 2.5,
      })),
    [],
  );

  return (
    <div className="hf-purple-sky" ref={ref}>
      {inView && (
        <div className="hf-purple-sky-stars">
          {stars.map((s, i) => (
            <span
              key={i}
              className="hf-purple-sky-star"
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
      )}
    </div>
  );
}
