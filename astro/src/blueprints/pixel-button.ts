import { onDesignSystem, type Blueprint } from './types';

/** PixelButton: the 8-bit link of the paper system. A coloured edge with a face inset on it, the
 *  label on top, and a hard shadow that steps on hover. Its root hugs its label. */
export const PIXEL_BUTTON: Blueprint = {
  id: 'pixel-button',
  kind: 'component',
  title: 'PixelButton',
  summary: 'The 8-bit button: a signal or outlined face inset on its edge, with a stepped hard shadow.',
  source: [
    'src/components/ui/PixelButton.astro',
    'src/components/ui/pixel-button.css',
    'src/styles/tokens/buttons.css',
  ],
  views: onDesignSystem('#pixel-button .ds-actions .pixel-button[data-variant="outline"]'),
  parts: [
    { id: 1, name: 'Button', selector: '', sizing: 'hug', aliases: ['link', 'pixel button'] },
    { id: 2, name: 'Edge', selector: '.pb-edge', sizing: 'fill', aliases: ['outline', 'border'] },
    { id: 3, name: 'Face', selector: '.pb-face', sizing: 'fill', aliases: ['fill', 'background', 'outline variant'] },
    { id: 4, name: 'Label slot', selector: '.pb-label', sizing: 'hug', slot: true, aliases: ['text', 'words'] },
  ],
  sizes: [
    { measure: 'padding-x', part: 1, token: '--pb-padding-x' },
    { measure: 'padding-y', part: 1, token: '--pb-padding-y' },
    { measure: 'min-height', part: 1, token: '--nt-hit' },
    { measure: 'radius', part: 2, token: '--pp-radius-md' },
    { measure: 'radius', part: 3, token: '--pp-radius-sm' },
  ],
  number: 'JS-UI-0002',
  revision: 'A',
  drawn: '2026-11-16',
};
