import { useRef } from 'react';
import { useOnScreen } from '@/hooks/useOnScreen';
import KineticWord from '@/components/ui/KineticWord';
import NeonText from '@/components/ui/NeonText';
import PacmanText from './PacmanText';
import RoutineSequencer from './RoutineSequencer';

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const visible = useOnScreen(ref, 0.1);

  return (
    <section id="about" className={`hf-section hf-hero ${visible ? 'hf-visible' : ''}`} ref={ref}>
      <div className="hf-hero-tagrow">
        <span>// 0x00. introduction</span>
        <span className="hf-blink">_</span>
      </div>

      <div className="hf-hero-display">
        <div className="hf-hero-line">
          <span className="hf-hw">I</span>
          <KineticWord word="design" altWord="build" delay={800} loop />
          <NeonText>silicon,</NeonText>
        </div>
        <div className="hf-hero-line hf-hero-shift">
          <KineticWord
            word="not software."
            altWord="or maybe both?"
            delay={3000}
            loop
            strikePrefix="not "
            underlinePrefix="or maybe "
            variant={2}
          />
        </div>
        <div className="hf-hero-line">
          <PacmanText text="ai is eating the chip flow." delay={3500} />
        </div>
      </div>

      <div className="hf-hero-meta">
        <div className="hf-meta-card">
          <div className="hf-meta-lbl">now</div>
          <div className="hf-meta-val">
            Senior Design Engineer — front-end design, verification, SoC architecture, synthesis & DFT.
            Exploring AI agents, MCP & RAG to automate chip design workflows.
          </div>
        </div>
        <div className="hf-meta-card">
          <div className="hf-meta-lbl">stack</div>
          <div className="hf-meta-val">
            SV, UVM, py, tcl, bash<br />
            +MCP / RAG / AI harness<br />
            +eda tools
          </div>
        </div>
        <div className="hf-meta-card">
          <div className="hf-meta-lbl">status</div>
          <div className="hf-meta-val">
            <span className="hf-status-dot" /> open to chat and collaborate
          </div>
        </div>
      </div>

      <RoutineSequencer />
    </section>
  );
}
