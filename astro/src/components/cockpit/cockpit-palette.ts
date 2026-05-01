// Cockpit chart palette — values mirror tokens in styles/tokens/colors.css.
// Canvas drawing needs raw color strings, not CSS vars; keep these in sync.

export const GRAD = {
  greenYellow:    ['#22c55e', '#facc15'] as const,
  roseGold:       ['#f472b6', '#fbbf24'] as const,
  periwinkleMint: ['#818cf8', '#34d399'] as const,
  coralPurple:    ['#ff6b6b', '#a855f7'] as const,
  cyanMagenta:    ['#00d4ff', '#ff00aa'] as const,
  emeraldOrange:  ['#14b8a6', '#f97316'] as const,
  yellowRed:      ['#facc15', '#ef4444'] as const,
} as const;

export const PALETTE = {
  asic:     '#1ba0a0',
  ai:       '#ff6b6b',
  aiOrange: '#ffa94d',
  eda:      '#6ec8e6',
  script:   '#c8d837',
  track:    '#1a2230',
  inkSoft:  '#7a9a88',
  inkMuted: '#4a6a55',
  ink:      '#e4ecd8',
  inkPale:  '#c0d8cc',
  panel2:   '#2a3a50',
  okGreen:  '#22c55e',
  warnYel:  '#facc15',
} as const;

export const TICKER_MSG =
  'SKILLS: <b>22</b> | COMMITS: <b>847</b> | TAPE_OUTS: <b>3</b> | YEARS_EXP: <b>5</b> | COVERAGE: <b>98.7%</b> | LANGUAGES: <b>6</b> | TOOLS: <b>12</b> | PROJECTS: <b>12</b> | CERTIFICATIONS: <b>2</b> | PUBLICATIONS: <b>1</b> | GIT_STREAK: <b>14d</b>';
