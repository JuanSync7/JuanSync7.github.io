import { onDesignSystem, type Blueprint } from './types';

/** Sticker: a hand-inked die-cut sticker pressed on the paper, its art over its caption. The art
 *  keeps the sticker size whatever the caption; the tilt is decoration and is not drawn. */
export const STICKER: Blueprint = {
  id: 'sticker',
  kind: 'component',
  title: 'Sticker',
  summary: 'A die-cut sticker: hand-inked art at the sticker size, its caption under it.',
  source: ['src/components/ui/Sticker.astro', 'src/components/ui/sticker.css', 'src/styles/tokens/paper.css'],
  views: onDesignSystem('.ds-component .sticker'),
  parts: [
    { id: 1, name: 'Sticker', selector: '', sizing: 'fill', aliases: ['badge', 'decal'] },
    { id: 2, name: 'Art', selector: 'svg', sizing: 'fixed', aliases: ['drawing', 'picture', 'icon'] },
    { id: 3, name: 'Caption', selector: 'figcaption', sizing: 'hug', aliases: ['label', 'name'] },
  ],
  sizes: [
    { measure: 'width', part: 2, token: '--pp-sticker-size' },
    { measure: 'gap', part: 1, token: '--hf-space-2', between: [2, 3] },
  ],
  number: 'JS-UI-0004',
  revision: 'A',
  drawn: '2026-11-16',
};
