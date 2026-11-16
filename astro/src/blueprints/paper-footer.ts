import { onPage, type Blueprint } from './types';

/** The paper footer at the foot of every public page: the links, a handwritten line and the
 *  caption, on the page column. */
export const PAPER_FOOTER: Blueprint = {
  id: 'paper-footer',
  kind: 'template',
  title: 'PaperFooter',
  summary: 'The foot of every page: links, a handwritten line and a caption on the page column.',
  source: ['src/components/layout/PaperFooter.astro', 'src/styles/paper.css'],
  views: onPage('/', '.pp-foot'),
  parts: [
    { id: 1, name: 'Footer', selector: '', sizing: 'fill', aliases: ['foot', 'bottom'] },
    { id: 2, name: 'Inner column', selector: '.inner', sizing: 'fill', aliases: ['footer column'] },
  ],
  sizes: [
    { measure: 'padding-x', part: 2, token: '--pp-pad' },
    { measure: 'padding-y', part: 2, token: '--hf-space-8' },
  ],
  number: 'JS-LY-0002',
  revision: 'A',
  drawn: '2026-11-16',
};
