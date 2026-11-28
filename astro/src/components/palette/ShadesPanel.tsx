import { stripe } from '../../lib/palette/paint';
import { gradients, pick, ramp, show, type Token } from '../../lib/palette/shades';

const SHARE: Record<Token['share'], string> = { '60': '60 · ground', '30': '30 · ink', '10': '10 · accent', '10b': '10 · second accent' };
const RAMPS = ['ground', 'ink', 'accent', 'accent2'];

/** The whole system the four picks make: every derived shade with what it is for (the dull,
 *  readable accent for small text, the highlighter, hover, text on a button), each colour's
 *  eleven steps, and the gradients allowed. All of it goes into the prompt and the code. */
export default function ShadesPanel({ tokens }: { tokens: Token[] }) {
  const groups = (Object.keys(SHARE) as Token['share'][]).map((share) => ({
    share,
    items: tokens.filter((t) => t.share === share),
  }));
  return (
    <section className="pal-panel pal-shades" aria-labelledby="pal-shades-title">
      <h2 id="pal-shades-title">Shades, ramps and gradients</h2>
      <div className="pal-token-groups">
        {groups.map((g) => (
          <div key={g.share} className="pal-token-group">
            <h3>{SHARE[g.share]}</h3>
            <ul>
              {g.items.map((t) => (
                <li key={t.name}>
                  <span className="pal-chip" style={{ background: show(t.value) }} aria-hidden="true" />
                  <code>--{t.name}</code>
                  <span className="pal-hexv">{show(t.value)}</span>
                  <small>{t.use}</small>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <h3>Ramps, 50 to 950</h3>
      <div className="pal-ramps">
        {RAMPS.map((name) => (
          <div key={name} className="pal-ramp">
            <span>{name}</span>
            <ol>
              {ramp(pick(tokens, name)).map((s) => (
                <li key={s.step} style={{ background: show(s.value) }} title={`${name}-${s.step} ${show(s.value)}`}>
                  <span className="pal-sr">{`${name}-${s.step} ${show(s.value)}`}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
      <h3>Gradients</h3>
      <ul className="pal-gradients">
        {gradients(tokens).map((g) => (
          <li key={g.name}>
            <span className="pal-gradient" style={{ background: stripe(g.stops) }} aria-hidden="true" />
            <code>--gradient-{g.name}</code>
            <small>{g.use}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
