import { between, type Rng } from './rng';
import type { PropKind } from './tableprops';

export const THEMES = [
  { id: 'dining', name: 'Dining table', w: 7.6, d: 4.2, base: 'wood' },
  { id: 'work', name: 'Work desk', w: 7.8, d: 4.4, base: 'desk' },
  { id: 'computer', name: 'Computer setup', w: 8, d: 4.4, base: 'desk' },
  { id: 'storage', name: 'Storage desk', w: 7.8, d: 4.4, base: 'storage' },
  { id: 'messy', name: 'Messy desk', w: 7.8, d: 4.6, base: 'desk' },
  { id: 'study', name: 'Study desk', w: 7.6, d: 4.4, base: 'wood' },
  { id: 'kitchen', name: 'Kitchen countertop', w: 7.8, d: 4.4, base: 'kitchen' },
  { id: 'bar', name: 'Bar table', w: 7.8, d: 3.6, base: 'bar' },
  { id: 'lab', name: 'Lab bench', w: 8, d: 4.6, base: 'steel' },
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
export function recipe(theme: ThemeId, rng: Rng, mirror: number): Intent[] {
  const all: Intent[] = [];
  const slot = (
    kind: PropKind,
    x: number,
    z: number,
    role: string = kind,
    required = true,
    jitter = 0.28,
    angle = 0.05,
  ): void => {
    all.push({ kind, x: x * mirror, z, role, required, jitter, angle, scale: between(rng, 0.86, 1.04) });
  };
  const extra = (kind: PropKind, x: number, z: number): void => {
    if (rng() < 0.8) slot(kind, x, z, kind, false, 0.28, 0.16);
  };
  if (theme === 'dining') {
    for (const x of [-2.05, 2.05]) {
      slot('setting', x, 0.5, 'place setting');
      slot('wineglass', x + 0.4, -1, 'drink');
    }
    slot('bowl', 0, 0.55, 'serving dish');
    extra(rng() < 0.5 ? 'candle' : 'bottle', 0, -1.2);
  } else if (theme === 'computer') {
    slot('monitor', -0.3, -1, 'display');
    slot('keyboard', -0.3, 0.85, 'input');
    slot('mouse', 1.15, 0.85, 'pointing device');
    slot('tower', 2.55, -0.95, 'computer');
    slot('speaker', -1.75, -0.9, 'left speaker', false);
    slot('speaker', 1.15, -1, 'right speaker', false);
    extra('headphones', -2.6, 0.45);
    extra('mug', 2.6, 0.85);
    extra('plant', -3, -1.25);
  } else if (theme === 'work') {
    slot('laptop', -0.75, -0.85, 'workstation');
    slot('notebook', 0.1, 0.95, 'writing');
    slot('penholder', -2.6, -1, 'stationery');
    slot('files', 2.4, -0.9, 'reference');
    extra('phone', 1.9, 0.95);
    extra('mug', -2.5, 0.9);
    extra('tasklamp', 0.95, -1.15);
  } else if (theme === 'storage') {
    slot('files', -2.55, -0.95, 'archive');
    slot('box', -0.65, -0.95, 'stored supplies');
    slot('box', 1.15, -0.95, 'stored supplies');
    slot('organizer', 0.25, 1, 'sorting');
    extra('box', 2.85, -0.95);
    extra('jar', -2.2, 0.95);
    extra('notebook', 2.5, 1);
  } else if (theme === 'messy') {
    slot('laptop', -1.65, -1, 'workstation', true, 0.25, 0.18);
    slot('books', 1.8, -1.1, 'reference', true, 0.35, 0.55);
    slot('paper', -0.55, 0.6, 'loose notes', true, 0.3, 0.65);
    slot('paper', 0.9, 0.8, 'loose notes', true, 0.35, 0.65);
    slot('mug', 2.85, 0.7, 'coffee', true, 0.25, 0.8);
    slot('crumple', -2.7, 0.8, 'discarded draft', true, 0.35, 1);
    slot('paper', -1.9, 1.4, 'loose notes', true, 0.3, 0.65);
    slot('crumple', -0.2, -0.8, 'discarded draft', true, 0.3, 1);
    extra('crumple', 1.9, 1.5);
    extra('phone', 0.1, -1.35);
    extra('penholder', -3, -1.15);
    extra('paper', 2.95, -1.25);
  } else if (theme === 'study') {
    slot('openbook', -0.25, 0.8, 'reading');
    slot('notebook', 1.65, 0.85, 'writing');
    slot('books', -2.3, -0.9, 'reference');
    slot('tasklamp', -0.65, -1.1, 'reading light');
    extra('penholder', 1.35, -1.2);
    extra('mug', 2.8, -0.65);
    extra('phone', -2.5, 0.9);
  } else if (theme === 'kitchen') {
    slot('prepboard', -0.45, 0.7, 'food preparation');
    slot('pot', 1.8, -0.9, 'cooking');
    slot('bottle', -2.65, -1, 'oil');
    slot('spicejar', -0.1, -1.2, 'seasoning');
    extra('spicejar', 0.7, -1.2);
    extra('bowl', 2.55, 0.9);
    extra('mug', -2.7, 0.9);
  } else if (theme === 'bar') {
    slot('bottle', -2.3, -0.85, 'spirits');
    slot('bottle', 2.3, -0.85, 'spirits');
    slot('shaker', 0, -0.9, 'mixing');
    slot('wineglass', -1.3, 0.85, 'serving');
    slot('wineglass', 0.3, 0.85, 'serving');
    slot('jigger', 1.5, 0.8, 'measuring');
    extra('tumbler', 2.8, 0.85);
    extra('bowl', -2.85, 0.85);
  } else {
    slot('microscope', 0, -1, 'instrument');
    slot('tuberack', -2.25, -0.95, 'samples');
    slot('flask', 0.9, 0.85, 'reaction');
    slot('beaker', -0.65, 0.85, 'measuring');
    slot('petridish', -2.4, 0.85, 'culture');
    extra('pipette', 2.5, 0.95);
    extra('box', 2.35, -1.05);
  }
  return all;
}
