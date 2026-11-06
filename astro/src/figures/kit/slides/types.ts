export interface SlideStroke {
  d: string;
  role: 'line' | 'quiet' | 'signal';
}
export type SlideDrawing = readonly SlideStroke[];
export type SlideTone = 'night' | 'paper';
export interface SlideOptions {
  tone: SlideTone;
  accent: boolean;
}
export const SLIDE_SIZE = 64;
export const SLIDE_WEIGHT = 1.25;
export const SLIDE_DEFAULT: SlideOptions = { tone: 'night', accent: true };
