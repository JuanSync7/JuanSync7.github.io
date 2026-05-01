/**
 * Site-wide configuration. Edit this file to update headline numbers,
 * identity strings, and links across the whole site.
 *
 * Keep this small: only values that are reused, shown to the user as
 * "facts about me", or change more than once a year belong here.
 */

export const IDENTITY = {
  name: 'Shew Juan Kok',
  shortName: 'juan_kok',
  title: 'Senior Design Engineer',
  blurb: 'Senior Design Engineer — front-end design, verification, SoC architecture, synthesis & DFT.',
  cvFile: '/Kok_Shew_Juan_CV_2025.pdf',
} as const;

export const CONTACT = {
  email: 'kokshewjuan7_job@outlook.com',
  github: 'JuanSync7',
  linkedin: 'shewjuankok',
  linkedinUrl: 'https://www.linkedin.com/in/shewjuankok/',
} as const;

export const GITHUB = {
  user: CONTACT.github,
  apiUrl: `https://api.github.com/users/${CONTACT.github}/repos?sort=updated&per_page=100`,
  excludeRepos: ['juansync7.github.io'] as const,
  maxCards: 6,
} as const;

/**
 * Headline stats shown on the cockpit overview page.
 * Update these as your career advances.
 */
export const CAREER_STATS = {
  skills: 22,
  commits: 847,
  years: 5,
  tapeouts: 3,
  projects: 12,
} as const;

/**
 * Skill counts per category — drives the cockpit donut chart and
 * should match the lengths of the per-page skill arrays in cockpit-data.
 */
export const SKILL_BREAKDOWN = {
  asic: 6,
  ai: 5,
  eda: 6,
  script: 5,
} as const;
