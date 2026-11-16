import { onPage, type Blueprint } from './types';

/** A /learn article: the blog post's docs layout, with the body on a sheet of paper and a row of
 *  next reads at the end. */
export const LEARN_ARTICLE: Blueprint = {
  id: 'learn-article',
  kind: 'template',
  title: 'Learn article page',
  summary: 'An explainer in the docs layout, its body on a paper sheet, next reads at the end.',
  source: ['src/pages/learn/[...slug].astro', 'src/components/docs/DocLayout.astro', 'src/components/docs/docs.css', 'src/styles/learn-paper.css', 'src/styles/tokens/paper.css'], // prettier-ignore
  views: onPage('/learn/how-inference-chips-are-built/', 'main.guide'),
  parts: [
    { id: 1, name: 'Page column', selector: '', sizing: 'fill', aliases: ['page', 'main'] },
    { id: 2, name: 'Document grid', selector: '.doc', sizing: 'fill', aliases: ['layout', 'three columns'] },
    { id: 3, name: 'Guides pane', selector: '.doc-pane', sizing: 'fixed', views: ['desktop'], aliases: ['sidebar', 'left column', 'navigation'] }, // prettier-ignore
    { id: 4, name: 'Article column', selector: '.doc-main', sizing: 'fill', aliases: ['article', 'middle column'] },
    { id: 5, name: 'On this page', selector: '.doc-toc', sizing: 'fixed', views: ['desktop'], aliases: ['contents', 'right column'] }, // prettier-ignore
    { id: 6, name: 'Article header', selector: '.head', sizing: 'fill', aliases: ['title', 'heading'] },
    { id: 7, name: 'Cover', selector: '.cover', sizing: 'fill', aliases: ['hero image', 'figure'] },
    { id: 8, name: 'Paper sheet', selector: '.paper', sizing: 'fill', aliases: ['body', 'prose', 'text'] },
  ],
  sizes: [
    { measure: 'padding-x', part: 1, token: '--pp-pad' },
    { measure: 'width', part: 3, token: '--pp-doc-nav-w', views: ['desktop'] },
    { measure: 'gap', part: 2, token: '--pp-doc-gap', between: [3, 4], views: ['desktop'] },
    { measure: 'gap', part: 2, token: '--pp-doc-gap', between: [4, 5], views: ['desktop'] },
    { measure: 'width', part: 5, token: '--pp-doc-toc-w', views: ['desktop'] },
    { measure: 'gap', part: 4, token: '--hf-space-10', between: [6, 7] },
    { measure: 'radius', part: 7, token: '--hf-radius-2xl' },
  ],
  number: 'JS-TP-0003',
  revision: 'A',
  drawn: '2026-11-16',
};
