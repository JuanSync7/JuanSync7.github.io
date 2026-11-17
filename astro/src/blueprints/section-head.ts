import { onDesignSystem, type Blueprint } from './types';

/** SectionHead: the mono label, the two-tone heading and the lead that open a section. A column
 *  that fills its parent up to the reading measure. */
export const SECTION_HEAD: Blueprint = {
  id: 'section-head',
  kind: 'component',
  title: 'SectionHead',
  summary: 'The opening of a section: a mono label, a two-tone heading and a lead, kept to the reading measure.',
  source: ['src/components/ui/SectionHead.astro', 'src/styles/tokens/typography.css'],
  views: onDesignSystem('#components .ds-stage .head'),
  parts: [
    { id: 1, name: 'Head', selector: '', sizing: 'fill', aliases: ['section heading', 'section head'] },
    { id: 2, name: 'Label', selector: '.label', sizing: 'fill', aliases: ['eyebrow', 'kicker', 'comment'] },
    { id: 3, name: 'Title', selector: '.title', sizing: 'fill', aliases: ['heading', 'headline'] },
    { id: 4, name: 'Lead', selector: '.lead', sizing: 'fill', aliases: ['intro', 'summary', 'subtitle'] },
  ],
  sizes: [
    { measure: 'max-width', part: 1, token: '--nt-measure' },
    { measure: 'gap', part: 1, token: '--hf-space-4', between: [2, 3] },
    { measure: 'font-size', part: 2, token: '--nt-fs-meta' },
    { measure: 'font-size', part: 3, token: '--nt-fs-h2' },
    { measure: 'font-size', part: 4, token: '--nt-fs-intro' },
  ],
  number: 'JS-UI-0003',
  revision: 'A',
  drawn: '2026-11-16',
};
