import { onPage, type Blueprint } from './types';

/** The paper navigation bar at the top of every public page, in three zones: who (monogram, name
 *  and role), where (the pages, the current one tabbed) and tools (theme and CV). On a phone the
 *  pages fold behind a menu button into a list under the bar. */
export const PAPER_NAV: Blueprint = {
  id: 'paper-nav',
  kind: 'template',
  title: 'PaperNav',
  summary: 'The top bar of every page: who, where and tools; a menu button on a phone.',
  source: ['src/components/layout/PaperNav.astro', 'src/styles/paper.css', 'src/styles/tokens/paper.css'],
  views: onPage('/', '.pp-nav'),
  parts: [
    { id: 1, name: 'Nav bar', selector: '', sizing: 'fill', aliases: ['header', 'top bar', 'navigation'] },
    { id: 2, name: 'Row', selector: '.pp-nav-inner', sizing: 'fill', aliases: ['inner row', 'three zones'] },
    { id: 3, name: 'Brand', selector: '.brand', sizing: 'hug', aliases: ['who', 'name', 'home link'] },
    { id: 4, name: 'Monogram', selector: '.brand-mark', sizing: 'hug', aliases: ['logo', 'SJ'] },
    {
      id: 5,
      name: 'Pages',
      selector: '.links ul',
      sizing: 'hug',
      views: ['desktop'],
      aliases: ['where', 'menu', 'nav links'],
    },
    { id: 6, name: 'Page link', selector: '.links ul a', sizing: 'hug', views: ['desktop'], aliases: ['tab'] },
    { id: 7, name: 'Tools', selector: '.tools', sizing: 'fill', phone: 'hug', aliases: ['right side'] },
    {
      id: 8,
      name: 'Theme button',
      selector: '.theme',
      sizing: 'fixed',
      aliases: ['dark mode', 'light mode', 'sun', 'moon'],
    },
    { id: 9, name: 'CV button', selector: '.cv-bar', sizing: 'hug', views: ['desktop'], aliases: ['download CV'] },
    { id: 10, name: 'Menu button', selector: '.menu', sizing: 'fixed', views: ['phone'], aliases: ['hamburger'] },
  ],
  sizes: [
    { measure: 'padding-x', part: 2, token: '--pp-pad' },
    { measure: 'min-height', part: 2, token: '--pp-nav-h' },
    { measure: 'gap', part: 3, token: '--hf-space-3' },
    { measure: 'height', part: 4, token: '--pp-nav-mark-h' },
    { measure: 'gap', part: 5, token: '--hf-space-1', views: ['desktop'] },
    { measure: 'padding-x', part: 6, token: '--hf-space-3', views: ['desktop'] },
    { measure: 'gap', part: 7, token: '--hf-space-3' },
    { measure: 'width', part: 8, token: '--pp-nav-icon' },
    { measure: 'height', part: 8, token: '--pp-nav-icon' },
    { measure: 'min-height', part: 9, token: '--pp-nav-icon', views: ['desktop'] },
    { measure: 'height', part: 10, token: '--pp-nav-icon', views: ['phone'] },
  ],
  number: 'JS-LY-0001',
  revision: 'B',
  drawn: '2026-11-17',
};
