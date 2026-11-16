import type { Blueprint } from './types';

/** PaperAction: a link or button with a paper face, a printed edge under it, a label and an
 *  optional icon. Its root hugs its content; the face fills the root. */
export const PAPER_ACTION: Blueprint = {
  id: 'paper-action',
  title: 'PaperAction',
  source: [
    'src/components/ui/PaperAction.astro',
    'src/components/ui/paper-action.css',
    'src/styles/tokens/buttons.css',
  ],
  demo: '.ds-actions .paper-action',
  parts: [
    { name: 'Action', selector: '', sizing: 'hug' },
    { name: 'Face', selector: '.pa-face', sizing: 'fill' },
    { name: 'Label slot', selector: '.pa-label', sizing: 'hug', slot: true },
    { name: 'Icon slot', selector: '.pa-icon', sizing: 'hug', slot: true },
  ],
  sizes: [
    { measure: 'padding-x', part: '.pa-face', token: '--pa-padding-x' },
    { measure: 'padding-y', part: '.pa-face', token: '--pa-padding-y' },
    { measure: 'gap', part: '.pa-face', token: '--pa-gap' },
    { measure: 'min-height', part: '.pa-face', token: '--pa-min-height' },
    { measure: 'border', part: '.pa-face', token: '--pa-line-width' },
    { measure: 'radius', part: '.pa-face', token: '--pa-radius' },
    { measure: 'edge-x', part: '.pa-face', token: '--pa-edge-x' },
    { measure: 'edge-y', part: '.pa-face', token: '--pa-edge-y' },
  ],
  number: 'JS-UI-0001',
  revision: 'A',
  drawn: '2026-11-16',
};
