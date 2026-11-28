/** The footer: its joke and part line, every destination grouped, and the title block. Kept apart from
 *  the home page's data, so a new footer link never pushes that file past its budget. */

export const FOOTER = {
  joke: 'Built by agents, checked like silicon, and it still met timing.',
  part: 'JUAN-SOC-1999-X1 · rev. 2026 · ed. 03',
} as const;

export const FOOTER_GROUPS = [
  {
    label: '// pages',
    links: [
      { label: 'About', href: '/about/' },
      { label: 'Blog', href: '/blog/' },
      { label: 'Library', href: '/library/' },
      { label: 'Playbooks', href: '/playbooks/' },
      { label: 'Formats', href: '/formats/' },
      { label: 'Lab', href: '/lab/' },
      { label: 'Vault', href: '/vault/' },
      { label: 'Anatomy', href: '/anatomy/chip-package/' },
      { label: 'Design system', href: '/design-system/' },
      { label: 'Site index', href: '/site-index/' },
    ],
  },
  {
    label: '// on the home page',
    links: [
      { label: 'System', href: '/#system' },
      { label: 'The vault', href: '/#the-vault' },
      { label: 'Work', href: '/#work' },
      { label: 'Thinking', href: '/#thinking' },
    ],
  },
] as const;

/** The footer's title block, as on an engineering drawing. */
export const TITLE_BLOCK = [
  { label: 'Drawn by', value: 'Juan Kok' },
  { label: 'Part no.', value: 'JUAN-SOC-1999-X1' },
  { label: 'Rev', value: '2026' },
  { label: 'Edition', value: '03' },
  { label: 'Sheet', value: '1 of 1' },
] as const;
