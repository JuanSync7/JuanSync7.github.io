import { onPage, type Blueprint } from './types';

/** A presentation landing page (the vault's): a hero of copy beside a sticky drawing, then
 *  chapters and sections, each opening with a comment, a title and a body. */
export const PRESENTATION: Blueprint = {
  id: 'presentation',
  kind: 'template',
  title: 'Presentation page',
  summary: 'A landing page that pitches, then leads to guides: hero copy beside a drawing, then sections.',
  source: ['src/pages/vault/index.astro', 'src/layouts/PresentationLayout.astro', 'src/components/vault/vault-overview.css', 'src/styles/tokens/presentation.css'], // prettier-ignore
  views: onPage('/vault/', 'main'),
  parts: [
    { id: 1, name: 'Page', selector: '', sizing: 'fill', aliases: ['main'] },
    { id: 2, name: 'Hero', selector: '.vault-hero', sizing: 'fill', aliases: ['opening', 'landing'] },
    { id: 3, name: 'Hero copy', selector: '.vault-hero-copy', sizing: 'fill', aliases: ['text', 'pitch'] },
    { id: 4, name: 'Drawing stage', selector: '.vault-cabinet-stage', sizing: 'fill', aliases: ['cabinet', 'figure'] },
    { id: 5, name: 'Lead', selector: '.vault-lead', sizing: 'fill', aliases: ['intro', 'body'] },
    { id: 6, name: 'Actions', selector: '.vault-actions', sizing: 'hug', phone: 'fill', aliases: ['buttons'] },
  ],
  sizes: [
    { measure: 'padding-y', part: 2, token: '--nt-section-y', views: ['desktop'] },
    { measure: 'padding-y', part: 2, token: '--nt-section-y-tight', views: ['phone'] },
    { measure: 'gap', part: 2, token: '--hf-space-16', between: [3, 4], views: ['desktop'] },
    { measure: 'gap', part: 2, token: '--hf-space-12', between: [3, 4], views: ['phone'] },
    { measure: 'max-width', part: 5, token: '--nt-measure' },
    { measure: 'gap', part: 6, token: '--hf-space-5', views: ['desktop'] },
    { measure: 'gap', part: 6, token: '--hf-space-4', views: ['phone'] },
  ],
  number: 'JS-TP-0006',
  revision: 'A',
  drawn: '2026-11-16',
};
