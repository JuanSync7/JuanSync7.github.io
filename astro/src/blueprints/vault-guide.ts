import { onPage, type Blueprint } from './types';

/** A vault field guide: one reading column (the measure with room for diagrams) holding the head,
 *  the row of sibling guides, the guide itself and its end. */
export const VAULT_GUIDE: Blueprint = {
  id: 'vault-guide',
  kind: 'template',
  title: 'Vault guide page',
  summary: 'A focused guide behind a presentation page: one reading column with its head, guide links and end.',
  source: [
    'src/layouts/VaultGuide.astro',
    'src/components/vault/vault-guide.css',
    'src/styles/tokens/presentation.css',
  ],
  views: onPage('/vault/architecture/', '.vault-guide'),
  parts: [
    { id: 1, name: 'Guide', selector: '', sizing: 'fill', aliases: ['page', 'article'] },
    { id: 2, name: 'Head', selector: '.vg-head', sizing: 'fill', aliases: ['heading', 'title', 'intro'] },
    { id: 3, name: 'Guide links', selector: '.vg-nav', sizing: 'fill', aliases: ['tabs', 'other guides'] },
    { id: 4, name: 'Content', selector: '.vg-content', sizing: 'fill', aliases: ['body', 'text'] },
  ],
  sizes: [
    { measure: 'padding-x', part: 1, token: '--nt-gutter' },
    { measure: 'padding-y', part: 1, token: '--nt-section-y-tight' },
    { measure: 'max-width', part: 2, token: '--pr-guide-w' },
    { measure: 'gap', part: 2, token: '--hf-space-5' },
    { measure: 'max-width', part: 4, token: '--pr-guide-w' },
  ],
  number: 'JS-TP-0009',
  revision: 'A',
  drawn: '2026-11-16',
};
