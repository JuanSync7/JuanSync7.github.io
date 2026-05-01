import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useOnScreen } from '@/hooks/useOnScreen';
import { useInView } from '@/hooks/useInView';
import PageOverview from './PageOverview';
import PageASIC from './PageASIC';
import PageAI from './PageAI';
import PageEDA from './PageEDA';
import PageScripting from './PageScripting';
import { drawBars } from './draw/bars';
import { drawSpeedometer } from './draw/speedometer';
import { initBarData, initTpData, PAGE_COLORS, PAGE_NAMES, TOTAL_PAGES } from './cockpit-data';
import { GRAD } from './cockpit-palette';

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

export default function Cockpit() {
  const sectionRef = useRef<HTMLElement>(null);
  const sectionVisible = useOnScreen(sectionRef, 0.1);
  const inView = useInView(sectionRef, '300px 0px');

  const stars = useMemo(() => makeStars(150), []);

  const [page, setPage] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [smooth, setSmooth] = useState(true);
  const [mode, setMode] = useState(0);

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

  const goTo = useCallback((p: number) => {
    const next = ((p % TOTAL_PAGES) + TOTAL_PAGES) % TOTAL_PAGES;
    setPage((prev) => {
      if (next === prev) return prev;
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return next;
    });
  }, []);

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

  const pageClass = (idx: number) => `cp-page ${page === idx ? 'cp-page-active' : 'cp-page-hidden'}`;

  return (
    <section
      id="cv"
      className={`hf-section hf-cockpit${sectionVisible ? ' hf-visible' : ''}`}
      ref={sectionRef}
    >
      {inView && (
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
      )}

      <div className="cp-dash">
        <div className="cp-scanline" />

        <div className="cp-hdr">
          <div className="cp-hdr-left">
            <div className="cp-arr" onClick={() => goTo(page - 1)}>◀</div>
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
            <div className="cp-arr" onClick={() => goTo(page + 1)}>▶</div>
          </div>
        </div>

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
    </section>
  );
}
