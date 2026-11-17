import { onPage, type Blueprint } from './types';

/** The paper footer at the foot of every public page, laid out as the title block of an
 *  engineering drawing: the who column and three link indexes on one sheet, then a row of labelled
 *  cells (drawn by, part no., rev, edition, sheet, ©) ending in Back to top. */
export const PAPER_FOOTER: Blueprint = {
  id: 'paper-footer',
  kind: 'template',
  title: 'PaperFooter',
  summary: 'The foot of every page as a drawing title block: who, three link indexes, then labelled cells.',
  source: ['src/components/layout/PaperFooter.astro', 'src/styles/paper.css', 'src/styles/tokens/paper.css'],
  views: onPage('/', '.pp-foot'),
  parts: [
    { id: 1, name: 'Footer', selector: '', sizing: 'fill', aliases: ['foot', 'bottom'] },
    { id: 2, name: 'Inner column', selector: '.inner', sizing: 'fill', aliases: ['footer column'] },
    { id: 3, name: 'Sheet', selector: '.sheet', sizing: 'fill', aliases: ['index', 'link columns'] },
    {
      id: 4,
      name: 'Who',
      selector: '.who',
      sizing: 'fixed',
      phone: 'fill',
      aliases: ['brand column', 'name and pitch'],
    },
    { id: 5, name: 'Monogram', selector: '.mark', sizing: 'hug', aliases: ['logo', 'SJ'] },
    { id: 6, name: 'Link index', selector: '.group', sizing: 'fixed', phone: 'fill', aliases: ['pages', 'link group'] },
    { id: 7, name: 'Title block', selector: '.block', sizing: 'fill', aliases: ['cells', 'drawn by row'] },
    { id: 8, name: 'Cell', selector: '.cell', sizing: 'hug', phone: 'fill', aliases: ['drawn by', 'part no.', 'rev'] },
  ],
  sizes: [
    { measure: 'padding-x', part: 2, token: '--pp-pad' },
    { measure: 'padding-y', part: 2, token: '--hf-space-12' },
    { measure: 'width', part: 4, token: '--pp-foot-brand-w', views: ['desktop'] },
    { measure: 'gap', part: 4, token: '--hf-space-4' },
    { measure: 'height', part: 5, token: '--pp-foot-mark-h' },
    { measure: 'padding-x', part: 6, token: '--hf-space-6', views: ['desktop'] },
    { measure: 'padding-y', part: 6, token: '--hf-space-6', views: ['desktop'] },
    { measure: 'padding-y', part: 8, token: '--hf-space-3', views: ['desktop'] },
  ],
  number: 'JS-LY-0002',
  revision: 'B',
  drawn: '2026-11-17',
};
