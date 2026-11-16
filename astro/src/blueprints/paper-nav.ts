import { onPage, type Blueprint } from './types';

/** The paper navigation bar at the top of every public page: the monogram, the links, the CV and
 *  the theme button in one row; on a phone the links fold behind a menu button. */
export const PAPER_NAV: Blueprint = {
  id: 'paper-nav',
  kind: 'template',
  title: 'PaperNav',
  summary: 'The top bar of every page: monogram, links, CV and theme button; a menu button on a phone.',
  source: ['src/components/layout/PaperNav.astro', 'src/styles/paper.css', 'src/styles/tokens/paper.css'],
  views: onPage('/', '.pp-nav'),
  parts: [
    { id: 1, name: 'Nav bar', selector: '', sizing: 'fill', aliases: ['header', 'top bar', 'navigation'] },
    { id: 2, name: 'Row', selector: '.pp-nav-inner', sizing: 'fill', aliases: ['inner row'] },
    { id: 3, name: 'Monogram', selector: '.mark', sizing: 'hug', aliases: ['logo', 'SJ', 'home link'] },
    {
      id: 4,
      name: 'Links',
      selector: '#pp-menu ul',
      sizing: 'hug',
      views: ['desktop'],
      aliases: ['menu', 'nav links'],
    },
    {
      id: 5,
      name: 'Theme button',
      selector: '.theme',
      sizing: 'hug',
      aliases: ['dark mode', 'light mode', 'sun', 'moon'],
    },
    { id: 6, name: 'Menu button', selector: '.menu', sizing: 'fixed', views: ['phone'], aliases: ['hamburger'] },
  ],
  sizes: [
    { measure: 'padding-x', part: 2, token: '--pp-pad' },
    { measure: 'padding-y', part: 2, token: '--hf-space-4' },
    { measure: 'gap', part: 4, token: '--pp-nav-link-gap', views: ['desktop'] },
    { measure: 'min-height', part: 5, token: '--nt-hit' },
    { measure: 'radius', part: 5, token: '--pp-radius-md' },
    { measure: 'min-height', part: 6, token: '--nt-hit', views: ['phone'] },
  ],
  number: 'JS-LY-0001',
  revision: 'A',
  drawn: '2026-11-16',
};
