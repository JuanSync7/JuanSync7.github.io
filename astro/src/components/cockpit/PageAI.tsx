import type { RefObject } from 'react';
import KnobRow from './KnobRow';
import Meter from './Meter';
import Ticker from './Ticker';
import { AI_SKILLS } from './cockpit-data';

interface Props {
  gpuRef: RefObject<HTMLCanvasElement>;
  tpRef: RefObject<HTMLCanvasElement>;
}

const RED = 'var(--cp-ai)';
const ORA = 'var(--cp-ai-orange)';

export default function PageAI({ gpuRef, tpRef }: Props) {
  return (
    <>
      <div className="cp-topic"><span className="cp-slash" style={{ color: RED }}>//</span> ai.pipeline</div>
      <div className="cp-chip-grid">
        {AI_SKILLS.map((s, i) => (
          <a
            key={i}
            className="cp-chip"
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ borderColor: `${s.color}4d`, color: s.color, background: `${s.color}0f` }}
          >
            {s.name} <span className="cp-chip-arr">→</span>
          </a>
        ))}
      </div>

      <div className="cp-topic"><span className="cp-slash" style={{ color: RED }}>//</span> skill growth <span className="cp-sub">— live</span></div>
      <div className="cp-chart-wrap">
        <div className="cp-axis-l">% growth</div>
        <canvas ref={gpuRef} width={720} height={110} className="cp-canvas-fluid" />
        <div className="cp-axis-b">timeline</div>
      </div>

      <div className="cp-topic"><span className="cp-slash" style={{ color: ORA }}>//</span> output rate <span className="cp-sub">— live</span></div>
      <div className="cp-chart-wrap">
        <div className="cp-axis-l">output</div>
        <canvas ref={tpRef} width={720} height={110} className="cp-canvas-fluid" />
        <div className="cp-axis-b">timeline</div>
      </div>

      <div className="cp-topic"><span className="cp-slash" style={{ color: RED }}>//</span> parameters</div>
      <KnobRow
        knobs={[
          { l: 'TEMP',    v: '0.7', c: '#ffa94d', c2: '#ff00aa', f: 0.7 },
          { l: 'TOP_K',   v: '40',  c: '#ffa94d', c2: '#ff00aa', f: 0.4 },
          { l: 'CTX_LEN', v: '32k', c: '#ff6b6b', c2: '#a855f7', f: 0.8 },
          { l: 'BATCH',   v: '16',  c: '#ff6b6b', c2: '#a855f7', f: 0.5 },
        ]}
      />

      <div className="cp-topic"><span className="cp-slash" style={{ color: RED }}>//</span> bench</div>
      <div className="cp-meter-row">
        <Meter label="Accuracy" value={91} displayVal="91.3%" color={RED} />
        <Meter label="Tokens/s" value={78} displayVal="156"   color={ORA} />
        <Meter label="Context"  value={64} displayVal="32k"   color={RED} />
      </div>

      <Ticker />
    </>
  );
}
