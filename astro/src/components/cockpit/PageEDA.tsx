import EdaRoundBtn from './EdaRoundBtn';
import Meter from './Meter';
import { EDA_SKILLS } from './cockpit-data';
import { GRAD } from './cockpit-palette';

const BLUE = 'var(--cp-eda)';

export default function PageEDA() {
  return (
    <>
      <div className="cp-topic"><span className="cp-slash" style={{ color: BLUE }}>//</span> eda.toolchain</div>
      <div className="cp-rnd-grid">
        {EDA_SKILLS.map((s, i) => (
          <EdaRoundBtn
            key={i}
            skill={s}
            color={GRAD.periwinkleMint[0]}
            color2={GRAD.periwinkleMint[1]}
          />
        ))}
      </div>

      <div className="cp-topic"><span className="cp-slash" style={{ color: BLUE }}>//</span> bench</div>
      <div className="cp-meter-row">
        <Meter label="Lint Pass"  value={95} displayVal="95%" color={BLUE} />
        <Meter label="Synth QoR"  value={88} displayVal="88%" color={BLUE} />
        <Meter label="Sim Speed"  value={76} displayVal="76%" color={BLUE} />
      </div>
    </>
  );
}
