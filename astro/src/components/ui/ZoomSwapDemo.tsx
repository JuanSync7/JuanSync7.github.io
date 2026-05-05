import { useEffect, useRef, useState } from 'react';
import './zoom-swap.css';

const SLIDES = [
  { tag: '01', title: 'overview',    body: 'live vitals + skill mix' },
  { tag: '02', title: 'asic.core',   body: 'rtl · verification · pd' },
  { tag: '03', title: 'ai.pipeline', body: 'training · inference · ops' },
  { tag: '04', title: 'eda.tool',    body: 'flow scripts · automation' },
];

type Phase = 'idle' | 'out' | 'in';

const HOLD_MS = 1400;   // dwell on a slide before starting the next transition
const OUT_MS  = 700;    // out + scroll-pause window before the swap
const IN_MS   = 380;    // in animation duration

export default function ZoomSwapDemo() {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const idxRef = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => { idxRef.current = idx; }, [idx]);

  // Auto-cycle: idle (HOLD) → out (OUT) → swap + in (IN) → idle …
  useEffect(() => {
    let cancelled = false;

    const cycle = () => {
      if (cancelled) return;
      timers.current.push(setTimeout(() => {
        if (cancelled) return;
        setPhase('out');
        timers.current.push(setTimeout(() => {
          if (cancelled) return;
          const next = (idxRef.current + 1) % SLIDES.length;
          setIdx(next);
          setPhase('in');
          timers.current.push(setTimeout(() => {
            if (cancelled) return;
            setPhase('idle');
            cycle();
          }, IN_MS));
        }, OUT_MS));
      }, HOLD_MS));
    };

    cycle();
    return () => {
      cancelled = true;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  const slide = SLIDES[idx];

  return (
    <div className="zsd-wrap">
      <div className={`zsd-panel${phase !== 'idle' ? ` zsd-panel-${phase}` : ''}`}>
        <div className="zsd-hdr">
          <div className="zsd-title">// {slide.title}</div>
          <div className="zsd-auto">auto</div>
        </div>
        <div className="zsd-page">
          <div className="zsd-tag">{slide.tag}</div>
          <div className="zsd-body">{slide.body}</div>
        </div>
        <div className="zsd-dots">
          {SLIDES.map((_, i) => (
            <span key={i} className={`zsd-dot${i === idx ? ' zsd-dot-on' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
