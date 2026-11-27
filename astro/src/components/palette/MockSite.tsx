import { mockVars } from '../../lib/palette/paint';
import type { Token } from '../../lib/palette/shades';
import MockHero, { type SceneId } from './MockHero';
import MockSections from './MockSections';
import './mock-site.css';
import './mock-sections.css';

export { SCENES, type SceneId } from './MockHero';

interface Props {
  tokens: Token[];
  body: string;
  heading: string;
  scene: SceneId;
  onScene: (id: SceneId) => void;
  /** Full screen: the page fills the viewport instead of a browser window on the studio. */
  full?: boolean;
}

/** A sample landing page painted only with the reader's tokens (`--mk-*`), in a browser window
 *  that scrolls like the real thing: a sticky nav, a hero with its drawing beside the headline,
 *  then features, the latest posts, an article, a sign-up and a footer. Nothing in it names a
 *  colour of its own. */
export default function MockSite({ tokens, body, heading, scene, onScene, full = false }: Props) {
  return (
    <div className="mk-window" data-full={full || undefined} style={mockVars(tokens, body, heading)}>
      <div className="mk-chrome" aria-hidden="true">
        <span />
        <span />
        <span />
        <span className="mk-address">northlight.studio</span>
      </div>
      <div className="mk-scroll" tabIndex={0} aria-label="Sample landing page, scrollable">
        <div className="mk">
          <MockHero scene={scene} onScene={onScene} tokens={tokens} />
          <MockSections />
        </div>
      </div>
    </div>
  );
}
