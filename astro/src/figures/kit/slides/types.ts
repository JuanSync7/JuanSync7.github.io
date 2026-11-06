export type SlideTag = 'path' | 'rect' | 'circle' | 'ellipse' | 'line';
export interface SlideNode {
  tag: SlideTag;
  attrs: Record<string, string>;
}
export interface SlideStroke extends SlideNode {
  role: 'line' | 'signal';
}
export type SlideDrawing = readonly SlideStroke[];
export type SlideTone = 'night' | 'paper';
export interface SlideOptions {
  tone: SlideTone;
  accent: boolean;
}
export const SLIDE_SIZE = 24;
export const SLIDE_WEIGHT = 1;
export const SLIDE_DEFAULT: SlideOptions = { tone: 'night', accent: true };
