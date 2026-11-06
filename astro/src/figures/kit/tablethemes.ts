import type { PropKind } from './tableprops';

export const TABLE_ASPECT = 1.5;
export const THEMES = [
  { id: 'dining', name: 'Dining table', w: 9.2, d: 5.4, height: 1.65, surface: 'oval', minItems: 10, targetItems: 12 },
  { id: 'work', name: 'Work desk', w: 9.2, d: 5.2, height: 1.65, surface: 'rect', minItems: 11, targetItems: 14 },
  {
    id: 'computer',
    name: 'Computer setup',
    w: 9.6,
    d: 5.2,
    height: 1.7,
    surface: 'chamfer',
    minItems: 11,
    targetItems: 14,
  },
  { id: 'storage', name: 'Storage desk', w: 9.2, d: 5.2, height: 1.75, surface: 'rect', minItems: 11, targetItems: 14 },
  { id: 'messy', name: 'Messy desk', w: 9.2, d: 5.6, height: 1.6, surface: 'chamfer', minItems: 14, targetItems: 18 },
  { id: 'study', name: 'Study desk', w: 8.8, d: 5.2, height: 1.65, surface: 'rect', minItems: 11, targetItems: 14 },
  {
    id: 'kitchen',
    name: 'Kitchen countertop',
    w: 9.2,
    d: 5.6,
    height: 1.9,
    surface: 'rect',
    minItems: 11,
    targetItems: 15,
  },
  { id: 'bar', name: 'Bar table', w: 10, d: 3.8, height: 2.3, surface: 'chamfer', minItems: 10, targetItems: 13 },
  { id: 'lab', name: 'Lab bench', w: 9.2, d: 5.4, height: 1.8, surface: 'rect', minItems: 12, targetItems: 15 },
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
