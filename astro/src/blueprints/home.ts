import { onPage, type Blueprint } from './types';

/** The home page's opening screen: the hero row of copy and the drawing stage on the notepad, the
 *  lead kept to its measure, the actions in a row. The sections below share the page column. */
export const HOME: Blueprint = {
  id: 'home',
  kind: 'template',
  title: 'Home page',
  summary: 'The landing page: a hero of copy and a drawing side by side, then the notepad sections.',
  source: ['src/pages/index.astro', 'src/components/home/PaperHero.astro', 'src/styles/paper.css', 'src/styles/tokens/paper.css'], // prettier-ignore
  views: onPage('/', 'main'),
  parts: [
    { id: 1, name: 'Page', selector: '', sizing: 'fill', aliases: ['main'] },
    { id: 2, name: 'Hero', selector: '.pp-hero', sizing: 'fill', aliases: ['opening', 'top section'] },
    { id: 3, name: 'Hero row', selector: '.pp-crumple', sizing: 'fill', aliases: ['notepad sheet'] },
    { id: 4, name: 'Copy', selector: '.pp-hero .copy', sizing: 'fill', aliases: ['text', 'words'] },
    {
      id: 5,
      name: 'Stage',
      selector: '.pp-hero .stage',
      sizing: 'fill',
      views: ['desktop'],
      aliases: ['drawing', 'logo', 'picture'],
    },
    { id: 6, name: 'Lead', selector: '.pp-hero .copy > .pp-lead', sizing: 'fill', aliases: ['intro', 'paragraph'] },
    { id: 7, name: 'Actions', selector: '.pp-hero .actions', sizing: 'hug', aliases: ['buttons'] },
  ],
  sizes: [
    { measure: 'padding-y', part: 2, token: '--hf-space-8' },
    { measure: 'gap', part: 3, token: '--hf-space-6', between: [4, 5], views: ['desktop'] },
    { measure: 'max-width', part: 5, token: '--pp-stage-w', views: ['desktop'] },
    { measure: 'max-width', part: 6, token: '--pp-lead-w' },
    { measure: 'gap', part: 7, token: '--hf-space-3' },
  ],
  number: 'JS-TP-0002',
  revision: 'A',
  drawn: '2026-11-16',
};
