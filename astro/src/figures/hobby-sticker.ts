import { defineCanvasFigure } from './define';
import { noise2, type Noise2 } from './kit/noise';
import { HOBBIES, STICKERS, type Hobby } from './kit/stickers';

/** One hobby as a hand-drawn ink sticker (frisbee, badminton, swimming, piano, travelling),
 *  chosen by the page's `data.item`; the frisbee when none is given. A still drawing: the
 *  page cuts the sticker paper and peels its corner, the canvas only inks the picture. */

interface State {
  noise: Noise2;
}

const isHobby = (v: unknown): v is Hobby => typeof v === 'string' && (HOBBIES as readonly string[]).includes(v);

export default defineCanvasFigure<State>({
  id: 'hobby-sticker',
  title: 'Hobby sticker',
  alt: 'A small hand-drawn ink sticker of a hobby: a flying disc, a racket and shuttlecock, swimming goggles over waves, a piano keyboard with notes, or a suitcase with a paper plane, each with one highlighted part.',
  idea: 'A hobby as a hand-inked sticker: brush outlines, hatched shade and one highlighted part (the disc centre, the shuttle cork, a goggle lens, a pressed key, the luggage tag).',
  style: 'ink',
  motion: 'still',
  answers: false,
  group: 'feature',
  seed: 3301,
  aspect: 1,
  setup: ({ rng }) => ({ noise: noise2(rng) }),
  draw: ({ ctx, w, h, data, state }) => {
    const item = isHobby((data as { item?: unknown } | undefined)?.item) ? (data as { item: Hobby }).item : 'frisbee';
    const s = Math.min(w, h);
    STICKERS[item]({ ctx, s, ox: (w - s) / 2, oy: (h - s) / 2, noise: state.noise });
    return item;
  },
});
