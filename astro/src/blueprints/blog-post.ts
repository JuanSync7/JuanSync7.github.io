import { onPage, type Blueprint } from './types';

/** The blog post page: the notepad (punched strip and margin line, then the page column clear of
 *  them) holding the document grid (the pane of other posts, the article, On this page), and in the
 *  article the header and the cover. The article holds the reading measure (--pp-doc-measure, 70 to 81
 *  characters a line) and centres in its column, so a wider screen widens the gaps, not the lines;
 *  presentation:browser measures it. Below 1180 px the contents column goes; below 900 px the pane
 *  folds into a button and the notepad furniture is not drawn. */
export const BLOG_POST: Blueprint = {
  id: 'blog-post',
  kind: 'template',
  title: 'Blog post page',
  summary: 'A post in the docs layout: other posts on the left, the article, its contents on the right.',
  source: ['src/pages/blog/[...slug].astro', 'src/components/docs/DocLayout.astro', 'src/components/docs/docs.css', 'src/styles/paper.css', 'src/styles/tokens/paper.css', 'src/layouts/PaperLayout.astro'], // prettier-ignore
  views: onPage('/blog/timing-closure/', '.pp-page'),
  parts: [
    { id: 1, name: 'Page', selector: '', sizing: 'fill', aliases: ['notepad', 'sheet', 'window'] },
    { id: 2, name: 'Margin line', selector: '', pseudo: '::before', sizing: 'fixed', views: ['desktop'], aliases: ['orange line', 'red line', 'punch hole line'] }, // prettier-ignore
    { id: 3, name: 'Punched strip', selector: '', pseudo: '::after', sizing: 'fixed', views: ['desktop'], aliases: ['holes', 'punch holes', 'binding'] }, // prettier-ignore
    { id: 4, name: 'Page column', selector: 'main.post', sizing: 'fill', aliases: ['page', 'main'] },
    { id: 5, name: 'Document grid', selector: 'main.post .doc', sizing: 'fill', aliases: ['layout', 'three columns'] },
    { id: 6, name: 'Posts pane', selector: 'main.post .doc-pane', sizing: 'fixed', views: ['desktop'], aliases: ['sidebar', 'left column', 'navigation'] }, // prettier-ignore
    { id: 7, name: 'Article column', selector: 'main.post .doc-main', sizing: 'fill', aliases: ['article', 'middle column', 'text column'] }, // prettier-ignore
    { id: 8, name: 'On this page', selector: 'main.post .doc-toc', sizing: 'fixed', views: ['desktop'], aliases: ['contents', 'table of contents', 'right column'] }, // prettier-ignore
    { id: 9, name: 'Post header', selector: 'main.post .head', sizing: 'fill', aliases: ['title', 'heading'] },
    { id: 10, name: 'Cover', selector: 'main.post .cover', sizing: 'fill', aliases: ['hero image', 'figure'] },
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
  number: 'JS-TP-0001',
  revision: 'C',
  drawn: '2026-11-18',
};
