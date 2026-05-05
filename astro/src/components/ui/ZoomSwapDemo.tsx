import { useEffect, useRef, useState } from 'react';
import './zoom-swap.css';

const SLIDES = [
  { tag: '01', title: 'overview',    body: 'live vitals + skill mix' },
  { tag: '02', title: 'asic.core',   body: 'rtl · verification · pd' },
  { tag: '03', title: 'ai.pipeline', body: 'training · inference · ops' },
  { tag: '04', title: 'eda.tool',    body: 'flow scripts · automation' },
];

type Phase = 'idle' | 'out' | 'in';

export default function ZoomSwapDemo() {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const goTo = (next: number) => {
    if (next === idx || phase !== 'idle') return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase('out');
    // Demo has no real scroll target — the brief pause between out/in
    // mirrors the time the cockpit spends scrolling into view.
    timers.current.push(setTimeout(() => {
      setIdx(next);
      setPhase('in');
    }, 700));
    timers.current.push(setTimeout(() => setPhase('idle'), 1080));
  };

  const slide = SLIDES[idx];

  return (
    <div className="zsd-wrap">
      <div className={`zsd-panel${phase !== 'idle' ? ` zsd-panel-${phase}` : ''}`}>
        <div className="zsd-hdr">
          <div className="zsd-arr" onClick={() => goTo((idx - 1 + SLIDES.length) % SLIDES.length)}>◀</div>
          <div className="zsd-title">// {slide.title}</div>
          <div className="zsd-arr" onClick={() => goTo((idx + 1) % SLIDES.length)}>▶</div>
        </div>
        <div className="zsd-page">
          <div className="zsd-tag">{slide.tag}</div>
          <div className="zsd-body">{slide.body}</div>
        </div>
        <div className="zsd-dots">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`zsd-dot${i === idx ? ' zsd-dot-on' : ''}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
