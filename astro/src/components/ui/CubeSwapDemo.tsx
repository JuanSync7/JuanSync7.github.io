import { useEffect, useRef, useState } from 'react';
import './cube-swap.css';

const FACES = [
  { tag: '01', title: 'overview',    body: 'live vitals + skill mix' },
  { tag: '02', title: 'asic.core',   body: 'rtl · verification · pd' },
  { tag: '03', title: 'ai.pipeline', body: 'training · inference · ops' },
  { tag: '04', title: 'eda.tool',    body: 'flow scripts · automation' },
];

interface Cube { from: number; to: number; dir: 'left' | 'right'; }

const HOLD_MS = 1600;   // dwell on a face before kicking off the next rotation
const ROT_MS  = 620;    // rotation duration (matches keyframe + a small buffer)

export default function CubeSwapDemo() {
  const [idx, setIdx] = useState(0);
  const [cube, setCube] = useState<Cube | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const idxRef = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => { idxRef.current = idx; }, [idx]);

  // Keep --csd-d (half panel width) in sync so cube faces stay tangent.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const apply = () => {
      const w = el.getBoundingClientRect().width;
      el.style.setProperty('--csd-d', `${w / 2}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Auto-cycle: idle (HOLD) → rotate to next face (ROT) → swap + idle …
  useEffect(() => {
    let cancelled = false;

    const cycle = () => {
      if (cancelled) return;
      timers.current.push(setTimeout(() => {
        if (cancelled) return;
        const from = idxRef.current;
        const to = (from + 1) % FACES.length;
        setCube({ from, to, dir: 'right' });
        timers.current.push(setTimeout(() => {
          if (cancelled) return;
          setIdx(to);
          setCube(null);
          cycle();
        }, ROT_MS));
      }, HOLD_MS));
    };

    cycle();
    return () => {
      cancelled = true;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  const faceClass = (i: number) => {
    if (cube) {
      if (i === cube.from) return 'csd-face csd-face-front';
      if (i === cube.to) return `csd-face csd-face-${cube.dir === 'right' ? 'right' : 'left'}`;
      return 'csd-face csd-face-hidden';
    }
    return i === idx ? 'csd-face csd-face-active' : 'csd-face csd-face-hidden';
  };

  const cur = FACES[idx];

  return (
    <div className="csd-wrap">
      <div className="csd-hdr">
        <div className="csd-title">// {cur.title}</div>
        <div className="csd-auto">auto</div>
      </div>

      <div ref={stageRef} className="csd-stage">
        <div className={`csd-rotor${cube ? ` csd-rotor-${cube.dir}` : ''}`}>
          {FACES.map((f, i) => (
            <div key={i} className={faceClass(i)}>
              <div className="csd-tag">{f.tag}</div>
              <div className="csd-body">{f.body}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="csd-dots">
        {FACES.map((_, i) => (
          <span key={i} className={`csd-dot${i === idx ? ' csd-dot-on' : ''}`} />
        ))}
      </div>
    </div>
  );
}
