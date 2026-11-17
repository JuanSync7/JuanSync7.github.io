// Boxes sized to the page width alone: a square window's far corner falls outside the clip.
export const rule = 'PT-6';
export const kernel = (k) => ({ ...k, boxes: (w, h) => ({ span: w, width: 2 * w, height: w }) });
