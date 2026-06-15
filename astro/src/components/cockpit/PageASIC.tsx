import ScopeCanvas from './ScopeCanvas';
import KnobRow from './KnobRow';
import Meter from './Meter';
import Ticker from './Ticker';
import { ASIC_SKILLS } from './cockpit-data';
import { GRAD } from './cockpit-palette';

const TEAL = 'var(--cp-asic)';

export default function PageASIC() {
  return (
    <>
      <div className="cp-topic"><span className="cp-slash" style={{ color: TEAL }}>//</span> asic.core</div>
      <div className="cp-chip-grid">
        {ASIC_SKILLS.map((s, i) => (
          <a
            key={i}
            className="cp-chip"
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ borderColor: 'rgba(27,160,160,0.3)', color: TEAL, background: 'rgba(27,160,160,0.06)' }}
          >
            {s.name} <span className="cp-chip-arr">→</span>
          </a>
        ))}
      </div>

      <div className="cp-topic"><span className="cp-slash" style={{ color: TEAL }}>//</span> clk_domain</div>
      <ScopeCanvas />

      <div className="cp-topic"><span className="cp-slash" style={{ color: TEAL }}>//</span> parameters</div>
      <KnobRow
        knobs={[
          { l: 'CLK_FREQ',   v: '500M', c: GRAD.periwinkleMint[0], c2: GRAD.periwinkleMint[1], f: 0.7 },
          { l: 'PIPE_DEPTH', v: '5',    c: GRAD.periwinkleMint[0], c2: GRAD.periwinkleMint[1], f: 0.5 },
          { l: 'CACHE_SZ',   v: '64K',  c: GRAD.periwinkleMint[0], c2: GRAD.periwinkleMint[1], f: 0.6 },
          { l: 'VDD',        v: '0.9V', c: GRAD.periwinkleMint[0], c2: GRAD.periwinkleMint[1], f: 0.45 },
        ]}
      />

      <div className="cp-topic"><span className="cp-slash" style={{ color: TEAL }}>//</span> bench</div>
      <div className="cp-meter-row">
        <Meter label="ATPG Cov" value={90}  displayVal="90%+"   color={TEAL} />
        <Meter label="Lint"     value={100} displayVal="clean"  color={TEAL} />
        <Meter label="Safety"   value={100} displayVal="ASIL-B" color={TEAL} />
      </div>

      <Ticker />
    </>
  );
}
