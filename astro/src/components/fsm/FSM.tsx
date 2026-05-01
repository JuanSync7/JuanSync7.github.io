import { useRef, useState } from 'react';
import { useOnScreen } from '@/hooks/useOnScreen';

interface State {
  x: number;
  label: string;
  year: string;
  detail: string;
  active?: boolean;
  future?: boolean;
}

interface Edge {
  from: number;
  to: number;
  label: string;
  dashed?: boolean;
}

const STATES: State[] = [
  { x: 100, label: 'UNI',    year: '19-23',  detail: 'MEng Electrical & Electronic Eng, University of Southampton' },
  { x: 280, label: 'ASIC',   year: '23-25',  detail: 'ASIC Design Engineer at Aion Silicon, Reading — SV, UVM, DFT' },
  { x: 460, label: 'SENIOR', year: '25-now', active: true, detail: 'Senior Design & AI Engineer at Aion Silicon, London — RISC-V, AI agents' },
  { x: 610, label: '???',    year: 'next',   future: true,  detail: "What comes next? Let's talk." },
];

const EDGES: Edge[] = [
  { from: 130, to: 248, label: 'grad' },
  { from: 312, to: 424, label: 'promo' },
  { from: 496, to: 578, label: '??', dashed: true },
];

export default function FSM() {
  const ref = useRef<HTMLElement>(null);
  const visible = useOnScreen(ref, 0.2);
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <section className={`hf-section hf-fsm-section ${visible ? 'hf-visible' : ''}`} ref={ref}>
      <div className="hf-fsm-header">
        <span className="hf-code-kw">module</span>{' '}
        <span className="hf-accent">juan_kok</span>{' '}
        <span className="hf-code-kw">();</span>{' '}
        <span className="hf-code-comment">// current_state = SENIOR_AI_ENG</span>
      </div>

      <div className="hf-fsm-stage">
        <svg viewBox="0 0 700 200" className="hf-fsm-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="hf-arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" fill="var(--hf-ink-soft)" />
            </marker>
            <marker id="hf-arr-a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" fill="var(--hf-accent)" />
            </marker>
            <filter id="hf-glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {EDGES.map((e, i) => (
            <g key={i}>
              <line
                x1={e.from} y1="100" x2={e.to} y2="100"
                stroke="var(--hf-ink-soft)" strokeWidth="1.5"
                strokeDasharray={e.dashed ? '5 4' : 'none'}
                markerEnd="url(#hf-arr)"
                className="hf-fsm-edge-line"
              />
              <text
                x={(e.from + e.to) / 2} y="88"
                textAnchor="middle" fontSize="10"
                fill="var(--hf-ink-soft)" fontFamily="var(--hf-mono)"
              >
                {e.label}
              </text>
            </g>
          ))}

          <path
            d="M460,58 C420,15 500,15 460,58"
            fill="none" stroke="var(--hf-accent)" strokeWidth="1.2"
            markerEnd="url(#hf-arr-a)" className="hf-fsm-self-loop"
          />
          <text x="460" y="18" textAnchor="middle" fontSize="9" fill="var(--hf-accent)" fontFamily="var(--hf-mono)">
            learn(ai)
          </text>

          {STATES.map((s, i) => (
            <g
              key={i}
              className={`hf-fsm-node ${s.active ? 'hf-fsm-node-active' : ''} ${s.future ? 'hf-fsm-node-future' : ''}`}
              onClick={() => setExpanded(expanded === i ? null : i)}
              style={{ cursor: 'pointer' }}
            >
              {s.active && (
                <circle
                  cx={s.x} cy="100" r="46" fill="none"
                  stroke="var(--hf-accent)" strokeWidth="1"
                  strokeDasharray="4 3" opacity="0.5"
                  className="hf-fsm-outer-ring"
                />
              )}
              <circle
                cx={s.x} cy="100" r={s.active ? 38 : 32}
                className="hf-fsm-circle"
                filter={s.active ? 'url(#hf-glow)' : undefined}
              />
              <text x={s.x} y="96" textAnchor="middle" fontSize="13" fontWeight="600" fontFamily="var(--hf-mono)" className="hf-fsm-label">
                {s.label}
              </text>
              <text x={s.x} y="112" textAnchor="middle" fontSize="9" opacity="0.6" fontFamily="var(--hf-mono)" className="hf-fsm-year">
                {s.year}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {expanded !== null && (
        <div className="hf-fsm-detail">
          <div className="hf-fsm-detail-close" onClick={() => setExpanded(null)}>×</div>
          <div className="hf-fsm-detail-label">{STATES[expanded].label}</div>
          <div className="hf-fsm-detail-text">{STATES[expanded].detail}</div>
        </div>
      )}
    </section>
  );
}
