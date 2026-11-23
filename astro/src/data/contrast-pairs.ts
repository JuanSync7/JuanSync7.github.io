/** The colour pairs the site relies on to be read, each with what WCAG 2.2 (ISO/IEC 40500:2025)
 *  asks of it: `text`, `large` or `decorative`, with the thresholds in `NEED` (src/lib/tokens, synced
 *  from frontend-kit's design-tokens). `npm run standards:check` fails when a pair drops below its
 *  requirement in either theme. */

import type { ContrastGroup } from '../lib/tokens';

export const CONTRAST: ContrastGroup[] = [
  {
    title: 'Paper system · every public page',
    pairs: [
      { role: 'Headings', fg: '--pp-ink-strong', ground: '--pp-ground', need: 'text' },
      { role: 'Body text', fg: '--pp-ink', ground: '--pp-ground', need: 'text' },
      { role: 'Comments, captions', fg: '--pp-ink-muted', ground: '--pp-ground', need: 'text' },
      { role: 'Reading: post title', fg: '--pp-read-title', ground: '--pp-ground', need: 'text' },
      { role: 'Reading: section heading', fg: '--pp-read-h2', ground: '--pp-ground', need: 'text' },
      { role: 'Reading: subheading', fg: '--pp-read-h3', ground: '--pp-ground', need: 'text' },
      { role: 'Reading: minor heading', fg: '--pp-read-h4', ground: '--pp-ground', need: 'text' },
      { role: 'Reading: body text', fg: '--pp-read-body', ground: '--pp-ground', need: 'text' },
      { role: 'Reading: side panels', fg: '--pp-read-nav', ground: '--pp-ground', need: 'text' },
      { role: 'Orange text', fg: '--pp-signal-text', ground: '--pp-ground', need: 'text' },
      {
        role: 'Orange fills and rules',
        fg: '--pp-signal',
        ground: '--pp-ground',
        need: 'large',
        note: 'fills, rules and large type only; small text stays in ink',
      },
      { role: 'Button label on orange', fg: '--pp-on-signal', ground: '--pp-signal', need: 'text' },
      { role: 'Paper button label', fg: '--pp-ink-strong', ground: '--pp-face', need: 'text' },
      { role: 'Paper button border', fg: '--pp-face-line', ground: '--pp-ground', need: 'large' },
      { role: 'Diagram arrows', fg: '--pp-arrow', ground: '--pp-ground', need: 'large' },
      { role: 'Code', fg: '--pp-term-ink', ground: '--pp-term-ground', need: 'text' },
      { role: 'Code comments', fg: '--pp-term-muted', ground: '--pp-term-ground', need: 'text' },
      {
        role: 'Outline hairline',
        fg: '--pp-outline',
        ground: '--pp-ground',
        need: 'decorative',
        note: 'the label identifies an outlined control; the line only groups it',
      },
      {
        role: 'Rule hairline',
        fg: '--pp-rule',
        ground: '--pp-ground',
        need: 'decorative',
        note: 'separates rows that already read apart',
      },
    ],
  },
  {
    title: 'Library archive · /library/',
    pairs: [
      { role: 'Spine title, first fill', fg: '--pp-ink-strong', ground: '--pp-lib-binder-a', need: 'text' },
      { role: 'Spine title, second fill', fg: '--pp-ink-strong', ground: '--pp-lib-binder-b', need: 'text' },
      { role: 'Spine title, third fill', fg: '--pp-ink-strong', ground: '--pp-lib-binder-c', need: 'text' },
      { role: 'Binder number', fg: '--pp-ink-strong', ground: '--pp-lib-paper', need: 'text' },
      { role: 'Paper: title', fg: '--pp-ink-strong', ground: '--pp-lib-paper', need: 'text' },
      { role: 'Paper: summary', fg: '--pp-ink', ground: '--pp-lib-paper', need: 'text' },
      { role: 'Paper: shelf, date and read time', fg: '--pp-ink-muted', ground: '--pp-lib-paper', need: 'text' },
      { role: 'Binder outline', fg: '--pp-lib-binder-line', ground: '--pp-ground', need: 'large' },
      {
        role: 'Spine hatching',
        fg: '--pp-lib-hatch',
        ground: '--pp-lib-binder-a',
        need: 'decorative',
        note: 'shades the spine edge; the outline carries the shape',
      },
    ],
  },
  {
    title: 'Night system · the figure bench',
    pairs: [
      { role: 'Headings', fg: '--nt-ink-strong', ground: '--nt-ground', need: 'text' },
      { role: 'Body text', fg: '--nt-ink', ground: '--nt-ground', need: 'text' },
      { role: 'Comments, captions', fg: '--nt-ink-muted', ground: '--nt-ground', need: 'text' },
      { role: 'Signal text (figure bench)', fg: '--nt-signal-text', ground: '--nt-ground', need: 'text' },
      { role: 'Code', fg: '--nt-code-ink', ground: '--nt-code-ground', need: 'text' },
      { role: 'Code comments', fg: '--nt-code-muted', ground: '--nt-code-ground', need: 'text' },
    ],
  },
];
