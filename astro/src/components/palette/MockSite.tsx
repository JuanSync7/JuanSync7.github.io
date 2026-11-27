import FigureCanvas from '../ui/FigureCanvas';
import { figurePalette, mockVars } from '../../lib/palette/paint';
import type { Token } from '../../lib/palette/shades';
import './mock-site.css';

export const SCENES = [
  {
    id: 'swatch-keyboard',
    label: 'Keyboard',
    notes: ['Alpha keys and the desk mat', 'Case and modifier keys', 'Escape and Enter; the arrows in the second accent'],
  },
  {
    id: 'swatch-room',
    label: 'Room',
    notes: ['Walls, floor and paper faces', 'Every edge, the chair and the screen', 'Lamp, poster, one book and the cursor; the rug in the second accent'],
  },
  {
    id: 'swatch-desk',
    label: 'Desk and rack',
    notes: ['Plinth and paper faces', 'Cases, legs and every edge', 'Screen bar, replies, rack lights and the jumper cable'],
  },
] as const;
export type SceneId = (typeof SCENES)[number]['id'];

interface Props {
  tokens: Token[];
  body: string;
  heading: string;
  scene: SceneId;
  onScene: (id: SceneId) => void;
}

const SHARES = ['60 ground', '30 ink', '10 accent'];

/** A sample website painted only with the reader's tokens (`--mk-*`): a nav, a hero with two
 *  buttons, a drawing with keylines and numbered notes, three cards, some prose with a link, a
 *  highlight and code, and a footer. Nothing in it names a colour of its own. */
export default function MockSite({ tokens, body, heading, scene, onScene }: Props) {
  const current = SCENES.find((s) => s.id === scene) ?? SCENES[0];
  return (
    <div className="mk" style={mockVars(tokens, body, heading)}>
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
      </header>
      <figure className="mk-figure" id="mk-work">
        <div className="mk-tabs" role="tablist" aria-label="Drawing">
          {SCENES.map((s) => (
            <button key={s.id} type="button" role="tab" aria-selected={s.id === scene} onClick={() => onScene(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="mk-frame">
          <div className={`mk-stage mk-stage-${scene}`}>
            <FigureCanvas key={scene} id={scene} data={{ palette: figurePalette(tokens) }} />
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
        </div>
        <figcaption>Fig. 1. The same 60/30/10 split, spent on a drawing instead of a page.</figcaption>
      </figure>
      <section className="mk-cards" aria-label="Sample cards">
        {['Ground first', 'Ink for structure', 'Accent last'].map((title, i) => (
          <article key={title} className="mk-card">
            <span className="mk-card-dot" data-share={i} aria-hidden="true" />
            <h2>{title}</h2>
            <p>A card is the ground with a hairline edge, never a grey slab behind the words.</p>
            <a href="#mk-notes">Read the note</a>
          </article>
        ))}
      </section>
      <article className="mk-prose" id="mk-notes">
        <h2>Why the accent stays small</h2>
        <p>
          An accent only reads as an accent when it is rare. Spend it on the <a href="#mk-about">next action</a>, a focus
          ring, <mark>one highlighted phrase</mark>, and stop there.
        </p>
        <p className="mk-muted">{'// a comment: quieter than the body, still 4.5:1'}</p>
        <pre className="mk-code">
          <code>{':root {\n  --ground: …;\n  --ink: …;\n  --accent: …;\n}'}</code>
        </pre>
      </article>
      <footer className="mk-footer" id="mk-about">
        <span>northlight · a sample site</span>
        <span className="mk-badge">new</span>
      </footer>
    </div>
  );
}
