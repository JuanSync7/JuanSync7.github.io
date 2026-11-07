import type { PropKind } from './tableprops';

export const TABLE_ASPECT = 1.8;
export const THEMES = [
  { id: 'dining', name: 'Dining table', w: 9.2, d: 5.4, height: 1.65, surface: 'oval', minItems: 16, targetItems: 22 },
  { id: 'work', name: 'Work desk', w: 9.2, d: 5.2, height: 1.65, surface: 'rect', minItems: 19, targetItems: 26 },
  {
    id: 'computer',
    name: 'Computer setup',
    w: 9.6,
    d: 5.2,
    height: 1.7,
    surface: 'chamfer',
    minItems: 19,
    targetItems: 26,
  },
  { id: 'storage', name: 'Storage desk', w: 9.2, d: 5.2, height: 1.75, surface: 'rect', minItems: 19, targetItems: 26 },
  { id: 'messy', name: 'Messy desk', w: 9.2, d: 5.6, height: 1.6, surface: 'chamfer', minItems: 25, targetItems: 34 },
  { id: 'study', name: 'Study desk', w: 8.8, d: 5.2, height: 1.65, surface: 'rect', minItems: 19, targetItems: 26 },
  {
    id: 'kitchen',
    name: 'Kitchen countertop',
    w: 9.2,
    d: 5.6,
    height: 1.9,
    surface: 'rect',
    minItems: 20,
    targetItems: 28,
  },
  { id: 'bar', name: 'Bar table', w: 10, d: 3.8, height: 2.3, surface: 'chamfer', minItems: 18, targetItems: 25 },
  { id: 'lab', name: 'Lab bench', w: 9.2, d: 5.4, height: 1.8, surface: 'rect', minItems: 21, targetItems: 28 },
] as const;
export type TableTheme = (typeof THEMES)[number];
export type ThemeId = TableTheme['id'];
export interface Intent {
  kind: PropKind;
  role: string;
  x: number;
  z: number;
  required: boolean;
  jitter: number;
  angle: number;
  scale: number;
}
