import { SLIDE_ICONS, type SlideIconId } from '../../../data/slide-icons';
import { paper } from '../../../styles/tokens/palette';
import { hexOf } from '../ink';
import { slideDrawing } from './models';
import { SLIDE_SIZE, SLIDE_WEIGHT, type SlideOptions, type SlideStroke } from './types';

export function slidePalette(options: SlideOptions): Record<SlideStroke['role'] | 'ground', string> {
  const main = options.tone === 'paper' ? paper.ink : hexOf('ink');
  return {
    line: main,
    quiet: options.accent ? (options.tone === 'paper' ? paper.inkMuted : hexOf('inkMuted')) : main,
    signal: options.accent ? (options.tone === 'paper' ? paper.signal : hexOf('signal')) : main,
    ground: options.tone === 'paper' ? paper.ground : hexOf('ground'),
  };
}
const xml = (value: string): string =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c] ?? c);
const paths = (id: SlideIconId, options: SlideOptions): string => {
  const palette = slidePalette(options);
  return slideDrawing(id)
    .map((p) => `<path d="${p.d}" stroke="${palette[p.role]}"/>`)
    .join('');
};
const attributes = `viewBox="0 0 ${SLIDE_SIZE} ${SLIDE_SIZE}" fill="none" stroke-width="${SLIDE_WEIGHT}" stroke-linecap="round" stroke-linejoin="round"`;
export function slideSvg(id: SlideIconId, options: SlideOptions): string {
  const name = SLIDE_ICONS.find((icon) => icon.id === id)?.name ?? id;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SLIDE_SIZE}" height="${SLIDE_SIZE}" ${attributes} role="img"><title>${xml(name)}</title>${paths(id, options)}</svg>`;
}
export function slideSprite(options: SlideOptions): string {
  return `<svg xmlns="http://www.w3.org/2000/svg"><title>Juan Kok · slide icons</title><defs>${SLIDE_ICONS.map(
    (icon) =>
      `<symbol id="slide-${icon.id}" ${attributes}><title>${xml(icon.name)}</title>${paths(icon.id, options)}</symbol>`,
  ).join('')}</defs></svg>`;
}
export function slideAsset(id: SlideIconId, options: SlideOptions): string {
  return `/downloads/slide-icons/${options.tone}/${options.accent ? 'accent' : 'mono'}/${id}.svg`;
}
