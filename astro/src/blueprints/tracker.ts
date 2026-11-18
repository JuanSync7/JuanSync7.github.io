import { onPage, type Blueprint } from './types';

/** A tracker page: the version history as a rail on the left and the release in the main panel,
 *  centred in the room beside it; on a phone the rail goes above. Same shell for all three. */
export const TRACKER: Blueprint = {
  id: 'tracker',
  kind: 'template',
  title: 'Tracker page',
  summary: 'A tracker release: the version rail on the left, the main panel centred beside it.',
  source: ['src/layouts/TrackerLayout.astro', 'src/pages/trackers/inference-engines/[...slug].astro', 'src/components/trackers/_chrome.css', 'src/styles/tokens/paper.css'], // prettier-ignore
  views: onPage('/trackers/inference-engines/', 'main.wrap'),
  parts: [
    { id: 1, name: 'Page column', selector: '', sizing: 'fill', aliases: ['page', 'wrap'] },
    { id: 2, name: 'Tracker grid', selector: '.tracker-grid', sizing: 'fill', aliases: ['layout'] },
    { id: 3, name: 'Version rail', selector: '.tracker-side', sizing: 'fixed', views: ['desktop'], aliases: ['timeline', 'versions', 'left column'] }, // prettier-ignore
    { id: 4, name: 'Main panel', selector: '.tracker-main', sizing: 'fill', aliases: ['release', 'content'] },
  ],
  sizes: [
    { measure: 'width', part: 3, token: '--pp-tracker-rail-w', views: ['desktop'] },
    { measure: 'gap', part: 2, token: '--pp-tracker-gap', between: [3, 4], views: ['desktop'] },
    { measure: 'max-width', part: 4, token: '--pp-tracker-main-w' },
  ],
  number: 'JS-TP-0007',
  revision: 'A',
  drawn: '2026-11-16',
};
