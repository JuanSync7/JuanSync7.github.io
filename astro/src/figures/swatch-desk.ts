import { defineCanvasFigure } from './define';
import { clear } from './kit/draw';
import { isoFit, swatchOf } from './kit/swatch';
import { cables, chair, DEPTH, desk, HEIGHT, plinth, rack, SPAN, tower } from './kit/swatchdesk';

/** A coder's desk beside a server rack, in isometric monoline: the plinth and the paper faces in
 *  the ground (60), cases, legs and edges in the ink (30), and the screen bar, the reply bubbles,
 *  the rack's lights and one jumper cable in the accent (10). The palette studio hands it the
 *  reader's colours. The chat streams, the rack blinks, the fans turn and a packet runs the cable. */

export default defineCanvasFigure<null>({
  id: 'swatch-desk',
  title: 'Palette desk and rack',
  alt: 'An isometric line drawing of a desk with an ultrawide monitor streaming a chat, a portrait monitor of code, a keyboard, a mouse and a mug, a chair, a PC tower with a glass side and fans, and a server rack of eight blinking servers cabled to the tower.',
  idea: 'A busy setup still spends its colour 60/30/10: the accent marks only what is live (replies, lights, the jumper cable and the packet on it).',
  style: 'hairline',
  motion: 'ambient',
  answers: false,
  group: 'feature',
  seed: 6032,
  aspect: 1.25,
  setup: () => null,
  draw: ({ ctx, w, h, t, data }) => {
    clear(ctx, w, h);
    const s = swatchOf(data);
    const c = isoFit(ctx, w, h, SPAN, DEPTH, HEIGHT, s.ink);
    plinth(c, s);
    desk(c, s, t);
    rack(c, s, t);
    cables(c, s, t);
    tower(c, s, t);
    chair(c, s);
    return 'rest';
  },
});
