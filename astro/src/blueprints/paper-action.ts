import { onDesignSystem, type Blueprint } from './types';

/** PaperAction: a link or button with a paper face, a printed edge under it, a label and an
 *  optional icon, given only when it says something (a + that opens a note), never a default arrow. Its root hugs its content; the face fills the root. */
export const PAPER_ACTION: Blueprint = {
  id: 'paper-action',
  kind: 'component',
  title: 'PaperAction',
  summary: 'A printed paper button: a cream face on a printed edge, a label and an optional icon.',
  source: [
    'src/components/ui/PaperAction.astro',
    'src/components/ui/paper-action.css',
    'src/styles/tokens/buttons.css',
  ],
  views: onDesignSystem('#paper-actions .ds-actions .paper-action:has(.pa-icon)'),
  parts: [
    { id: 1, name: 'Action', selector: '', sizing: 'hug', aliases: ['button', 'link'] },
    { id: 2, name: 'Face', selector: '.pa-face', sizing: 'fill', aliases: ['paper', 'card face'] },
    { id: 3, name: 'Label slot', selector: '.pa-label', sizing: 'hug', slot: true, aliases: ['text', 'words'] },
    { id: 4, name: 'Icon slot', selector: '.pa-icon', sizing: 'hug', slot: true, aliases: ['icon', 'plus'] },
  ],
  sizes: [
    { measure: 'padding-x', part: 2, token: '--pa-padding-x' },
    { measure: 'padding-y', part: 2, token: '--pa-padding-y' },
    { measure: 'gap', part: 2, token: '--pa-gap', between: [3, 4] },
    { measure: 'min-height', part: 2, token: '--pa-min-height' },
    { measure: 'border', part: 2, token: '--pa-line-width' },
    { measure: 'radius', part: 2, token: '--pa-radius' },
    { measure: 'edge-x', part: 2, token: '--pa-edge-x' },
    { measure: 'edge-y', part: 2, token: '--pa-edge-y' },
  ],
  number: 'JS-UI-0001',
  revision: 'C',
  drawn: '2026-11-17',
};
