import { onPage, type Blueprint } from './types';

/** A /learn article: the blog post's notepad and docs layout, with the body on a sheet of paper. Like the
 *  blog post, the article holds the reading measure (--pp-doc-measure) and centres in its column. */
export const LEARN_ARTICLE: Blueprint = {
  id: 'learn-article',
  kind: 'template',
  title: 'Learn article page',
  summary: 'An explainer in the docs layout, its body on a paper sheet, next reads at the end.',
  source: ['src/pages/learn/[...slug].astro', 'src/components/docs/DocLayout.astro', 'src/components/docs/docs.css', 'src/styles/learn-paper.css', 'src/styles/tokens/paper.css', 'src/layouts/PaperLayout.astro'], // prettier-ignore
  views: onPage('/learn/how-inference-chips-are-built/', '.pp-page'),
  parts: [
    { id: 1, name: 'Page', selector: '', sizing: 'fill', aliases: ['notepad', 'sheet', 'window'] },
    { id: 2, name: 'Margin line', selector: '', pseudo: '::before', sizing: 'fixed', views: ['desktop'], aliases: ['orange line', 'red line', 'punch hole line'] }, // prettier-ignore
    { id: 3, name: 'Punched strip', selector: '', pseudo: '::after', sizing: 'fixed', views: ['desktop'], aliases: ['holes', 'punch holes', 'binding'] }, // prettier-ignore
    { id: 4, name: 'Page column', selector: 'main.guide', sizing: 'fill', aliases: ['page', 'main'] },
    { id: 5, name: 'Document grid', selector: 'main.guide .doc', sizing: 'fill', aliases: ['layout', 'three columns'] },
    { id: 6, name: 'Guides pane', selector: 'main.guide .doc-pane', sizing: 'fixed', views: ['desktop'], aliases: ['sidebar', 'left column', 'navigation'] }, // prettier-ignore
    {
      id: 7,
      name: 'Article column',
      selector: 'main.guide .doc-main',
      sizing: 'fill',
      aliases: ['article', 'middle column'],
    },
    { id: 8, name: 'On this page', selector: 'main.guide .doc-toc', sizing: 'fixed', views: ['desktop'], aliases: ['contents', 'right column'] }, // prettier-ignore
    { id: 9, name: 'Article header', selector: 'main.guide .head', sizing: 'fill', aliases: ['title', 'heading'] },
    { id: 10, name: 'Cover', selector: 'main.guide .cover', sizing: 'fill', aliases: ['hero image', 'figure'] },
    { id: 11, name: 'Paper sheet', selector: 'main.guide .paper', sizing: 'fill', aliases: ['body', 'prose', 'text'] },
  ],
  sizes: [
    { measure: 'inset-left', part: 3, token: '--pp-strip-x', views: ['desktop'] },
    { measure: 'inset-left', part: 2, token: '--pp-margin-x', views: ['desktop'] },
    { measure: 'inset-left', part: 4, token: '--pp-edge' },
    { measure: 'inset-right', part: 4, token: '--pp-edge' },
    { measure: 'padding-x', part: 4, token: '--pp-pad' },
    { measure: 'width', part: 6, token: '--pp-doc-nav-w', views: ['desktop'] },
    { measure: 'gap', part: 5, token: '--pp-doc-gap', between: [6, 7], views: ['desktop'] },
    { measure: 'gap', part: 5, token: '--pp-doc-gap', between: [7, 8], views: ['desktop'] },
    { measure: 'width', part: 8, token: '--pp-doc-toc-w', views: ['desktop'] },
    { measure: 'gap', part: 7, token: '--hf-space-10', between: [9, 10] },
    { measure: 'radius', part: 10, token: '--hf-radius-2xl' },
  ],
  number: 'JS-TP-0003',
  revision: 'C',
  drawn: '2026-11-18',
};
