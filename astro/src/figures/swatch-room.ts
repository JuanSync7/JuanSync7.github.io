import { defineCanvasFigure } from './define';
import { clear } from './kit/draw';
import { isoFit, swatchOf } from './kit/swatch';
import { bookcase, chair, desk, HEIGHT, plant, shelf, shell, SPAN } from './kit/swatchroom';

/** A study drawn as an isometric monoline cutaway: two walls and a floor in the ground (60), the
 *  furniture's edges and dark faces in the ink (30), and a handful of accents (10): the lamp, a
 *  poster, one book, the cursor. The palette studio hands it the reader's colours, so it shows
 *  how a 60/30/10 split reads on a drawing as well as on text. The cursor blinks; code types. */

export default defineCanvasFigure<null>({
  id: 'swatch-room',
  title: 'Palette study room',
  alt: 'An isometric line drawing of a study: a desk with a monitor of code, a keyboard, a mug and a desk lamp, a chair, a bookcase, a shelf of books, a window with a sun, a poster and a rug, coloured mostly in the ground, with ink edges and a few accent marks.',
  idea: 'A room spends its colour 60/30/10 like a page: walls and floor are the ground, furniture the ink, and only the lamp, a poster and the cursor take the accent, which blinks as code types.',
  style: 'hairline',
  motion: 'ambient',
  answers: false,
  group: 'feature',
  seed: 6031,
  aspect: 1.25,
  setup: () => null,
  draw: ({ ctx, w, h, t, data }) => {
    clear(ctx, w, h);
    const s = swatchOf(data);
    const c = isoFit(ctx, w, h, SPAN, SPAN, HEIGHT, s.ink);
    shell(c, s, t);
    shelf(c, s);
    bookcase(c, s);
    desk(c, s, t);
    chair(c, s);
    plant(c, s, t);
    return 'rest';
  },
});
