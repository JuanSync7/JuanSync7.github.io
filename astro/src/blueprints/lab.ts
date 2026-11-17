import { onPage, type Blueprint } from './types';

/** The lab index (the interactive explorer pattern): a head kept to the reading measure, then a
 *  grid of cards that fills the column, each a live figure over its name. */
export const LAB: Blueprint = {
  id: 'lab',
  kind: 'template',
  title: 'Lab index page',
  summary: 'The lab: a short head, then a grid of live figure cards that fills the column.',
  source: ['src/pages/lab/index.astro', 'src/styles/tokens/spacing.css'],
  views: onPage('/lab/', 'main'),
  parts: [
    { id: 1, name: 'Page column', selector: '', sizing: 'fill', aliases: ['page', 'main'] },
    { id: 2, name: 'Head', selector: '.lab-head', sizing: 'fill', aliases: ['heading', 'intro'] },
    { id: 3, name: 'Card grid', selector: '.lab-grid', sizing: 'fill', aliases: ['grid', 'cards'] },
  ],
  sizes: [
    { measure: 'padding-x', part: 1, token: '--pp-pad' },
    { measure: 'max-width', part: 2, token: '--nt-measure' },
    { measure: 'gap', part: 2, token: '--hf-space-3' },
  ],
  number: 'JS-TP-0008',
  revision: 'A',
  drawn: '2026-11-16',
};
