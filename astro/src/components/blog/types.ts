export type Category = 'silicon' | 'software' | 'tutorials' | 'thoughts' | 'projects';
export type CardSize = 'large' | 'medium' | 'small';
export type LayoutMode = 'bento' | 'asymmetric' | 'masonry';
export type GlitchIntensity = 'low' | 'medium' | 'high';
export type ThoughtMode = 'banner' | 'ticker' | 'card';
export type SeriesView = 'daemon' | 'tree' | 'spines';

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  tags: string[];
  featured: boolean;
  size: CardSize;
  series?: string;
  week?: string;
}

export interface Tweaks {
  layout: LayoutMode;
  scanlines: boolean;
  crtVignette: boolean;
  glitchIntensity: GlitchIntensity;
  thoughtMode: ThoughtMode;
  seriesView: SeriesView;
}

export const TWEAK_DEFAULTS: Tweaks = {
  layout: 'masonry',
  scanlines: true,
  crtVignette: true,
  glitchIntensity: 'medium',
  thoughtMode: 'ticker',
  seriesView: 'daemon',
};
