import { HOBBIES, type Hobby, type Pen } from './stickers-pen';
import { piano, travelling } from './stickers-life';
import { MORE } from './stickers-more';
import { badminton, frisbee, swimming } from './stickers-sport';

/** Hand-drawn hobby stickers for `hobby-sticker.ts`, in four files: the pen (`stickers-pen`),
 *  the sports and the rest of life (`stickers-sport`, `stickers-life`), and a second pass of
 *  detail drawn under each (`stickers-more`). */

export { HOBBIES, type Hobby };
const BASE: Record<Hobby, (p: Pen) => void> = { frisbee, badminton, swimming, piano, travelling };
export const STICKERS: Record<Hobby, (p: Pen) => void> = Object.fromEntries(
  HOBBIES.map((h) => [h, (p: Pen) => (MORE[h](p), BASE[h](p))]),
) as Record<Hobby, (p: Pen) => void>;
