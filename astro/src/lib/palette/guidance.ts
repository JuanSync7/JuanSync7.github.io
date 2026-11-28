import { contrast } from './color';
import { pick, type Token } from './shades';

/** A text or mark against what it sits on, with the WCAG 2.2 floor and the band that reads
 *  best. Below the floor fails; above the band is legal but harsh (glare, halation in dark mode). */
export interface Pair {
  id: string;
  label: string;
  fg: string;
  bg: string;
  /** WCAG 2.2 minimum: 4.5 small text, 3 large text and non-text marks, 0 decorative. */
  min: number;
  ideal: [number, number];
  why: string;
}

export const PAIRS: Pair[] = [
  { id: 'body', label: 'Body text', fg: 'ink', bg: 'ground', min: 4.5, ideal: [7, 15], why: 'Long reading: AAA 7:1 or more, short of pure black on white.' },
  { id: 'heading', label: 'Headings (24px+)', fg: 'ink-strong', bg: 'ground', min: 3, ideal: [9, 18], why: 'Large text needs only 3:1, but headings should be the darkest ink.' },
  { id: 'muted', label: 'Comments and captions', fg: 'ink-muted', bg: 'ground', min: 4.5, ideal: [4.5, 7], why: 'Readable, and clearly a step quieter than body text.' },
  { id: 'card', label: 'Body text on a card', fg: 'ink', bg: 'ground-raised', min: 4.5, ideal: [7, 15], why: 'Raising the face must not cost the text its contrast.' },
  { id: 'accent-text', label: 'Accent as small text', fg: 'accent-text', bg: 'ground', min: 4.5, ideal: [4.5, 8], why: 'Links and labels in the accent: the deeper, duller shade.' },
  { id: 'accent', label: 'Accent fill, icons, focus', fg: 'accent', bg: 'ground', min: 3, ideal: [3, 6], why: 'WCAG 1.4.11: buttons and marks need 3:1 to be seen.' },
  { id: 'button', label: 'Label on an accent button', fg: 'on-accent', bg: 'accent', min: 4.5, ideal: [4.5, 12], why: 'The button text is small text on the fill.' },
  { id: 'highlight', label: 'Text in the highlighter', fg: 'ink', bg: 'accent-soft', min: 4.5, ideal: [7, 15], why: 'A highlight marks text; it must not hide it.' },
  { id: 'accent2-text', label: 'Secondary accent as text', fg: 'accent2-text', bg: 'ground', min: 4.5, ideal: [4.5, 8], why: 'Same rule as the first accent.' },
  { id: 'line', label: 'Hairlines', fg: 'line', bg: 'ground', min: 0, ideal: [1.3, 2.2], why: 'Decorative: visible, never louder than text.' },
];

export type Verdict = 'fail' | 'pass' | 'ideal' | 'harsh';

export interface Reading {
  pair: Pair;
  ratio: number;
  verdict: Verdict;
}

export function verdict(ratio: number, p: Pair): Verdict {
  if (ratio < p.min) return 'fail';
  if (ratio > p.ideal[1]) return 'harsh';
  return ratio >= p.ideal[0] ? 'ideal' : 'pass';
}

export function readings(tokens: Token[]): Reading[] {
  return PAIRS.map((pair) => {
    const ratio = contrast(pick(tokens, pair.fg), pick(tokens, pair.bg));
    return { pair, ratio, verdict: verdict(ratio, pair) };
  });
}

/** WCAG level for a small-text ratio, as people name it. */
export const level = (ratio: number): string => (ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA large' : 'fail');

/** Type sizes and the contrast each wants, shown as the guide beside the pairs. */
export const SIZES = [
  { role: 'Display / h1', size: '40–64px', weight: '600–700', need: '3:1 min, 9:1+ ideal' },
  { role: 'h2–h3', size: '24–32px', weight: '600', need: '3:1 min, 7:1+ ideal' },
  { role: 'Body', size: '16–18px', weight: '400', need: '4.5:1 min, 7–15:1 ideal' },
  { role: 'Caption / meta', size: '13–14px', weight: '400–500', need: '4.5:1 min' },
  { role: 'Button label', size: '14–16px', weight: '600', need: '4.5:1 on the fill' },
];
