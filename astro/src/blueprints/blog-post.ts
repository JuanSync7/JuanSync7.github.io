import { onPage, type Blueprint } from './types';

/** The blog post page: the paper page column holding the document grid (the pane of other posts,
 *  the article, On this page), and in the article the header, the cover and the body. Below
 *  1180 px the contents column goes; below 900 px the pane folds into a button. */
export const BLOG_POST: Blueprint = {
  id: 'blog-post',
  kind: 'template',
  title: 'Blog post page',
  summary: 'A post in the docs layout: other posts on the left, the article, its contents on the right.',
  source: ['src/pages/blog/[...slug].astro', 'src/components/docs/DocLayout.astro', 'src/components/docs/docs.css', 'src/styles/paper.css', 'src/styles/tokens/paper.css'], // prettier-ignore
  views: onPage('/blog/timing-closure/', 'main.post'),
  parts: [
    { id: 1, name: 'Page column', selector: '', sizing: 'fill', aliases: ['page', 'main'] },
    { id: 2, name: 'Document grid', selector: '.doc', sizing: 'fill', aliases: ['layout', 'three columns'] },
    { id: 3, name: 'Posts pane', selector: '.doc-pane', sizing: 'fixed', views: ['desktop'], aliases: ['sidebar', 'left column', 'navigation'] }, // prettier-ignore
    { id: 4, name: 'Article column', selector: '.doc-main', sizing: 'fill', aliases: ['article', 'middle column', 'text column'] }, // prettier-ignore
    { id: 5, name: 'On this page', selector: '.doc-toc', sizing: 'fixed', views: ['desktop'], aliases: ['contents', 'table of contents', 'right column'] }, // prettier-ignore
    { id: 6, name: 'Post header', selector: '.head', sizing: 'fill', aliases: ['title', 'heading'] },
    { id: 7, name: 'Cover', selector: '.cover', sizing: 'fill', aliases: ['hero image', 'figure'] },
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
  number: 'JS-TP-0001',
  revision: 'A',
  drawn: '2026-11-16',
};
