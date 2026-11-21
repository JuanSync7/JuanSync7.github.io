import { onPage, type Blueprint } from './types';

/** The lab index (the interactive explorer pattern): a head kept to the reading measure, the lab
 *  room drawing across the column, then two sections (the fixed tools, the seeded templates), each
 *  a list of full-width cards with the words on the left and a live drawing on the right. */
export const LAB: Blueprint = {
  id: 'lab',
  kind: 'template',
  title: 'Lab index page',
  summary: 'The lab: a short head, the lab room drawing, then tools and templates as one card per row.',
  source: ['src/pages/lab/index.astro', 'src/components/lab/LabCard.astro', 'src/components/lab/lab-card.css', 'src/styles/tokens/spacing.css'], // prettier-ignore
  views: onPage('/lab/', 'main'),
  parts: [
    { id: 1, name: 'Page column', selector: '', sizing: 'fill', aliases: ['page', 'main'] },
    { id: 2, name: 'Head', selector: '.lab-head', sizing: 'fill', aliases: ['heading', 'intro'] },
    { id: 3, name: 'Lab drawing', selector: '.lab-hero', sizing: 'fill', aliases: ['hero', 'lab room', 'figure'] },
    { id: 4, name: 'Tools section', selector: '.lab-tools', sizing: 'fill', aliases: ['tools', 'kits', 'references'] },
    { id: 5, name: 'Card list', selector: '.lab-tools .lab-list', sizing: 'fill', aliases: ['list', 'cards', 'rows'] },
    { id: 6, name: 'Card', selector: '.lab-tools .lab-card', sizing: 'fill', aliases: ['row', 'entry', 'panel'] },
    { id: 7, name: 'Card words', selector: '.lab-tools .lab-card-copy', sizing: 'fill', aliases: ['copy', 'text'] },
    {
      id: 8,
      name: 'Card drawing',
      selector: '.lab-tools .lab-card-art',
      sizing: 'fill',
      aliases: ['art', 'animation'],
    },
  ],
  sizes: [
    { measure: 'padding-x', part: 1, token: '--pp-pad' },
    { measure: 'max-width', part: 2, token: '--nt-measure' },
    { measure: 'gap', part: 2, token: '--hf-space-3' },
    { measure: 'gap', part: 4, token: '--hf-space-8' },
    { measure: 'gap', part: 5, token: '--hf-space-8' },
    { measure: 'padding-x', part: 6, token: '--hf-space-10', views: ['desktop'] },
    { measure: 'padding-x', part: 6, token: '--hf-space-6', views: ['phone'] },
    { measure: 'gap', part: 6, token: '--hf-space-8', between: [7, 8], views: ['desktop'] },
    { measure: 'radius', part: 6, token: '--hf-radius-2xl' },
  ],
  number: 'JS-TP-0008',
  revision: 'B',
  drawn: '2026-11-21',
};
