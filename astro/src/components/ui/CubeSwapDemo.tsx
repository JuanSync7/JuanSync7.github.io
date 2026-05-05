import { useEffect, useRef, useState } from 'react';
import './cube-swap.css';

const FACES = [
  { tag: '01', title: 'overview',    body: 'live vitals + skill mix' },
  { tag: '02', title: 'asic.core',   body: 'rtl · verification · pd' },
  { tag: '03', title: 'ai.pipeline', body: 'training · inference · ops' },
  { tag: '04', title: 'eda.tool',    body: 'flow scripts · automation' },
];

interface Cube { from: number; to: number; dir: 'left' | 'right'; }

export default function CubeSwapDemo() {
  const [idx, setIdx] = useState(0);
  const [cube, setCube] = useState<Cube | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

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

  const goTo = (next: number, dir: 'left' | 'right') => {
    if (next === idx || cube) return;
    const wrapped = ((next % FACES.length) + FACES.length) % FACES.length;
    setCube({ from: idx, to: wrapped, dir });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setIdx(wrapped);
      setCube(null);
    }, 620);
  };

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
        <div className="csd-arr" onClick={() => goTo(idx - 1, 'left')}>◀</div>
        <div className="csd-title">// {cur.title}</div>
        <div className="csd-arr" onClick={() => goTo(idx + 1, 'right')}>▶</div>
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
