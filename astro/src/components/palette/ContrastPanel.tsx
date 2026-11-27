import { level, readings, SIZES, type Verdict } from '../../lib/palette/guidance';
import { pick, show, type Token } from '../../lib/palette/shades';

const SAY: Record<Verdict, string> = {
  fail: 'fails',
  pass: 'passes, below ideal',
  ideal: 'ideal',
  harsh: 'harsh: too much contrast',
};

/** Where a ratio sits on a 1-to-21 bar, as a percentage, on a log scale so the low end
 *  (where the decisions are) gets the room. */
const at = (ratio: number): string => `${(Math.log(ratio) / Math.log(21)) * 100}%`;

/** Every text and mark against what it sits on: a sample in the real colours, the WCAG 2.2
 *  ratio, the floor and the band that reads best, and a verdict. Then the type guide. */
export default function ContrastPanel({ tokens, mode }: { tokens: Token[]; mode: string }) {
  return (
    <section className="pal-panel pal-contrast" aria-labelledby="pal-contrast-title">
      <h2 id="pal-contrast-title">
        Contrast <span>{mode} theme</span>
      </h2>
      <p className="pal-note">
        WCAG 2.2: small text needs 4.5:1, text from 24 pixels (or 18.7 bold) 3:1, and buttons and icons 3:1. The shaded
        band is what reads best; past it, text glares, most of all in dark mode.
      </p>
      <ul className="pal-pairs">
        {readings(tokens).map((r) => (
          <li key={r.pair.id} data-verdict={r.verdict}>
            <span
              className="pal-sample"
              style={{ color: show(pick(tokens, r.pair.fg)), background: show(pick(tokens, r.pair.bg)) }}
            >
              Aa
            </span>
            <span className="pal-pair-name">
              <strong>{r.pair.label}</strong>
              <small>{r.pair.why}</small>
            </span>
            <span className="pal-ratio">
              {r.ratio.toFixed(2)}:1
              <small>{r.pair.min ? `${level(r.ratio)} · ${SAY[r.verdict]}` : SAY[r.verdict]}</small>
            </span>
            <span className="pal-bar" aria-hidden="true">
              <span className="pal-band" style={{ left: at(r.pair.ideal[0]), right: `calc(100% - ${at(r.pair.ideal[1])})` }} />
              {r.pair.min ? <span className="pal-floor" style={{ left: at(r.pair.min) }} /> : null}
              <span className="pal-mark" style={{ left: at(r.ratio) }} />
            </span>
          </li>
        ))}
      </ul>
      <table className="pal-sizes">
        <caption>Type sizes and the contrast each wants</caption>
        <thead>
          <tr>
            <th scope="col">Role</th>
            <th scope="col">Size</th>
            <th scope="col">Weight</th>
            <th scope="col">Contrast</th>
          </tr>
        </thead>
        <tbody>
          {SIZES.map((s) => (
            <tr key={s.role}>
              <th scope="row">{s.role}</th>
              <td>{s.size}</td>
              <td>{s.weight}</td>
              <td>{s.need}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
