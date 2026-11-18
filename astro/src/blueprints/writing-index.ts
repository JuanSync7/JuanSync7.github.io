import { onPage, type Blueprint } from './types';

/** The writing index (/blog/): the hero, then sections on the page column (featured, lessons,
 *  posts), each a SectionHead over its content. */
export const WRITING_INDEX: Blueprint = {
  id: 'writing-index',
  kind: 'template',
  title: 'Writing index page',
  summary: 'The list of writing: a hero, then featured, lessons and posts sections on the page column.',
  source: ['src/pages/blog/index.astro', 'src/components/writing/WritingHero.astro', 'src/components/writing/post-grid.css', 'src/styles/night.css'], // prettier-ignore
  views: onPage('/blog/', 'main'),
  parts: [
    { id: 1, name: 'Page', selector: '', sizing: 'fill', aliases: ['main'] },
    { id: 2, name: 'Hero', selector: '.hero', sizing: 'fill', aliases: ['opening'] },
    { id: 3, name: 'Posts section', selector: '#posts', sizing: 'fill', aliases: ['posts', 'all posts'] },
    { id: 4, name: 'Section head', selector: '#posts .head', sizing: 'fill', aliases: ['heading'] },
    { id: 5, name: 'Filters', selector: '#posts .pills', sizing: 'fill', aliases: ['categories', 'pills', 'tags'] },
    { id: 6, name: 'Post cards', selector: '#posts .cards', sizing: 'fill', aliases: ['grid', 'cards'] },
  ],
  sizes: [
    { measure: 'padding-x', part: 3, token: '--pp-pad' },
    { measure: 'padding-y', part: 3, token: '--hf-space-12' },
    { measure: 'gap', part: 3, token: '--hf-space-8', between: [4, 5] },
  ],
  number: 'JS-TP-0004',
  revision: 'A',
  drawn: '2026-11-16',
};
