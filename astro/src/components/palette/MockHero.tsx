import FigureCanvas from '../ui/FigureCanvas';
import { figurePalette } from '../../lib/palette/paint';
import type { Token } from '../../lib/palette/shades';

export const SCENES = [
  {
    id: 'swatch-keyboard',
    label: 'Keyboard',
    notes: ['Alpha keys and the desk mat', 'Case and modifier keys', 'Escape and Enter; the arrows in the second accent'],
  },
  {
    id: 'swatch-room',
    label: 'Room',
    notes: ['Walls, floor and paper faces', 'Every edge, the chair and the screen', 'Lamp, poster, one book and the cursor'],
  },
  {
    id: 'swatch-desk',
    label: 'Desk and rack',
    notes: ['Plinth and paper faces', 'Cases, legs and every edge', 'Screen bar, replies, rack lights, the jumper'],
  },
] as const;
export type SceneId = (typeof SCENES)[number]['id'];

const SHARES = ['60 ground', '30 ink', '10 accent'];

interface Props {
  scene: SceneId;
  onScene: (id: SceneId) => void;
  tokens: Token[];
}

/** The first screen: a sticky nav, then the headline, lead and two actions on the left and the
 *  drawing beside them, with keylines round it and numbered notes saying where each share went. */
export default function MockHero({ scene, onScene, tokens }: Props) {
  const current = SCENES.find((s) => s.id === scene) ?? SCENES[0];
  return (
    <>
      <nav className="mk-nav" aria-label="Sample site">
        <span className="mk-logo">northlight</span>
        <span className="mk-links">
          <a href="#mk-work">Work</a>
          <a href="#mk-notes">Notes</a>
          <a href="#mk-about">About</a>
        </span>
        <button type="button" className="mk-btn mk-btn-primary mk-btn-small">
          Subscribe
        </button>
      </nav>
      <header className="mk-hero">
        <div className="mk-hero-copy">
          <span className="mk-kicker">{'// 0x01 · a sample studio'}</span>
          <h1>Keep the page quiet. Let one thing speak.</h1>
          <p className="mk-lead">
            Most of the screen is ground, the words and lines are ink, and the accent marks the one thing to do next.
          </p>
          <span className="mk-actions">
            <button type="button" className="mk-btn mk-btn-primary">
              Start a project
            </button>
            <button type="button" className="mk-btn mk-btn-ghost">
              See the work
            </button>
          </span>
          <dl className="mk-stats">
            <div>
              <dt>Projects</dt>
              <dd>42</dd>
            </div>
            <div>
              <dt>Notes</dt>
              <dd>118</dd>
            </div>
            <div>
              <dt>Since</dt>
              <dd>2019</dd>
            </div>
          </dl>
        </div>
        <figure className="mk-figure" id="mk-work">
          <div className="mk-frame">
            <div className={`mk-stage mk-stage-${scene}`}>
              <FigureCanvas key={scene} id={scene} data={{ palette: figurePalette(tokens) }} />
            </div>
          </div>
          <div className="mk-tabs" role="tablist" aria-label="Drawing">
            {SCENES.map((s) => (
              <button key={s.id} type="button" role="tab" aria-selected={s.id === scene} onClick={() => onScene(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
          <ol className="mk-notes">
            {current.notes.map((n, i) => (
              <li key={n}>
                <span className="mk-note-mark" data-share={i}>
                  {SHARES[i]}
                </span>
                {n}
              </li>
            ))}
          </ol>
        </figure>
      </header>
    </>
  );
}
