import { useCallback, useEffect, useRef, useState } from 'react';
import { useOnScreen } from '@/hooks/useOnScreen';
import { useInView } from '@/hooks/useInView';
import PageOverview from './PageOverview';
import PageASIC from './PageASIC';
import PageAI from './PageAI';
import PageEDA from './PageEDA';
import PageScripting from './PageScripting';
import CockpitStars from './CockpitStars';
import { drawBars } from './draw/bars';
import { drawSpeedometer } from './draw/speedometer';
import { initBarData, initTpData, PAGE_COLORS, PAGE_NAMES, TOTAL_PAGES } from './cockpit-data';
import { GRAD } from './cockpit-palette';

export default function Cockpit() {
  const sectionRef = useRef<HTMLElement>(null);
  const sectionVisible = useOnScreen(sectionRef, 0.1);
  const inView = useInView(sectionRef, '300px 0px');

  const [page, setPage] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [smooth, setSmooth] = useState(true);
  const [mode, setMode] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'out' | 'in'>('idle');
  const [cube, setCube] = useState<{ from: number; to: number; dir: 'left' | 'right' } | null>(null);
  const phaseTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const dashRef = useRef<HTMLDivElement>(null);

  // Keep --cp-cube-d (half the dash width) in sync so cube faces stay tangent.
  useEffect(() => {
    const el = dashRef.current;
    if (!el) return;
    const apply = () => {
      const w = el.getBoundingClientRect().width;
      el.style.setProperty('--cp-cube-d', `${w / 2}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const gpuRef = useRef<HTMLCanvasElement>(null);
  const tpRef = useRef<HTMLCanvasElement>(null);
  const gpuRef2 = useRef<HTMLCanvasElement>(null);
  const tpRef2 = useRef<HTMLCanvasElement>(null);

  const dataRef = useRef({
    gpu: initBarData(60),
    tp: initTpData(60),
    gTarget: 65,
    tTarget: 400,
    speedVal: 65,
    speedTarget: 65,
    fc: 0,
  });

  const goTo = useCallback((p: number, dir?: 'left' | 'right') => {
    const next = ((p % TOTAL_PAGES) + TOTAL_PAGES) % TOTAL_PAGES;
    setPage((prev) => {
      if (next === prev) return prev;
      phaseTimers.current.forEach(clearTimeout);
      phaseTimers.current = [];

      if (dir) {
        // Cube rotation for arrow navigation. The rotor pivots ±90° so the
        // adjacent face swings into view, then we snap state and reset.
        setCube({ from: prev, to: next, dir });
        phaseTimers.current.push(setTimeout(() => {
          setPage(next);
          setCube(null);
        }, 620));
        return prev;
      }

      // Sequenced zoom transition for non-adjacent jumps (dots / category btns).
      setPhase('out');
      phaseTimers.current.push(setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 320));
      phaseTimers.current.push(setTimeout(() => {
        setPage(next);
        setPhase('in');
      }, 700));
      phaseTimers.current.push(setTimeout(() => setPhase('idle'), 1080));
      return prev;
    });
  }, []);

  useEffect(() => () => { phaseTimers.current.forEach(clearTimeout); }, []);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const d = dataRef.current;
    const loop = () => {
      d.fc++;
      if (playing && d.fc % 50 === 0) {
        if (Math.random() < 0.15) d.gTarget = 10 + Math.random() * 80;
        if (Math.random() < 0.15) d.tTarget = 80 + Math.random() * 650;
        if (Math.random() < 0.2) d.speedTarget = 20 + Math.random() * 70;
        const gL = d.gpu[d.gpu.length - 1];
        const gN = gL + (d.gTarget - gL) * 0.18 + (Math.random() - 0.5) * 5;
        d.gpu.push(Math.max(3, Math.min(97, gN)));
        d.gpu.shift();
        const tL = d.tp[d.tp.length - 1];
        const tN = tL + (d.tTarget - tL) * 0.15 + (Math.random() - 0.5) * 25;
        d.tp.push(Math.max(40, Math.min(780, tN)));
        d.tp.shift();
      }
      d.speedVal += (d.speedTarget - d.speedVal) * 0.04 + (Math.random() - 0.5) * 0.3;
      d.speedVal = Math.max(5, Math.min(95, d.speedVal));

      drawBars(gpuRef.current, d.gpu, GRAD.roseGold[0], GRAD.roseGold[1], 100);
      drawSpeedometer(tpRef.current, d.speedVal, GRAD.greenYellow[0], GRAD.greenYellow[1]);
      drawBars(gpuRef2.current, d.gpu, GRAD.cyanMagenta[0], GRAD.cyanMagenta[1], 100);
      drawBars(tpRef2.current, d.tp, GRAD.coralPurple[0], GRAD.coralPurple[1], 800);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [inView, playing]);

  const pageClass = (idx: number) => {
    if (cube) {
      if (idx === cube.from) return 'cp-page cp-cube-face cp-cube-face-front';
      if (idx === cube.to) {
        return `cp-page cp-cube-face cp-cube-face-${cube.dir === 'right' ? 'right' : 'left'}`;
      }
      return 'cp-page cp-page-hidden';
    }
    return `cp-page ${page === idx ? 'cp-page-active' : 'cp-page-hidden'}`;
  };

  return (
    <section
      id="cv"
      className={`hf-section hf-cockpit${sectionVisible ? ' hf-visible' : ''}`}
      ref={sectionRef}
    >
      {inView && <CockpitStars count={150} />}

      <div
        ref={dashRef}
        className={`cp-dash${phase !== 'idle' ? ` cp-dash-${phase}` : ''}${cube ? ` cp-dash-cube cp-dash-cube-${cube.dir}` : ''}`}
      >
        <div className="cp-scanline" />

        <div className="cp-hdr">
          <div className="cp-hdr-left">
            <div className="cp-arr" onClick={() => goTo(page - 1, 'left')}>◀</div>
            <span className="cp-hdr-title">// skill_monitor.sv</span>
          </div>
          <div className="cp-dots">
            {Array.from({ length: TOTAL_PAGES }, (_, i) => (
              <span
                key={i}
                className={`cp-dt${i === page ? ' cp-dt-on' : ''}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
          <div className="cp-page-spacer">
            <span className="cp-plbl">
              <span className="cp-sdot" style={{ background: PAGE_COLORS[page] }} />
              [{page + 1}/{TOTAL_PAGES}] {PAGE_NAMES[page]}
            </span>
            <div className="cp-arr" onClick={() => goTo(page + 1, 'right')}>▶</div>
          </div>
        </div>

        <div className="cp-cube-stage">
          <div className={`cp-cube-rotor${cube ? ` cp-cube-rotor-${cube.dir}` : ''}`}>
        <div className={pageClass(0)}>
          <PageOverview
            gpuRef={gpuRef}
            tpRef={tpRef}
            playing={playing}
            setPlaying={setPlaying}
            smooth={smooth}
            setSmooth={setSmooth}
            mode={mode}
            setMode={setMode}
            goTo={goTo}
          />
        </div>
        <div className={pageClass(1)}>
          <PageASIC />
        </div>
        <div className={pageClass(2)}>
          <PageAI gpuRef={gpuRef2} tpRef={tpRef2} />
        </div>
        <div className={pageClass(3)}>
          <PageEDA />
        </div>
        <div className={pageClass(4)}>
          <PageScripting />
        </div>
          </div>
        </div>
      </div>
    </section>
  );
}
