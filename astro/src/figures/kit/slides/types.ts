import policy from './policy.json';
export type SlideTag = 'path' | 'rect' | 'circle' | 'ellipse' | 'line' | 'polyline' | 'polygon';
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
export const SLIDE_SIZE = policy.grid;
export const SLIDE_EXPORT_SIZE = policy.exportSize;
export const SLIDE_WEIGHT = policy.stroke;
export const SLIDE_DEFAULT: SlideOptions = { tone: 'night', accent: true };
