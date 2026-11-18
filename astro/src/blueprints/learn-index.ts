import { onPage, type Blueprint } from './types';

/** The articles index (/library/articles/): a SectionHead and the grid of guide cards on the page column. */
export const LEARN_INDEX: Blueprint = {
  id: 'learn-index',
  kind: 'template',
  title: 'Articles index page',
  summary: 'The list of guides: a heading, then a grid of guide cards.',
  source: [
    'src/pages/library/articles.astro',
    'src/components/writing/PostGrid.tsx',
    'src/components/writing/post-grid.css',
  ],
  views: onPage('/library/articles/', 'main'),
  parts: [
    { id: 1, name: 'Page', selector: '', sizing: 'fill', aliases: ['main'] },
    { id: 2, name: 'Guides section', selector: 'section.block', sizing: 'fill', aliases: ['section'] },
    { id: 3, name: 'Section head', selector: 'section.block .head', sizing: 'fill', aliases: ['heading'] },
    { id: 4, name: 'Cards', selector: '.cards', sizing: 'fill', aliases: ['grid', 'guide cards'] },
  ],
  sizes: [
    { measure: 'padding-x', part: 2, token: '--pp-pad' },
    { measure: 'padding-y', part: 2, token: '--hf-space-12' },
    { measure: 'gap', part: 2, token: '--hf-space-8' },
  ],
  number: 'JS-TP-0005',
  revision: 'A',
  drawn: '2026-11-16',
};
